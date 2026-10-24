<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\FormSchemaController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SeatCategoryController;
use App\Http\Controllers\Api\SeatMapController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\WaitlistController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

// ── Health check ────────────────────────────────────────────
Route::get('/health', fn() => response()->json([
    'status' => 'ok',
    'role'   => env('APP_ROLE', 'web'),
    'time'   => now(),
]));

// ── Webhook Midtrans ──────────────────────────────────────────
Route::post('/webhooks/midtrans', [WebhookController::class, 'midtrans']);

// ── Auth (public) ───────────────────────────────────────────────
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/login',    [AuthController::class, 'login']);
});

// ── Public routes ───────────────────────────────────────────
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/orders/{orderCode}',         [OrderController::class, 'show']);
    Route::get('/orders/{orderCode}/tickets', [TicketController::class, 'index']);
    Route::get('/orders/{orderCode}/download', [TicketController::class, 'download']);
    Route::get('/tickets/{ticketCode}',       [TicketController::class, 'show']);

    Route::get('/seats/status',    [ReservationController::class, 'status']);
    Route::get('/seat-map',        [SeatMapController::class, 'show']);
    Route::get('/seat-map/seats',  [SeatMapController::class, 'seats']);
    Route::get('/seat-categories', [SeatCategoryController::class, 'index']);

    // Ruang Berbagi
    Route::post('/donations',                   [DonationController::class, 'store']);
    Route::get('/donations/{code}',             [DonationController::class, 'show']);
    Route::post('/donations/{code}/qris',       [DonationController::class, 'createQris']);
});

// ── Reservasi kursi ──────────────────────────────────────────
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/reservations',   [ReservationController::class, 'store']);
    Route::delete('/reservations', [ReservationController::class, 'destroy']);
});

// ── Order & payment ──────────────────────────────────────────
Route::middleware('throttle:20,1')->group(function () {
    Route::post('/orders',                    [OrderController::class, 'store']);
    Route::post('/orders/{orderCode}/cancel', [OrderController::class, 'cancel']);
    Route::post('/payments/qris',             [PaymentController::class, 'createQris']);
});

// ── Waitlist ───────────────────────────────────────────────────
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/seats/{seatId}/waitlist',   [WaitlistController::class, 'join']);
    Route::delete('/seats/{seatId}/waitlist', [WaitlistController::class, 'leave']);
});

// ── Admin routes ───────────────────────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {

    // Proteksi Spam Khusus Scanner & Email
    Route::post('/admin/orders/{orderCode}/resend-ticket', [AdminController::class, 'resendTicket'])->middleware('throttle:20,1');
    Route::post('/admin/checkin/verify', [CheckInController::class, 'verify'])->middleware('throttle:40,1');
    Route::post('/admin/donations/{code}/resend', [AdminController::class, 'resendDonationEmail'])->middleware('throttle:20,1');
    
    // Group 60 request per menit untuk sisanya
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        Route::post('/seat-map',         [SeatMapController::class, 'store']);
        Route::post('/seat-map/publish', [SeatMapController::class, 'publish']);

        Route::post('/seat-categories',                   [SeatCategoryController::class, 'store']);
        Route::put('/seat-categories/{seatCategory}',     [SeatCategoryController::class, 'update']);
        Route::delete('/seat-categories/{seatCategory}',  [SeatCategoryController::class, 'destroy']);

        Route::get('/admin/form-schemas',                [FormSchemaController::class, 'index']);
        Route::post('/admin/form-schemas',               [FormSchemaController::class, 'store']);
        Route::put('/admin/form-schemas/{formSchema}',   [FormSchemaController::class, 'update']);
        Route::delete('/admin/form-schemas/{formSchema}', [FormSchemaController::class, 'destroy']);

        Route::get('/admin/orders',           [AdminController::class, 'orders']);
        Route::get('/admin/orders/export',    [AdminController::class, 'exportOrders']);
        Route::get('/admin/vip-orders',       [AdminController::class, 'getVipOrders']);
        Route::delete('/admin/vip-orders/{orderCode}', [AdminController::class, 'revokeVipOrder']);
        Route::post('/admin/shows/{show}/toggle-status', [AdminController::class, 'toggleShowStatus']);
        Route::post('/admin/vip-reservations', [AdminController::class, 'storeVipReservation']);
        Route::get('/admin/checkins',         [AdminController::class, 'checkins']);
        Route::get('/admin/checkins/export',  [AdminController::class, 'exportCheckins']);
        Route::get('/admin/donations',        [AdminController::class, 'donations']);
        Route::get('/admin/donations/export', [AdminController::class, 'exportDonations']);
        Route::get('/admin/summary',          [AdminController::class, 'summary']);

        Route::post('/checkin',               [CheckInController::class, 'checkin']);
        Route::get('/admin/checkin/export',   [CheckInController::class, 'export']);
    });
});