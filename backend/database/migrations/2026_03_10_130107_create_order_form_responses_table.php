<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_form_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('form_schema_id')->constrained();
            $table->jsonb('responses');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_form_responses');
    }
};
