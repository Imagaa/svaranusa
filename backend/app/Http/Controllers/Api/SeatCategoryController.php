<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SeatCategory;
use Illuminate\Http\Request;

class SeatCategoryController extends Controller
{
    public function index()
    {
        return response()->json(SeatCategory::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:10',
            'label' => 'required|string|max:50',
            'price' => 'required|integer|min:0',
            'color' => 'required|string|size:7',
            'quota' => 'required|integer|min:1',
        ]);

        $category = SeatCategory::create([
            ...$validated,
            'available' => $validated['quota'],
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, SeatCategory $seatCategory)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:10',
            'label' => 'sometimes|string|max:50',
            'price' => 'sometimes|integer|min:0',
            'color' => 'sometimes|string|size:7',
            'quota' => 'sometimes|integer|min:1',
        ]);

        $seatCategory->update($validated);
        return response()->json($seatCategory);
    }

    public function destroy(SeatCategory $seatCategory)
    {
        $seatCategory->delete();
        return response()->json(['message' => 'Kategori dihapus']);
    }
}
