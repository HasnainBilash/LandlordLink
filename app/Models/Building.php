<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'total_flats',
        'fixed_rent',
        'fixed_bills',
        'user_id', // Add this line
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function flats()
    {
        return $this->hasMany(Flat::class);
    }
}
