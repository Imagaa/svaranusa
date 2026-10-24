<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('midtrans_order_id')->unique();
            $table->string('payment_type')->default('qris');
            $table->integer('gross_amount');
            $table->enum('status', ['pending', 'settlement', 'expire', 'cancel', 'deny'])->default('pending');
            $table->string('qris_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->jsonb('midtrans_response')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
