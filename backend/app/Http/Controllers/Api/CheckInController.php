<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    // POST /api/admin/checkin/verify — Placeholder Scanner (Hanya Baca)
    public function verify(Request $request)
    {
        $validated = $request->validate([
            'ticket_code' => 'required|string|exists:order_items,ticket_code',
        ]);

        $item = OrderItem::where('ticket_code', $validated['ticket_code'])
            ->with(['order', 'seat.seatCategory'])
            ->firstOrFail();

        if ($item->order->status !== 'paid') {
            return response()->json(['status' => 'invalid', 'message' => 'Tiket tidak valid — order belum dibayar'], 403);
        }

        if ($item->checked_in_at) {
            return response()->json([
                'status' => 'used',
                'message' => 'Tiket SUDAH PERNAH digunakan pada ' . $item->checked_in_at,
                'data' => [
                    'seat_code' => $item->seat->code,
                    'buyer_name' => $item->order->buyer_name,
                ]
            ]);
        }

        return response()->json([
            'status' => 'valid',
            'message' => 'Tiket VALID (Belum Digunakan)',
            'data' => [
                'seat_code' => $item->seat->code,
                'buyer_name' => $item->order->buyer_name,
            ]
        ]);
    }

    // POST /api/checkin — check in by ticket_code
    public function checkin(Request $request)
    {
        $validated = $request->validate([
            'ticket_code' => 'required|string|exists:order_items,ticket_code',
        ]);

        $item = OrderItem::where('ticket_code', $validated['ticket_code'])
            ->with(['order', 'seat.seatCategory'])
            ->firstOrFail();

        if ($item->order->status !== 'paid') {
            return response()->json(['message' => 'Tiket tidak valid — order belum dibayar'], 403);
        }

        if ($item->checked_in_at) {
            return response()->json([
                'message'       => 'Tiket sudah digunakan',
                'checked_in_at' => $item->checked_in_at,
                'ticket_code'   => $item->ticket_code,
                'seat_code'     => $item->seat->code,
                'buyer_name'    => $item->order->buyer_name,
            ], 409);
        }

        $item->update(['checked_in_at' => now()]);

        return response()->json([
            'message'       => 'Check in berhasil',
            'checked_in_at' => $item->checked_in_at,
            'ticket_code'   => $item->ticket_code,
            'seat_code'     => $item->seat->code,
            'buyer_name'    => $item->order->buyer_name,
            'seat_category' => $item->seat->seatCategory->name, // ← FIX
        ]);
    }

    // GET /api/admin/checkin/export — download semua data checkin
    public function export()
    {
        $items = OrderItem::with(['order', 'seat.seatCategory'])
            ->whereNotNull('checked_in_at')
            ->get()
            ->map(fn($item) => [
                'ticket_code'   => $item->ticket_code,
                'order_code'    => $item->order->order_code,
                'buyer_name'    => $item->order->buyer_name,
                'buyer_email'   => $item->order->buyer_email,
                'buyer_phone'   => $item->order->buyer_phone,
                'seat_code'     => $item->seat->code,
                'seat_category' => $item->seat->seatCategory->name, // ← FIX
                'checked_in_at' => $item->checked_in_at,
            ]);

        return response()->json([
            'total' => $items->count(),
            'data'  => $items,
        ]);
    }
}