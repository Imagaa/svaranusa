<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat_waitlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seat_id')->constrained()->cascadeOnDelete();
            $table->string('buyer_email');
            $table->string('buyer_name');
            $table->integer('position');
            $table->boolean('notified')->default(false);
            $table->timestamps();

            $table->index(['seat_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat_waitlist');
    }
};
