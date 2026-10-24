<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seat;
use App\Models\SeatWaitlist;
use Illuminate\Http\Request;

class WaitlistController extends Controller
{
    public function join(Request $request, $seatId)
    {
        $seat = Seat::findOrFail($seatId);

        $validated = $request->validate([
            'buyer_name' => 'required|string|max:255',
            'buyer_email' => 'required|email|max:255',
        ]);

        // Cek sudah ada di waitlist
        $exists = SeatWaitlist::where('seat_id', $seatId)
            ->where('buyer_email', $validated['buyer_email'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Kamu sudah ada di antrian seat ini'], 409);
        }

        $position = SeatWaitlist::where('seat_id', $seatId)->max('position') + 1;

        $waitlist = SeatWaitlist::create([
            'seat_id' => $seatId,
            'buyer_name' => $validated['buyer_name'],
            'buyer_email' => $validated['buyer_email'],
            'position' => $position,
        ]);

        return response()->json([
            'message' => 'Berhasil masuk antrian',
            'position' => $position,
        ], 201);
    }

    public function leave(Request $request, $seatId)
    {
        $validated = $request->validate([
            'buyer_email' => 'required|email',
        ]);

        SeatWaitlist::where('seat_id', $seatId)
            ->where('buyer_email', $validated['buyer_email'])
            ->delete();

        return response()->json(['message' => 'Keluar dari antrian']);
    }
}