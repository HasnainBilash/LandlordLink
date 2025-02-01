

<?php $__env->startSection('content'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Building</title>
    <!-- Include Bootstrap CSS from CDN -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        /* Container styling for the form */
        .form-container {
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #ffffff;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        /* Form title */
        .form-title {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            color: #333;
        }

        /* Input and label styling */
        label {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 5px;
            color: #555;
        }

        input[type="text"], input[type="number"] {
            width: 100%;
            padding: 10px 15px;
            font-size: 1rem;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            transition: border-color 0.3s ease;
        }

        input[type="text"]:focus, input[type="number"]:focus {
            border-color: #007bff;
            outline: none;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }

        /* Button styles */
        .btn-submit {
            background-color: rgb(36, 206, 87);
            color: #fff;
            border: none;
            padding: 10px 15px;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            width: 100%;
            margin-top: 10px;
        }

        .btn-submit:hover {
            background-color: rgb(30, 189, 25);
            color: #fff;
        }

        .btn-secondary {
            display: block;
            text-align: center;
            background-color: #6c757d;
            color: #fff;
            border: none;
            padding: 10px 15px;
            font-size: 0.9rem;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            transition: background-color 0.3s ease;
            margin-top: 15px;
        }

        .btn-secondary:hover {
            background-color: #5a6268;
        }

        /* Center alignment */
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h1 class="form-title">Create New Building</h1>
        <form action="<?php echo e(route('building.store')); ?>" method="POST">
            <?php echo csrf_field(); ?>
            <!-- Building Name -->
            <div class="form-group">
                <label for="name">Building Name</label>
                <input type="text" name="name" id="name" class="form-control" placeholder="Enter building name" required>
            </div>

            <!-- Total Flats -->
            <div class="form-group">
                <label for="total_flats">Total Number of Flats</label>
                <input type="number" name="total_flats" id="total_flats" class="form-control" placeholder="Enter total number of flats" required>
            </div>

            <!-- Flat Rent -->
            <div class="form-group">
                <label for="flat_rent">Flat Rent Amount</label>
                <input type="number" name="flat_rent" id="flat_rent" class="form-control" placeholder="Enter rent amount for each flat" step="0.01" required>
            </div>

            <!-- Flat Bills -->
            <div class="form-group">
                <label for="flat_bills">Flat Bills Amount</label>
                <input type="number" name="flat_bills" id="flat_bills" class="form-control" placeholder="Enter the amount of bills for each flat" step="0.01" required>
            </div>

            <button type="submit" class="btn btn-submit">Create Building</button>
        </form>
        <a href="<?php echo e(route('dashboard.index')); ?>" class="btn btn-secondary">Back to Dashboard</a>
    </div>
</body>
</html>

<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/dashboard/create.blade.php ENDPATH**/ ?>