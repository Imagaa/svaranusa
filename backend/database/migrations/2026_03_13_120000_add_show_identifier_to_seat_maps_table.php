<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seat_maps', function (Blueprint $table) {
            // 'show1' atau 'show2' — nullable agar tidak break data lama
            $table->string('show_identifier', 10)->nullable()->after('is_published');
        });
    }

    public function down(): void
    {
        Schema::table('seat_maps', function (Blueprint $table) {
            $table->dropColumn('show_identifier');
        });
    }
};
