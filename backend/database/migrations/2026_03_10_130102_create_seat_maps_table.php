<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat_maps', function (Blueprint $table) {
            $table->id();
            $table->integer('rows');
            $table->integer('cols');
            $table->jsonb('grid');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat_maps');
    }
};
