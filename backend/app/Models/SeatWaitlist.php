<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeatWaitlist extends Model
{
    protected $fillable = ['seat_id', 'buyer_email', 'buyer_name', 'position', 'notified'];

    protected $casts = [
        'notified' => 'boolean',
    ];

    public function seat()
    {
        return $this->belongsTo(Seat::class);
    }
}
