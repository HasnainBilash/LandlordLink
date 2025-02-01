<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flat_id')->constrained()->onDelete('cascade');
            $table->decimal('rent_deposit', 10, 2)->default(0);
            $table->decimal('bills_deposit', 10, 2)->default(0);
            $table->timestamps();
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('deposits');
    }
};
