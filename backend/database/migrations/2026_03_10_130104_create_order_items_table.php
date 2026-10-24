<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seat_category_id')->constrained();
            $table->integer('price');
            $table->string('qr_code')->nullable();
            $table->timestamps();

            $table->unique(['order_id', 'seat_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
