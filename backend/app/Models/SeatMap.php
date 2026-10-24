<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeatMap extends Model
{
    protected $fillable = [
        'show_identifier',
        'name',
        'venue',
        'layout_svg',
        'event_date',
        'is_active',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function seats()
    {
        return $this->hasMany(Seat::class);
    }
}
