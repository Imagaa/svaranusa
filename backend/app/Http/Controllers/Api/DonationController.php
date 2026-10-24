<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DonationController extends Controller
{
    const QRIS_EXPIRY_MINUTES = 30;

    // ── POST /api/donations ───────────────────────────────────
    // Buat record donasi. Kolom 'amount' di DB menyimpan nominal donasi MURNI.
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'donor_name'  => 'required|string|max:255',
            'donor_email' => 'required|email|max:255',
            'donor_phone' => ['required', 'string', 'regex:/^62[0-9]{9,13}$/'],
            'amount'      => 'required|integer|min:5000',
        ]);

        $donation = Donation::create([
            'donation_code' => 'DON-' . strtoupper(Str::random(8)),
            'donor_name'    => $validated['donor_name'],
            'donor_email'   => $validated['donor_email'],
            'donor_phone'   => $validated['donor_phone'],
            'amount'        => $validated['amount'], // <- Nominal murni, ini yang dibaca oleh Dashboard
            'status'        => 'pending',
            'expires_at'    => now()->addMinutes(self::QRIS_EXPIRY_MINUTES),
        ]);

        return response()->json([
            'donation_code' => $donation->donation_code,
            'amount'        => $donation->amount,
            'expires_at'    => $donation->expires_at->toIso8601String(),
        ], 201);
    }

    // ── GET /api/donations/{code} ─────────────────────────────
    // Cek status donasi (dipakai polling dari frontend)
    public function show(string $code): JsonResponse
    {
        $donation = Donation::where('donation_code', $code)->firstOrFail();

        return response()->json([
            'donation_code' => $donation->donation_code,
            'status'        => $donation->status,
            'amount'        => $donation->amount,
            'donor_name'    => $donation->donor_name,
            'paid_at'       => $donation->paid_at?->toIso8601String(),
        ]);
    }

    // ── POST /api/donations/{code}/qris ───────────────────────
    // Charge Midtrans QRIS untuk donasi
    public function createQris(string $code): JsonResponse
    {
        $donation = Donation::where('donation_code', $code)
            ->where('status', 'pending')
            ->firstOrFail();

        if (now()->gt($donation->expires_at)) {
            $donation->update(['status' => 'expired']);
            return response()->json(['message' => 'Donasi sudah expired, silakan ulangi.'], 410);
        }

        // Idempotent: kembalikan QRIS yang sudah ada
        if ($donation->qris_url) {
            return response()->json([
                'qris_url'   => $donation->qris_url,
                'expires_at' => $donation->expires_at->toIso8601String(),
            ]);
        }

        $midtransOrderId = $donation->donation_code . '-' . time();
        $serverKey       = config('services.midtrans.server_key');
        $baseUrl         = config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';

        // ====================================================================
        // KALKULASI CHARGE MIDTRANS: Nominal Murni + Biaya Admin QRIS 0.7%
        // ====================================================================
        $grossAmount = (int) ceil($donation->amount * 1.007);

        $payload = [
            'payment_type'        => 'qris',
            'transaction_details' => [
                'order_id'     => $midtransOrderId,
                'gross_amount' => $grossAmount, // Nominal yang muncul di layar HP Donatur
            ],
            'qris'                => ['acquirer' => 'gopay'],
            'customer_details'    => [
                'first_name' => $donation->donor_name,
                'email'      => $donation->donor_email,
                'phone'      => $donation->donor_phone,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . base64_encode($serverKey . ':'),
            'Content-Type'  => 'application/json',
        ])->post("{$baseUrl}/v2/charge", $payload);

        if ($response->failed()) {
            Log::error('Midtrans QRIS donation charge failed', [
                'donation_code' => $donation->donation_code,
                'response'      => $response->json(),
            ]);
            return response()->json([
                'message' => 'Gagal membuat QRIS',
                'detail'  => $response->json(),
            ], 500);
        }

        $data    = $response->json();
        $qrisUrl = $data['actions'][0]['url'] ?? null;

        if (empty($qrisUrl)) {
            Log::error('Midtrans QRIS URL kosong untuk donasi', [
                'donation_code' => $donation->donation_code,
                'response'      => $data,
            ]);
            return response()->json(['message' => 'QRIS tidak tersedia, coba beberapa saat lagi.'], 502);
        }

        $donation->update([
            'midtrans_order_id' => $midtransOrderId,
            'qris_url'          => $qrisUrl,
            'midtrans_response' => $data,
        ]);

        return response()->json([
            'qris_url'   => $qrisUrl,
            'expires_at' => $donation->expires_at->toIso8601String(),
        ]);
    }
}