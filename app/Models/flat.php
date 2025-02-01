<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flat extends Model
{
    protected $fillable = [
        'name',
        'building_id',
        'rent_amount',
        'bills_amount',
        'total_payment_due',
        'user_id',
    ];

    // Automatically update total_payment_due on save or update
    protected static function booted()
    {
        parent::boot();
        static::creating(function ($flat) {
            if (auth()->check()) {
                $flat->user_id = auth()->id(); // Assign logged-in user
            }
        });
        static::saving(function ($flat) {
            $flat->total_payment_due = $flat->rent_amount + $flat->bills_amount;
        });
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function building()
    {
        return $this->belongsTo(Building::class);
    }
}
