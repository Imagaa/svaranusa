<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'order_id', 'midtrans_order_id', 'payment_type',
        'gross_amount', 'status', 'qris_url', 'paid_at', 'midtrans_response'
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'midtrans_response' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
