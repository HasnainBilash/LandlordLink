<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Building;

class DashboardController extends Controller
{
    // Show the dashboard with the list of buildings
    public function index()
    {
        // Fetch buildings for the authenticated user
        $buildings = Building::where('user_id', auth()->id())->get();
        return view('dashboard.index', compact('buildings'));
    }

    // Show the form to create a new building
    public function create()
    {
        return view('dashboard.create'); // Render the create view
    }
}
