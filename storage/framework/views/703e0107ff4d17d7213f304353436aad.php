

<?php $__env->startSection('content'); ?>
<div class="form-container">
    <h1 class="form-title">Add New Flat</h1>
    <form action="<?php echo e(route('flats.store', $buildingId)); ?>" method="POST">
        <?php echo csrf_field(); ?>

        <!-- Flat Name -->
        <div class="form-group">
            <label for="name">Flat Name</label>
            <input type="text" name="name" id="name" class="form-control" placeholder="Enter flat name" required>
        </div>

        <!-- Rent Amount -->
        <div class="form-group">
            <label for="rent_amount">Rent Amount</label>
            <input type="number" name="rent_amount" id="rent_amount" class="form-control" placeholder="Enter rent amount" step="0.01" required>
        </div>

        <!-- Bills Amount -->
        <div class="form-group">
            <label for="bills_amount">Bills Amount</label>
            <input type="number" name="bills_amount" id="bills_amount" class="form-control" placeholder="Enter bills amount" step="0.01" required>
        </div>

        <button type="submit" class="btn btn-submit">Create Flat</button>
    </form>
    
    <a href="<?php echo e(route('building.show', $buildingId)); ?>" class="btn btn-secondary">Back to Building</a>
</div>

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
        background-color:rgb(82, 95, 107);
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
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/flats/create.blade.php ENDPATH**/ ?>