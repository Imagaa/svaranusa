<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeatCategorySeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('seat_categories')->count() > 0) {
            $this->command->info('SeatCategories already seeded, skipping.');
            return;
        }

        DB::table('seat_categories')->insert([
            // Zona A: Quota 144, tapi available hanya 112 (karena 32 kursi diblokir)
            ['name' => 'A', 'label' => 'Zona A', 'price' => 50000, 'color' => '#D4AF37', 'quota' => 144, 'available' => 112, 'created_at' => now(), 'updated_at' => now()],
            // Zona B: Quota 160, tapi available hanya 155 (karena 5 kursi diblokir)
            ['name' => 'B', 'label' => 'Zona B', 'price' => 40000, 'color' => '#4CAF50', 'quota' => 160, 'available' => 155, 'created_at' => now(), 'updated_at' => now()],
            
            ['name' => 'C', 'label' => 'Zona C', 'price' => 25000, 'color' => '#EF4444', 'quota' => 90,  'available' => 90,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'D', 'label' => 'Zona D', 'price' => 25000, 'color' => '#EF4444', 'quota' => 100, 'available' => 100, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->command->info('SeatCategories seeded (dengan penyesuaian kursi terblokir).');
    }
}