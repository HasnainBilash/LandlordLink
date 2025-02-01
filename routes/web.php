<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\FlatController;
use App\Http\Controllers\AuthController;


Route::get('/', function () {
    return view('welcome');
});

// Dashboard Routes
Route::get('/dashboard/index', [DashboardController::class, 'index'])->name('dashboard.index'); // Dashboard home
Route::get('/dashboard/create', [DashboardController::class, 'create'])->name('dashboard.create'); // Create building
Route::delete('/dashboard/{id}', [DashboardController::class, 'destroy'])->name('dashboard.destroy'); // Delete building

// Building Routes
Route::post('/building', [BuildingController::class, 'store'])->name('building.store'); // Store building
Route::get('/building/{id}', [BuildingController::class, 'show'])->name('building.show'); // View building details
Route::get('/building/{id}/edit', [BuildingController::class, 'edit'])->name('building.edit'); // Edit building
Route::put('/building/{id}', [BuildingController::class, 'update'])->name('building.update'); // Update building
Route::delete('/building/{id}', [BuildingController::class, 'destroy'])->name('building.destroy'); // Delete building

// Flat Routes
Route::get('/flats/{id}/edit', [FlatController::class, 'edit'])->name('flats.edit');
Route::put('/flats/{id}', [FlatController::class, 'update'])->name('flats.update');
Route::delete('/flats/{id}', [FlatController::class, 'destroy'])->name('flats.destroy');
Route::get('/flats/{id}', [FlatController::class, 'show'])->name('flats.show');
Route::get('/building/{id}/flats/create', [FlatController::class, 'create'])->name('flats.create');
Route::post('/building/{id}/flats', [FlatController::class, 'store'])->name('flats.store');


// Login Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
// Registration Routes
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.submit');
// Logout Route
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Deposit Routes
Route::get('/flats/{id}/deposit', [FlatController::class, 'showDepositForm'])->name('flats.deposit');
Route::post('/flats/{id}/deposit', [FlatController::class, 'processDeposit'])->name('flats.deposit.submit');
Route::get('/flats/{id}/history', [FlatController::class, 'showHistory'])->name('flats.history');