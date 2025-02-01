@extends('layouts.app')

@section('content')

<style>
    .dashboard-container {
        margin-top: 20px;
        text-align: center;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        background-color: white;
    }

    .dashboard-title {
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        flex-grow: 1;
    }

    .new-button {
        transition: transform 0.2s;
        background-color: rgb(0, 179, 54);
    }
    .new-button:hover {
        transform: translateY(-3px);
        background-color: rgb(0, 179, 54);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .logout-btn {
        transition: transform 0.2s;
        background-color: rgb(0, 0, 0);
        text-decoration: none;
        margin-left: 10px;
    }
    .logout-btn:hover {
        transform: translateY(-3px);
        background-color: rgb(0, 0, 0);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-decoration: none;
    }
    .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
    }

    .building-box {
        width: 200px;
        height: 200px;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 10px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        font-size: 16px;
        margin: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
    }

    .building-box:hover {
        transform: translateY(-10px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        background-color: #f0f8ff;
    }

    .more-options {
        position: absolute;
        top: 10px;
        right: 10px;
    }

    .more-options-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .more-options-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .dropdown-menu {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10;
    }

    .dropdown-menu.show {
        display: block;
    }

    .dropdown-item {
        display: block;
        padding: 10px;
        text-decoration: none;
        color: black;
        font-size: 0.9rem;
    }

    .dropdown-item:hover {
        background-color: #f1f1f1;
    }
</style>

<div class="dashboard-container">
    <div class="dashboard-header">
        <h1 class="dashboard-title">Dashboard</h1>
        <a href="{{ route('dashboard.create') }}" class="btn btn-primary new-button">+ New Buildings</a>

        <form action="{{ route('logout') }}" method="POST" class="mt4">
            @csrf
            <button type="submit" class="btn btn-primary logout-btn">Logout</button>
        </form>
    </div>

    <div class="buildings-grid">
        @foreach ($buildings as $building)
        <div class="building-box" onclick="window.location.href='{{ route('building.show', $building->id) }}'">
            <h4>{{ $building->name }}</h4>
            <div class="dropdown more-options">
                <button class="more-options-btn" onclick="toggleDropdown(event, {{ $building->id }})">&#8226;&#8226;&#8226;</button>
                <div id="dropdown-{{ $building->id }}" class="dropdown-menu">
                    <a class="dropdown-item" href="{{ route('building.edit', $building->id) }}">Edit</a>
                    <form action="{{ route('building.destroy', $building->id) }}" method="POST">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="dropdown-item">Delete</button>
                    </form>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</div>

<script>
    function toggleDropdown(event, id) {
        event.stopPropagation(); // Prevent event from bubbling to parent elements
        const dropdown = document.getElementById(`dropdown-${id}`);
        const isVisible = dropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
        if (!isVisible) {
            dropdown.classList.add('show');
        }
    }

    // Close all dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
    });
</script>
@endsection
