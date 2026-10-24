<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->string('donation_code', 32)->unique();
            $table->string('donor_name');
            $table->string('donor_email');
            $table->string('donor_phone', 20);
            $table->unsignedBigInteger('amount');          // dalam rupiah
            $table->enum('status', ['pending', 'paid', 'expired', 'cancelled'])->default('pending');
            $table->string('midtrans_order_id')->nullable()->unique();
            $table->string('qris_url', 512)->nullable();
            $table->json('midtrans_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
