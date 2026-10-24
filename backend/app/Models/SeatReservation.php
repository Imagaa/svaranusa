<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class SeatReservation extends Model
{
    protected $fillable = [
        'seat_code',
        'user_id',
        'session_token',
        'status',
        'expired_at',
    ];

    protected $casts = [
        'expired_at' => 'datetime',
    ];

    // ── Scope: reservasi yang masih aktif (belum expired) ───
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'reserved')
                     ->where('expired_at', '>', now());
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('status', 'reserved')
                    ->where('expired_at', '<=', now());
    }

    // ── Helper: return map { seat_code => status } untuk semua kursi aktif
    public static function getActiveStatusMap(): array
    {
        return static::active()
            ->pluck('status', 'seat_code')
            ->toArray();
    }

    // ── Relasi ke Seat (via seat_code — bukan seat_id) ──────
    public function seat()
    {
        return $this->belongsTo(Seat::class, 'seat_code', 'code');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
