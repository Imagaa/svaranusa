<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seat;

class SeatController extends Controller
{
    public function index()
    {
        $seats = Seat::with('seatCategory')->get()->map(fn($seat) => [
            'id' => $seat->id,
            'code' => $seat->code,
            'row_index' => $seat->row_index,
            'col_index' => $seat->col_index,
            'status' => $seat->status,
            'category' => [
                'id' => $seat->seatCategory->id,
                'name' => $seat->seatCategory->name,
                'label' => $seat->seatCategory->label,
                'price' => $seat->seatCategory->price,
                'color' => $seat->seatCategory->color,
            ],
        ]);

        return response()->json($seats);
    }
}