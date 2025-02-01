<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('flats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Simplified
            $table->string('name');
            $table->decimal('rent_amount', 10, 2);
            $table->decimal('bills_amount', 10, 2);
            $table->decimal('total_payment_due', 10, 2)->default(0);
            $table->timestamps();
        });
    }
    public function down()
    {
        Schema::dropIfExists('flats');
    }
};
