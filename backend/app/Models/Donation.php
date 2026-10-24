<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    protected $fillable = [
        'donation_code',
        'donor_name',
        'donor_email',
        'donor_phone',
        'amount',
        'status',
        'midtrans_order_id',
        'qris_url',
        'midtrans_response',
        'paid_at',
        'expires_at',
    ];

    protected $casts = [
        'midtrans_response' => 'array',
        'paid_at'           => 'datetime',
        'expires_at'        => 'datetime',
    ];
}
