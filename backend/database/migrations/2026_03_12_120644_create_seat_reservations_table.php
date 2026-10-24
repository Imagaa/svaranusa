<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat_reservations', function (Blueprint $table) {
            $table->id();

            // Kode kursi: A1, B5, CL3, CR12, DL7, DR50, dll
            $table->string('seat_code', 10);

            // Referensi ke orders (nullable dulu, diisi saat payment sukses)
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            // Session identifier — bisa tanpa login
            // Diisi user_id jika login, atau session token jika guest
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_token', 64)->nullable();

            // Status lifecycle
            $table->enum('status', ['reserved', 'paid', 'expired', 'cancelled'])
                  ->default('reserved');

            // Reservation expires dalam 10 menit
            $table->timestamp('expired_at');

            $table->timestamps();

            // Index untuk query cepat
            $table->index(['seat_code', 'status']);
            $table->index(['status', 'expired_at']);

            // Satu kursi hanya boleh 1 reservation aktif (reserved/paid)
            // Unique constraint di level aplikasi via DB lock, bukan di sini
            // karena expired boleh duplikat
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat_reservations');
    }
};
