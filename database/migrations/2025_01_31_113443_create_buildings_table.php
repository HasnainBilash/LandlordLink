<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   // File: 2025_01_27_173854_create_buildings_table.php
   public function up()
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('total_flats');
            $table->decimal('fixed_rent', 10, 2)->default(0);
            $table->decimal('fixed_bills', 10, 2)->default(0);
            // Use foreignId() for proper foreign key setup
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Non-nullable
            $table->timestamps();
        });
    }
    public function down()
    {
        Schema::dropIfExists('buildings');
    }
};
