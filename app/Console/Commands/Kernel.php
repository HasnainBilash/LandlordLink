<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\IncreaseRent;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // Run the rent increase command daily (it checks internally if it's the 1st of the month)
        $schedule->command('rent:increase')->daily();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }

    /**
     * List of registered commands.
     *
     * @var array
     */
    protected $commands = [
        IncreaseRent::class, // Add your custom command here
    ];
}