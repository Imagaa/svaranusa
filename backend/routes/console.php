<?php

use App\Events\SeatStatusUpdated;
use App\Models\SeatReservation;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Bawaan Laravel (tetap dipertahankan)
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Scheduler: auto expire reservasi kursi tiap 1 menit ────
Schedule::call(function () {
    $expiredSeats = SeatReservation::expired()
        ->pluck('seat_code')
        ->toArray();

    if (empty($expiredSeats)) return;

    SeatReservation::expired()->update(['status' => 'expired']);

    $payload = array_map(
        fn($seat) => ['seat_code' => $seat, 'status' => 'available'],
        $expiredSeats
    );

    broadcast(new SeatStatusUpdated($payload));

})->everyMinute()->name('expire-seat-reservations');