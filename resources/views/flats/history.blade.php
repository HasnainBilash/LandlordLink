@extends('layouts.app')

@section('content')
<div class="container">
    <div class="d-flex justify-content-between align-items-center mt-4">
        <h1>Deposit History for {{ $flat->name }}</h1>
        <a href="{{ route('flats.show', $flat->id) }}" class="btn btn-secondary">Back to Flat</a>
    </div>
    <div class="row mt-4">
        <div class="col-md-8 offset-md-2">
            <div class="card">
                <div class="card-header">
                    <h4 class="mb-0">Deposit History</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Rent Deposit ($)</th>
                                <th>Bills Deposit ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($deposits as $deposit)
                                <tr>
                                    <td>{{ $deposit->created_at->format('Y-m-d H:i:s') }}</td>
                                    <td>{{ number_format($deposit->rent_deposit, 2) }}</td>
                                    <td>{{ number_format($deposit->bills_deposit, 2) }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection