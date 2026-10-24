<?php

namespace App\Http\Controllers\Api;

use App\Events\SeatStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Donation;
use App\Mail\EticketMail;
use App\Mail\DonationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class WebhookController extends Controller
{
    public function midtrans(Request $request)
    {
        $payload = $request->all();
        Log::info('Midtrans Webhook Payload: ', $payload);

        $orderCode = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;
        
        if (!$orderCode) {
            return response()->json(['message' => 'Order ID tidak ada'], 400);
        }

        // ====================================================================
        // 1. LOGIKA UNTUK DONASI DARI HALAMAN DEPAN (RUANG BERBAGI)
        // ====================================================================
        if (Str::startsWith($orderCode, 'DON-')) {
            $parts = explode('-', $orderCode);
            $realDonationCode = $parts[0] . '-' . $parts[1]; 

            $donation = Donation::where('donation_code', $realDonationCode)->first();
            
            if (!$donation) {
                Log::error('Webhook Midtrans: Donasi tidak ditemukan - ' . $orderCode);
                return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
            }

            if ($donation->status === 'paid' || $donation->status === 'expired') {
                return response()->json(['message' => 'Donasi sudah diproses']);
            }

            try {
                if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
                    if ($fraudStatus != 'challenge') {
                        $donation->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                        ]);

                        // KIRIM EMAIL UCAPAN TERIMA KASIH DONASI
                        try {
                            Mail::to($donation->donor_email)->send(new DonationMail($donation));
                        } catch (\Throwable $e) {
                            Log::error('Webhook Midtrans - Gagal kirim email donasi: ' . $e->getMessage());
                        }
                    }
                } else if (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                    $donation->update(['status' => 'expired']);
                }
                return response()->json(['message' => 'Webhook Donasi berhasil diproses dengan status 200 OK']);
            } catch (\Throwable $e) {
                Log::error('CRITICAL Webhook Donation DB Error: ' . $e->getMessage());
                return response()->json(['message' => 'Terjadi kesalahan saat memproses donasi'], 500);
            }
        }

        // ====================================================================
        // 2. LOGIKA UNTUK TIKET PESANAN (SVR-)
        // ====================================================================
        $order = Order::where('order_code', $orderCode)->with('items.seat')->first();
        
        if (!$order) {
            Log::error('Webhook Midtrans: Order tidak ditemukan - ' . $orderCode);
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->status === 'paid' || $order->status === 'expired') {
            return response()->json(['message' => 'Order sudah diproses']);
        }

        try {
            DB::transaction(function () use ($order, $transactionStatus, $fraudStatus) {
                $broadcastPayload = [];

                if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
                    if ($fraudStatus == 'challenge') {
                        $order->update(['status' => 'pending']); 
                    } else {
                        $order->update(['status' => 'paid']);
                        
                        foreach ($order->items as $item) {
                            $item->seat->update(['status' => 'sold']);
                            $broadcastPayload[] = ['seat_code' => $item->seat->code, 'status' => 'sold'];
                        }

                        try {
                            Mail::to($order->buyer_email)->send(new EticketMail($order));
                        } catch (\Throwable $e) {
                            Log::error('Webhook Midtrans - Gagal masuk antrean email tiket: ' . $e->getMessage());
                        }
                    }
                } else if (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                    $order->update(['status' => 'expired']);
                    
                    foreach ($order->items as $item) {
                        $item->seat->update(['status' => 'available']);
                        $broadcastPayload[] = ['seat_code' => $item->seat->code, 'status' => 'available'];
                    }
                }

                if (!empty($broadcastPayload)) {
                    try { broadcast(new SeatStatusUpdated($broadcastPayload)); } catch (\Exception $e) {}
                }
            });

            return response()->json(['message' => 'Webhook Tiket berhasil diproses dengan status 200 OK']);
        } catch (\Throwable $e) {
            Log::error('CRITICAL Webhook Order DB Error: ' . $e->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan internal server saat memproses tiket'], 500);
        }
    }
}