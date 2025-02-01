@extends('layouts.app')

@section('content')
<div class="container">
    <h2>Edit Building Name</h2>
    <form action="{{ route('building.update', $building->id) }}" method="POST">
        @csrf
        @method('PUT')
        <div class="form-group">
            <label for="name">Building Name</label>
            <input type="text" name="name" value="{{ $building->name }}" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary">Update Building</button>
    </form>
</div>
@endsection
