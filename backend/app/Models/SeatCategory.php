<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeatCategory extends Model
{
    protected $fillable = ['name', 'label', 'price', 'color', 'quota', 'available'];

    public function seats()
    {
        return $this->hasMany(Seat::class);
    }
}
