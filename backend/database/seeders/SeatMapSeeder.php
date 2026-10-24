<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeatMapSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('seat_maps')->count() > 0) {
            $this->command->info('SeatMap already seeded, skipping.');
            return;
        }

        // Kita buat dua jadwal (show) yang berbeda
        $shows = ['show1', 'show2'];

        foreach ($shows as $show) {
            DB::table('seat_maps')->insert([
                'show_identifier' => $show, // Menyambungkan dengan frontend
                'rows'            => 19,
                'cols'            => 26,
                'grid'            => '[]',
                'is_published'    => true,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $this->command->info('SeatMap untuk Show 1 & Show 2 berhasil dibuat.');
    }
}