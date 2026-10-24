<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('ticket_code')->nullable()->unique()->after('price');
            $table->timestamp('checked_in_at')->nullable()->after('ticket_code');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['ticket_code', 'checked_in_at']);
        });
    }
};
