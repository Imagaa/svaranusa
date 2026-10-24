<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    protected $fillable = ['seat_map_id', 'seat_category_id', 'code', 'row_index', 'col_index', 'status'];

    public function seatMap()
    {
        return $this->belongsTo(SeatMap::class);
    }

    public function seatCategory()
    {
        return $this->belongsTo(SeatCategory::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function waitlist()
    {
        return $this->hasMany(SeatWaitlist::class);
    }
}
