<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->string('buyer_name');
            $table->string('buyer_email');
            $table->string('buyer_phone');
            $table->integer('total_price');
            $table->enum('status', ['pending', 'paid', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
