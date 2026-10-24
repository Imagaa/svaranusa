<?php

namespace App\Http\Controllers\Api;

use App\Events\SeatStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Seat;
use App\Models\SeatReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    const RESERVATION_MINUTES = 10; // Waktu kursi dikunci kuning di layar (10 menit)

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'seats'   => 'required|array|min:1|max:15', 
            'seats.*' => 'required|string|max:10',
            'show'    => 'required|string',
        ]);

        $requestedSeats = $request->seats;
        $showIdentifier = $request->show;
        $sessionToken   = $this->resolveSessionToken($request);

        $seatMap = \App\Models\SeatMap::where('show_identifier', $showIdentifier)->latest()->first();
        if (!$seatMap || !$seatMap->is_active) {
            return response()->json(['message' => 'Pendaftaran untuk sesi ini telah ditutup.'], 403);
        }

        try {
            $result = DB::transaction(function () use ($requestedSeats, $showIdentifier, $sessionToken) {
                // Kunci baris kursi agar tidak ditabrak user lain saat pengecekan
                $seats = Seat::whereIn('code', $requestedSeats)
                    ->whereHas('seatMap', function($q) use ($showIdentifier) {
                        $q->where('show_identifier', $showIdentifier);
                    })
                    ->lockForUpdate()
                    ->get();

                if ($seats->count() !== count($requestedSeats)) {
                    throw new \Exception('Beberapa kursi tidak valid untuk jadwal ini.');
                }

                $conflictSeats = [];
                $availableSeatCodes = [];

                foreach ($seats as $seat) {
                    // Cek apakah ada reservasi SEMENTARA dari orang lain
                    $isReservedByOther = SeatReservation::active()
                        ->where('seat_code', $seat->code)
                        ->where('session_token', '!=', $sessionToken)
                        ->exists();

                    if ($seat->status !== 'available' || $isReservedByOther) {
                        $conflictSeats[] = $seat->code;
                    } else {
                        $availableSeatCodes[] = $seat->code;
                    }
                }

                if (count($conflictSeats) === count($requestedSeats)) {
                    return ['status' => 'all_conflict', 'conflict' => $conflictSeats, 'available' => []];
                }

                if (!empty($conflictSeats)) {
                    return ['status' => 'partial_conflict', 'conflict' => $conflictSeats, 'available' => $availableSeatCodes];
                }

                $expiredAt = now()->addMinutes(self::RESERVATION_MINUTES);

                // Hapus sisa reservasi lama user ini yang menggantung
                SeatReservation::where('session_token', $sessionToken)->where('status', 'reserved')->delete();

                // Simpan reservasi baru
                $insertData = array_map(fn($code) => [
                    'seat_code'     => $code,
                    'user_id'       => null, // Guest Mode
                    'session_token' => $sessionToken,
                    'status'        => 'reserved',
                    'expired_at'    => $expiredAt,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ], $availableSeatCodes);

                SeatReservation::insert($insertData);

                return [
                    'status'        => 'success',
                    'conflict'      => [],
                    'available'     => $availableSeatCodes,
                    'expired_at'    => $expiredAt->toIso8601String(),
                    'session_token' => $sessionToken,
                ];
            });

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }

        // Tembakkan WebSockets agar HP user lain berubah warna jadi kuning
        if ($result['status'] === 'success') {
            $broadcastPayload = array_map(
                fn($seat) => ['seat_code' => $seat, 'status' => 'reserved'],
                $result['available']
            );
            try { broadcast(new SeatStatusUpdated($broadcastPayload))->toOthers(); } catch (\Exception $e) {}
        }

        $httpStatus = match($result['status']) {
            'all_conflict', 'partial_conflict' => 409,
            default => 201,
        };

        return response()->json($result, $httpStatus);
    }

    public function destroy(Request $request): JsonResponse
    {
        $sessionToken = $this->resolveSessionToken($request);
        $seats = SeatReservation::where('session_token', $sessionToken)->where('status', 'reserved')->get(['seat_code']);
        SeatReservation::where('session_token', $sessionToken)->where('status', 'reserved')->delete();

        if ($seats->isNotEmpty()) {
            $broadcastPayload = $seats->map(fn($s) => ['seat_code' => $s->seat_code, 'status' => 'available'])->toArray();
            try { broadcast(new SeatStatusUpdated($broadcastPayload))->toOthers(); } catch (\Exception $e) {}
        }

        return response()->json(['message' => 'Reservasi dibatalkan.']);
    }

    public function status(Request $request): JsonResponse
    {
        $show = $request->query('show');

        $seatQuery = Seat::whereIn('status', ['sold', 'locked']);
        if ($show) {
            $seatQuery->whereHas('seatMap', fn($q) => $q->where('show_identifier', $show));
        }
        $seatStatuses = $seatQuery->pluck('status', 'code')->toArray();

        $reservationQuery = SeatReservation::active();
        if ($show) {
            $activeCodes = $reservationQuery->pluck('seat_code')->toArray();
            $validCodes = Seat::whereIn('code', $activeCodes)
                              ->whereHas('seatMap', fn($q) => $q->where('show_identifier', $show))
                              ->pluck('code')->toArray();
            $reservations = array_fill_keys($validCodes, 'reserved');
        } else {
            $reservations = $reservationQuery->pluck('status', 'seat_code')->toArray();
        }

        return response()->json(['seats' => array_merge($reservations, $seatStatuses)]);
    }

    private function resolveSessionToken(Request $request): string
    {
        return $request->header('X-Session-Token') ?? Str::random(64);
    }
}