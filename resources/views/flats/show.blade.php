@extends('layouts.app')

@section('content')
<div class="container">
    <div class="d-flex justify-content-between align-items-center mt-4">
        <h1>Details for {{ $flat->name }}</h1>
        <div>
            <a href="{{ route('flats.deposit', $flat->id) }}" class="btn btn-success">Deposit</a>
            <a href="{{ route('flats.history', $flat->id) }}" class="btn btn-info">Show History</a>
        </div>
    </div>
    <div class="row mt-4">
        <div class="col-md-8 offset-md-2">
            <div class="row">
                <!-- Flat Details Table -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h4 class="mb-0">Flat Details</h4>
                        </div>
                        <div class="card-body">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Detail</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Name</td>
                                        <td>{{ $flat->name }}</td>
                                    </tr>
                                    <tr>
                                        <td>Fixed Rent</td>
                                        <td>${{ number_format($flat->building->fixed_rent, 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td>Fixed Bills</td>
                                        <td>${{ number_format($flat->building->fixed_bills, 2) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Payment Details Table -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h4 class="mb-0">Payment Details</h4>
                            <a href="{{ route('flats.edit', $flat->id) }}" class="btn btn-sm btn-primary">Edit</a>
                        </div>
                        <div class="card-body">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Detail</th>
                                        <th>Amount ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Due Rent</td>
                                        <td>{{ number_format($flat->rent_amount, 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td>Due Bills</td>
                                        <td>{{ number_format($flat->bills_amount, 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td>Total Dues</td>
                                        <td>{{ number_format($flat->total_payment_due, 2) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Back Button -->
            <div class="mt-4">
                <a href="{{ route('building.show', $flat->building_id) }}" class="btn btn-secondary">Back to Building</a>
            </div>
        </div>
    </div>
</div>
@endsection