<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Seat;
use App\Models\SeatReservation;
use App\Jobs\ExpireOrderJob;
use App\Events\SeatStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    const MAX_SEATS_PER_ORDER = 15;
    const LOCK_TTL = 900; // 15 Menit waktu tunggu pembayaran

    public function store(Request $request)
    {
        // 1. Validasi Data dari Frontend
        $validated = $request->validate([
            'seat_codes'      => 'required|array|min:1|max:' . self::MAX_SEATS_PER_ORDER,
            'seat_codes.*'    => 'required|string|max:10',
            'buyer_name'      => 'required|string|max:255',
            'buyer_email'     => 'required|email|max:255',
            'buyer_phone'     => 'required|string|max:20',
            'nominal_bayar'   => 'required|numeric|min:0',
            'show'            => 'required|string'
        ]);

        $seatCodes = $validated['seat_codes'];
        
        // AMAN DARI HURUF KECIL/BESAR DI PROXY: Ambil X-Session-Token atau x-session-token
        $sessionToken = $request->header('X-Session-Token') ?? $request->header('x-session-token');

        try {
            // 2. DATABASE TRANSACTION DENGAN PESSIMISTIC LOCKING
            $order = DB::transaction(function () use ($validated, $seatCodes, $sessionToken) {
                
                $seats = Seat::whereIn('code', $seatCodes)
                    ->whereHas('seatMap', function($q) use ($validated) {
                        $q->where('show_identifier', $validated['show']);
                    })
                    ->with('seatCategory')
                    ->lockForUpdate()
                    ->get();

                if ($seats->count() !== count($seatCodes)) {
                    throw new \Exception('Beberapa kode kursi tidak ditemukan di jadwal ini.', 422);
                }

                // --- PERBAIKAN LOGIKA PENGECEKAN KURSI ---
                foreach ($seats as $seat) {
                    // Cek apakah kursi sedang di-hold oleh orang lain
                    $isReservedByOther = SeatReservation::active()
                        ->where('seat_code', $seat->code)
                        ->where('session_token', '!=', $sessionToken) // Hanya tolak jika token BEDA
                        ->exists();

                    // Izinkan kursi jika statusnya 'available' ATAU jika itu adalah reservasi diri sendiri
                    // (Logika: Kalau token sama, kita tidak akan menganggapnya sebagai conflict)
                    if ($seat->status !== 'available' && $isReservedByOther) {
                        throw new \Exception("Mohon maaf, kursi {$seat->code} baru saja diambil orang lain.", 409);
                    }
                }

                // Kalkulasi Harga
                $totalPrice = $seats->sum(fn($s) => $s->seatCategory->price);
                $adminFee   = (int) ceil($totalPrice * 0.007);
                $grandTotal = $totalPrice + $adminFee;
                
                // Pastikan nominal bayar tidak kurang dari grand total
                $paidAmount = max($validated['nominal_bayar'], $grandTotal);

                // Buat Order
                $order = Order::create([
                    'order_code'      => 'SVR-' . strtoupper(Str::random(8)),
                    'buyer_name'      => $validated['buyer_name'],
                    'buyer_email'     => $validated['buyer_email'],
                    'buyer_phone'     => $validated['buyer_phone'],
                    'total_price'     => $grandTotal,
                    'paid_amount'     => $paidAmount,
                    'status'          => 'pending',
                    'expires_at'      => now()->addSeconds(self::LOCK_TTL),
                ]);

                // Buat Order Item & Ubah status kursi jadi 'locked'
                foreach ($seats as $seat) {
                    OrderItem::create([
                        'order_id'         => $order->id,
                        'seat_id'          => $seat->id,
                        'seat_category_id' => $seat->seat_category_id,
                        'price'            => $seat->seatCategory->price,
                        'ticket_code'      => 'TKT-' . strtoupper(Str::random(10)),
                    ]);

                    $seat->update(['status' => 'locked']);
                    
                    // Hapus data booking sementara
                    SeatReservation::where('seat_code', $seat->code)->delete();
                }

                return $order;
            });

            // 3. Broadcast ke Reverb
            $broadcastPayload = collect($seatCodes)->map(fn($code) => [
                'seat_code' => $code,
                'status'    => 'locked',
            ])->toArray();

            try {
                broadcast(new SeatStatusUpdated($broadcastPayload))->toOthers();
            } catch (\Exception $e) {
                // Abaikan jika Reverb sedang mati sesaat
            }

            // 4. Jadwalkan Worker Expire
            ExpireOrderJob::dispatch($order->id)->delay(now()->addSeconds(self::LOCK_TTL));

            return response()->json([
                'message'     => 'Order berhasil dibuat',
                'order_code'  => $order->order_code,
                'total_price' => $order->total_price,
                'paid_amount' => $order->paid_amount,
                'expires_at'  => $order->expires_at,
            ], 201);

        } catch (\Exception $e) {
            $status = $e->getCode() === 409 || $e->getCode() === 422 ? $e->getCode() : 500;
            return response()->json([
                'message' => $e->getMessage() ?: 'Terjadi kesalahan sistem saat membuat order.',
            ], $status);
        }
    }

    public function cancel($orderCode)
    {
        $order = \App\Models\Order::where('order_code', $orderCode)->firstOrFail();

        // Hanya boleh membatalkan jika statusnya masih 'pending'
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Hanya order pending yang dapat dibatalkan.'], 400);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            // 1. Ubah status kursi menjadi 'available' kembali
            foreach ($order->items as $item) {
                if ($item->seat) {
                    $item->seat->update(['status' => 'available']);
                }
            }
            // 2. Ubah status order menjadi 'cancelled'
            $order->update(['status' => 'cancelled']);
        });

        // 3. Broadcast agar kursi langsung terbuka di layar pengunjung lain
        $broadcastPayload = $order->items->map(function ($item) {
            return ['seat_code' => $item->seat->code, 'status' => 'available'];
        })->toArray();

        try {
            broadcast(new \App\Events\SeatStatusUpdated($broadcastPayload))->toOthers();
        } catch (\Exception $e) { }

        return response()->json(['message' => 'Pesanan berhasil dibatalkan']);
    }
}