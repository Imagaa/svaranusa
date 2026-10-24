<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'seat_id', 'seat_category_id',
        'price', 'ticket_code', 'checked_in_at',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function seat()
    {
        return $this->belongsTo(Seat::class);
    }

    public function seatCategory()
    {
        return $this->belongsTo(SeatCategory::class);
    }
}
