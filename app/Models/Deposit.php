<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deposit extends Model
{
    protected $fillable = [
        'flat_id',
        'rent_deposit',
        'bills_deposit',
    ];
}
