<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Define your route model bindings, pattern filters, etc.
     */
    public function boot(): void
    {
        $this->routes(function () {
            Route::prefix('api')
                 ->middleware('api')
                 ->namespace($this->namespace)
                 ->group(base_path('routes/api.php'));

            Route::middleware('web')
                 ->namespace($this->namespace)
                 ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        //
    }
}
