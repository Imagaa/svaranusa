<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Seat;
use App\Models\SeatCategory;
use App\Models\SeatMap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeatMapController extends Controller
{
    // GET /api/seat-map?show=show1
    // Jika parameter show tidak dikirim, fallback ke seatmap terbaru (backward compatible)
    public function show(Request $request)
    {
        $show    = $request->query('show');
        $query   = SeatMap::with('seats.seatCategory');

        if ($show) {
            $query->where('show_identifier', $show);
        }

        $seatMap = $query->latest()->first();

        if (!$seatMap) {
            return response()->json(['message' => 'Seat map belum dibuat'], 404);
        }

        return response()->json($seatMap);
    }

    // POST /api/seat-map  (admin only)
    // Tambah validasi show_identifier
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rows'            => 'required|integer|min:1|max:100',
            'cols'            => 'required|integer|min:1|max:100',
            'grid'            => 'required|array',
            'show_identifier' => 'required|in:show1,show2',
        ]);

        // Cek order aktif sebelum hapus seat map show yang sama
        $hasActiveOrders = Order::whereIn('status', ['pending', 'paid'])
            ->whereHas('items.seat.seatMap', function ($q) use ($validated) {
                $q->where('show_identifier', $validated['show_identifier']);
            })
            ->exists();

        if ($hasActiveOrders) {
            return response()->json([
                'message' => 'Tidak bisa mengganti seat map saat ada order aktif (pending/paid) untuk show ini',
            ], 409);
        }

        DB::transaction(function () use ($validated) {
            // Hanya hapus seatmap show yang sama
            SeatMap::where('show_identifier', $validated['show_identifier'])->delete();

            $seatMap = SeatMap::create([
                'rows'            => $validated['rows'],
                'cols'            => $validated['cols'],
                'grid'            => $validated['grid'],
                'is_published'    => false,
                'show_identifier' => $validated['show_identifier'],
            ]);

            $categoryCounters = [];
            $seatsToInsert    = [];

            foreach ($validated['grid'] as $rowIndex => $row) {
                foreach ($row as $colIndex => $cell) {
                    if (!$cell || in_array($cell['type'], ['empty', 'stage', 'aisle', 'blocked'])) {
                        continue;
                    }

                    $categoryId = $cell['category_id'];
                    $category   = SeatCategory::find($categoryId);
                    if (!$category) {
                        continue;
                    }

                    if (!isset($categoryCounters[$categoryId])) {
                        $categoryCounters[$categoryId] = 1;
                    }

                    $code = $category->name . $categoryCounters[$categoryId];
                    $categoryCounters[$categoryId]++;

                    $seatsToInsert[] = [
                        'seat_map_id'      => $seatMap->id,
                        'seat_category_id' => $categoryId,
                        'code'             => $code,
                        'row_index'        => $rowIndex,
                        'col_index'        => $colIndex,
                        'status'           => 'available',
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                }
            }

            foreach ($categoryCounters as $categoryId => $count) {
                SeatCategory::where('id', $categoryId)->update(['available' => $count - 1]);
            }

            foreach (array_chunk($seatsToInsert, 500) as $chunk) {
                Seat::insert($chunk);
            }
        });

        return response()->json(['message' => 'Seat map berhasil disimpan'], 201);
    }

    // POST /api/seat-map/publish?show=show1
    public function publish(Request $request)
    {
        $show    = $request->query('show');
        $query   = SeatMap::latest();

        if ($show) {
            $query->where('show_identifier', $show);
        }

        $seatMap = $query->first();

        if (!$seatMap) {
            return response()->json(['message' => 'Seat map tidak ditemukan'], 404);
        }

        $seatMap->update(['is_published' => true]);
        return response()->json(['message' => 'Seat map dipublikasikan']);
    }

    // GET /api/seat-map/seats?show=show1
    public function seats(Request $request)
    {
        $show    = $request->query('show');
        $query   = SeatMap::with('seats.seatCategory')->latest();

        if ($show) {
            $query->where('show_identifier', $show);
        }

        $seatMap = $query->first();

        if (!$seatMap) {
            return response()->json(['message' => 'Seat map tidak ditemukan'], 404);
        }

        return response()->json([
            'seat_map' => [
                'id'              => $seatMap->id,
                'rows'            => $seatMap->rows,
                'cols'            => $seatMap->cols,
                'grid'            => $seatMap->grid,
                'is_published'    => $seatMap->is_published,
                'show_identifier' => $seatMap->show_identifier,
                'is_closed'       => !$seatMap->is_active,
            ],
            'seats' => $seatMap->seats->map(fn($seat) => [
                'id'        => $seat->id,
                'code'      => $seat->code,
                'row_index' => $seat->row_index,
                'col_index' => $seat->col_index,
                'status'    => $seat->status,
                'category'  => $seat->seatCategory,
            ]),
        ]);
    }
}
