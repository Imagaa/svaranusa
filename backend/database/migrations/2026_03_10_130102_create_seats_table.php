<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seat_map_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seat_category_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->integer('row_index');
            $table->integer('col_index');
            $table->enum('status', ['available', 'locked', 'sold'])->default('available');
            $table->timestamps();

            $table->unique(['seat_map_id', 'code']);
            $table->index(['seat_map_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
