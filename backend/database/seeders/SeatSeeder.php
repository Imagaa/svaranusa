<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeatSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('seats')->count() > 0) {
            $this->command->info('Seats already seeded, skipping.');
            return;
        }

        // Ambil semua SeatMap (show1 dan show2)
        $seatMaps = DB::table('seat_maps')->get();
        $cats     = DB::table('seat_categories')->pluck('id', 'name');
        $now      = now();
        $seats    = [];

        // Loop untuk setiap show
        foreach ($seatMaps as $map) {
            $seatMapId = $map->id;

            // Zona A: 9 rows x 16 cols = 144
            // KONDISI: A1 sampai A32 dibuat locked
            for ($i = 1; $i <= 144; $i++) {
                $status = ($i >= 1 && $i <= 32) ? 'locked' : 'available';
                $seats[] = ['seat_map_id' => $seatMapId, 'seat_category_id' => $cats['A'], 'code' => "A{$i}", 'row_index' => (int)ceil($i/16), 'col_index' => (($i-1)%16)+1, 'status' => $status, 'created_at' => $now, 'updated_at' => $now];
            }

            // Zona B: 10 rows x 16 cols = 160
            // KONDISI: B6 sampai B10 dibuat locked
            for ($i = 1; $i <= 160; $i++) {
                $status = ($i >= 6 && $i <= 10) ? 'locked' : 'available';
                $seats[] = ['seat_map_id' => $seatMapId, 'seat_category_id' => $cats['B'], 'code' => "B{$i}", 'row_index' => (int)ceil($i/16), 'col_index' => (($i-1)%16)+1, 'status' => $status, 'created_at' => $now, 'updated_at' => $now];
            }

            // Zona C Kiri: CL1-CL45
            for ($i = 1; $i <= 45; $i++) {
                $seats[] = ['seat_map_id' => $seatMapId, 'seat_category_id' => $cats['C'], 'code' => "CL{$i}", 'row_index' => (int)ceil($i/5), 'col_index' => (($i-1)%5)+1, 'status' => 'available', 'created_at' => $now, 'updated_at' => $now];
            }

            // Zona C Kanan: CR46-CR90
            for ($i = 46; $i <= 90; $i++) {
                $seats[] = ['seat_map_id' => $seatMapId, 'seat_category_id' => $cats['C'], 'code' => "CR{$i}", 'row_index' => (int)ceil(($i-45)/5), 'col_index' => (($i-46)%5)+1, 'status' => 'available', 'created_at' => $now, 'updated_at' => $now];
            }

            // Zona D Kiri: DL1-DL50
            for ($i = 1; $i <= 50; $i++) {
                $seats[] = ['seat_map_id' => $seatMapId, 'seat_category_id' => $cats['D'], 'code' => "DL{$i}", 'row_index' => (int)ceil($i/5), 'col_index' => (($i-1)%5)+1, 'status' => 'available', 'created_at' => $now, 'updated_at' => $now];
            }

            // Zona D Kanan: DR51-DR100
            for ($i = 51; $i <= 100; $i++) {
                $seats[] = ['seat_map_id' => $seatMapId, 'seat_category_id' => $cats['D'], 'code' => "DR{$i}", 'row_index' => (int)ceil(($i-50)/5), 'col_index' => (($i-51)%5)+1, 'status' => 'available', 'created_at' => $now, 'updated_at' => $now];
            }
        }

        // Masukkan ke database per 100 baris agar tidak berat
        foreach (array_chunk($seats, 100) as $chunk) {
            DB::table('seats')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($seats) . ' seats (dengan A1-A32 & B6-B10 di-locked).');
    }
}