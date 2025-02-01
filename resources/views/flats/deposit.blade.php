@extends('layouts.app')

@section('content')
<div class="container">
    <div class="d-flex justify-content-between align-items-center mt-4">
        <h1>Deposit for {{ $flat->name }}</h1>
        <a href="{{ route('flats.show', $flat->id) }}" class="btn btn-secondary">Back to Flat</a>
    </div>
    <div class="row mt-4">
        <div class="col-md-6 offset-md-3">
            <form action="{{ route('flats.deposit.submit', $flat->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to submit this deposit?');">
                @csrf
                <div class="mb-3">
                    <label for="rent" class="form-label">Rent Deposit ($)</label>
                    <input type="number" class="form-control @error('rent') is-invalid @enderror" id="rent" name="rent" min="0" max="{{ $flat->rent_amount }}" step="0.01" placeholder="Enter rent deposit">
                    <small class="text-muted">Maximum: ${{ number_format($flat->rent_amount, 2) }}</small>
                    @error('rent')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                <div class="mb-3">
                    <label for="bills" class="form-label">Bills Deposit ($)</label>
                    <input type="number" class="form-control @error('bills') is-invalid @enderror" id="bills" name="bills" min="0" max="{{ $flat->bills_amount }}" step="0.01" placeholder="Enter bills deposit">
                    <small class="text-muted">Maximum: ${{ number_format($flat->bills_amount, 2) }}</small>
                    @error('bills')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                <button type="submit" class="btn btn-primary">Submit Deposit</button>
            </form>
        </div>
    </div>
</div>
@endsection