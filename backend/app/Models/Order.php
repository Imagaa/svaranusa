<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_code', 'buyer_name', 'buyer_email',
        'buyer_phone', 'buyer_instagram',
        'total_price', 'paid_amount',
        'status', 'expires_at',
        'qris_url',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    public function formResponse()
    {
        return $this->hasOne(OrderFormResponse::class);
    }
}
