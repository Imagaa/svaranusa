<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class TicketController extends Controller
{
    public function index(Request $request, $orderCode)
    {
        $order = Order::where('order_code', $orderCode)
            ->with(['items.seat', 'items.seatCategory'])
            ->firstOrFail();

        if ($order->status !== 'paid') {
            return response()->json([
                'message' => 'Tiket belum dapat diakses. Selesaikan pembayaran terlebih dahulu.'
            ], 403);
        }

        // Tahap 1: hanya order code → kembalikan hint email
        if (!$request->filled('email')) {
            $email = $order->buyer_email;
            $parts = explode('@', $email);
            $hint  = substr($parts[0], 0, 3) . str_repeat('*', max(3, strlen($parts[0]) - 3)) . '@' . $parts[1];

            return response()->json([
                'order_code' => $order->order_code,
                'buyer_name' => $order->buyer_name,
                'email_hint' => $hint,
                'verified'   => false,
            ]);
        }

        // Tahap 2: cocokkan email
        if (strtolower(trim($request->email)) !== strtolower(trim($order->buyer_email))) {
            return response()->json([
                'message' => 'Email tidak sesuai dengan order ini.'
            ], 403);
        }

        // Return detail tiket
        $tickets = $order->items->map(function ($item, $index) use ($order) {
            return [
                'ticket_code'   => $item->ticket_code,
                'ticket_number' => 'TIKET ' . ($index + 1) . ' DARI ' . $order->items->count(),
                'seat_code'     => $item->seat?->code,
                'seat_category' => $item->seatCategory?->name,
                'buyer_name'    => $order->buyer_name,
                'buyer_email'   => $order->buyer_email,
                'price'         => $item->price,
                'checked_in_at' => $item->checked_in_at,
            ];
        });

        return response()->json([
            'order_code'    => $order->order_code,
            'buyer_name'    => $order->buyer_name,
            'total_tickets' => $tickets->count(),
            'tickets'       => $tickets,
            'verified'      => true,
        ]);
    }

    public function download($orderCode)
    {
        $order = Order::where('order_code', $orderCode)
            ->with(['items.seat.seatCategory'])
            ->firstOrFail();

        if ($order->status !== 'paid') {
            return response()->json(['message' => 'E-Ticket belum tersedia. Pembayaran belum dikonfirmasi.'], 403);
        }

        $pdf = Pdf::loadView('pdf.eticket', ['order' => $order]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download("SVARANUSA-TICKET-{$order->order_code}.pdf");
    }
}
