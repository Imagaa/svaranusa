<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function createQris(Request $request)
    {
        $request->validate([
            'order_code' => 'required|string|exists:orders,order_code'
        ]);

        $order = Order::where('order_code', $request->order_code)->first();

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Pesanan ini sudah tidak dapat dibayar (Expired/Paid).'], 400);
        }

        // PERBAIKAN: Jika qris_url sudah ada di database, langsung kembalikan tanpa hit Midtrans lagi
        if (!empty($order->qris_url)) {
            return response()->json(['qris_url' => $order->qris_url, 'status' => 'success']);
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        $isProduction = env('MIDTRANS_IS_PRODUCTION', false);
        $baseUrl = $isProduction 
            ? 'https://api.midtrans.com/v2/charge' 
            : 'https://api.sandbox.midtrans.com/v2/charge';

        if (!$serverKey) {
            return response()->json(['message' => 'Konfigurasi Midtrans Server Key belum diatur di .env'], 500);
        }

        $cleanPhone = preg_replace('/[^0-9\+]/', '', $order->buyer_phone);
        $cleanName  = substr(trim($order->buyer_name), 0, 50);

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post($baseUrl, [
                    'payment_type' => 'qris',
                    'transaction_details' => [
                        'order_id'     => $order->order_code,
                        'gross_amount' => (int) $order->paid_amount,
                    ],
                    'customer_details' => [
                        'first_name' => $cleanName,
                        'email'      => $order->buyer_email,
                        'phone'      => $cleanPhone,
                    ],
                    'qris' => [
                        'acquirer' => 'gopay'
                    ],
                    'custom_expiry' => [
                        'expiry_duration' => 15,
                        'unit'            => 'minute'
                    ]
                ]);

            $result = $response->json();

            if ($response->successful() && isset($result['actions'])) {
                $qrisUrl = collect($result['actions'])->where('name', 'generate-qr-code')->first()['url'] ?? null;

                if ($qrisUrl) {
                    // PERBAIKAN: Simpan URL QRIS ke database agar bisa digunakan ulang saat di-refresh
                    $order->update(['qris_url' => $qrisUrl]);

                    return response()->json(['qris_url' => $qrisUrl, 'status' => 'success']);
                }
            }

            Log::error('Midtrans QRIS Error: ', $result);
            return response()->json(['message' => 'Gagal mendapatkan QRIS dari Midtrans.', 'midtrans_response' => $result], 500);

        } catch (\Exception $e) {
            Log::error('Midtrans Exception: ' . $e->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan sistem server pembayaran.'], 500);
        }
    }
}