<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Building;
use App\Models\Flat;
use Carbon\Carbon;

class IncreaseRent extends Command
{
    protected $signature = 'rent:increase';
    protected $description = 'Automatically increase rent and bills for all flats on the 1st day of the month.';

    public function handle()
    {
        $today = Carbon::today();

        // Check if today is the 1st day of the month
        if ($today->day === 1) {
            // Get all buildings with their fixed_rent and fixed_bills
            $buildings = Building::all();

            foreach ($buildings as $building) {
                // Get all flats under this building
                $flats = Flat::where('building_id', $building->id)->get();

                foreach ($flats as $flat) {
                    // Increase rent and bills using the fixed amounts from the building
                    $flat->update([
                        'rent_amount' => $flat->rent_amount + $building->fixed_rent,
                        'bills_amount' => $flat->bills_amount + $building->fixed_bills,
                    ]);
                }
            }

            $this->info('Rent and bills increased successfully for all flats.');
        } else {
            $this->info('No action taken: Today is not the 1st day of the month.');
        }
    }
}