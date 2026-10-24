<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('label');
            $table->integer('price');
            $table->string('color', 7);
            $table->integer('quota');
            $table->integer('available')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat_categories');
    }
};
