<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('buyer_instagram')->nullable()->after('buyer_phone');
            $table->unsignedBigInteger('paid_amount')->nullable()->after('total_price');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['buyer_instagram', 'paid_amount']);
        });
    }
};
