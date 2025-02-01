<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Building;
use App\Models\Flat;

class BuildingController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'total_flats' => 'required|integer|min:1',
            'flat_rent' => 'required|numeric|min:0', // Initial rent for flats
            'flat_bills' => 'required|numeric|min:0', // Initial bills for flats
        ]);

        // Create the building with fixed_rent and fixed_bills
        $building = Building::create([
            'name' => $request->name,
            'total_flats' => $request->total_flats,
            'fixed_rent' => $request->flat_rent, // Use initial rent as fixed_rent
            'fixed_bills' => $request->flat_bills, // Use initial bills as fixed_bills
            'user_id' => auth()->id(), // Add the authenticated user's ID
        ]);

        // Create flats with initial rent/bills
        for ($i = 1; $i <= $request->total_flats; $i++) {
            Flat::create([
                'name' => 'Flat ' . $i,
                'building_id' => $building->id,
                'rent_amount' => $request->flat_rent, // Initial rent
                'bills_amount' => $request->flat_bills, // Initial bills
            ]);
        }

        return redirect()->route('dashboard.index')->with('success', 'Building and flats created successfully.');
    }
    public function destroy($id)
    {
        $building = Building::findOrFail($id);
        $building->delete();

        return redirect()->route('dashboard.index')->with('success', 'Building deleted successfully!');
    }

    public function show($id)
    {
        // Fetch the building and its flats for the authenticated user
        $building = Building::where('user_id', auth()->id())->with('flats')->findOrFail($id);
        return view('building.show', [
            'building' => $building,
            'flats' => $building->flats,
        ]);
    }

    public function edit($id)
    {
        $building = Building::findOrFail($id);
        return view('dashboard.edit', compact('building'));
    }

    public function update(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $building = Building::findOrFail($id);
        $building->update(['name' => $request->name]);

        return redirect()->route('dashboard.index')->with('success', 'Building updated successfully!');
    }
}
