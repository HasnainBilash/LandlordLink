<?php

namespace App\Http\Controllers;

use App\Models\Flat;
use Illuminate\Http\Request;
use App\Models\Deposit;

class FlatController extends Controller
{   
    public function show($id)
    {
        // Fetch the flat for the authenticated user
        $flat = Flat::where('user_id', auth()->id())->findOrFail($id);
        return view('flats.show', compact('flat'));
    }
    public function edit($id)
    {
        $flat = Flat::findOrFail($id);
        return view('flats.edit', compact('flat')); // Points to resources/views/flats/edit.blade.php
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'rent_amount' => 'required|numeric|min:0',
            'bills_amount' => 'required|numeric|min:0',
        ]);

        $flat = Flat::findOrFail($id);
        $flat->update($request->all());

        return redirect()->route('flats.show', $flat->id)
            ->with('success', 'Payment details updated successfully!');
    }

    public function destroy($id)
    {
        $flat = Flat::findOrFail($id);
        $flat->delete();

        // Redirect back to the building's show page
        return redirect()
            ->route('building.show', $flat->building_id)
            ->with('success', 'Flat deleted successfully!');
    }
    public function create($buildingId)
    {
        return view('flats.create', ['buildingId' => $buildingId]);
    }

    public function store(Request $request, $buildingId)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'rent_amount' => 'required|numeric',
            'bills_amount' => 'required|numeric',
        ]);

        Flat::create([
            'name' => $request->name,
            'building_id' => $buildingId,
            'user_id' => auth()->id(), // Assign logged-in user
            'rent_amount' => $request->rent_amount,
            'bills_amount' => $request->bills_amount,
            'total_payment_due' => $request->rent_amount + $request->bills_amount,
        ]);

        return redirect()->route('building.show', $buildingId)->with('success', 'Flat created successfully!');
    }

    public function showDepositForm($id)
    {
        $flat = Flat::findOrFail($id);
        return view('flats.deposit', compact('flat'));
    }
    
    public function processDeposit(Request $request, $id)
    {
        $flat = Flat::findOrFail($id); // Define $flat here

        $request->validate([
            'rent' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) use ($flat) { // Add `use ($flat)`
                    if ($value > $flat->rent_amount) {
                        $fail('The rent deposit cannot exceed the rent due.');
                    }
                },
            ],
            'bills' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) use ($flat) { // Add `use ($flat)`
                    if ($value > $flat->bills_amount) {
                        $fail('The bills deposit cannot exceed the bills due.');
                    }
                },
            ],
        ]);

        // Save deposit history
        Deposit::create([
            'flat_id' => $flat->id,
            'rent_deposit' => $request->rent ?? 0,
            'bills_deposit' => $request->bills ?? 0,
        ]);

        // Update flat's rent and bills
        if ($request->filled('rent')) {
            $flat->rent_amount -= $request->rent;
        }

        if ($request->filled('bills')) {
            $flat->bills_amount -= $request->bills;
        }

        $flat->save();

        return redirect()->route('flats.show', $flat->id)->with('success', 'Deposit processed successfully!');
    }
    public function showHistory($id)
    {
        $flat = Flat::findOrFail($id);
        $deposits = Deposit::where('flat_id', $flat->id)->latest()->get();
        return view('flats.history', compact('flat', 'deposits'));
    }
}
