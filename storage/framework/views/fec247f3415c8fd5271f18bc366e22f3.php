

<?php $__env->startSection('content'); ?>
<div class="edit-flat-container">
    <h1>Edit Flat</h1>

    <!-- Edit form -->
    <form action="<?php echo e(route('flats.update', $flat->id)); ?>" method="POST">
        <?php echo csrf_field(); ?>
        <?php echo method_field('PUT'); ?>

        <!-- Flat Name -->
        <div class="form-group">
            <label for="flat-name">Flat Name</label>
            <input type="text" name="name" id="flat-name" value="<?php echo e($flat->name); ?>" class="form-control" required>
        </div>

        <!-- Rent Amount -->
        <div class="form-group">
            <label for="rent-amount">Rent Amount ($)</label>
            <input type="number" name="rent_amount" id="rent-amount" value="<?php echo e($flat->rent_amount); ?>" class="form-control" step="0.01" required>
        </div>

        <!-- Bills Amount -->
        <div class="form-group">
            <label for="bills-amount">Bills Amount ($)</label>
            <input type="number" name="bills_amount" id="bills-amount" value="<?php echo e($flat->bills_amount); ?>" class="form-control" step="0.01" required>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Changes</button>
            <a href="<?php echo e(route('flats.show', $flat->id)); ?>" class="btn btn-secondary">Cancel</a>
        </div>
    </form>
</div>

<style>
.edit-flat-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.edit-flat-container h1 {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    font-weight: bold;
    margin-bottom: 5px;
    display: block;
}

.form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

.form-actions {
    display: flex;
    gap: 10px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    text-decoration: none;
    font-size: 1rem;
    transition: background-color 0.2s ease;
}

.btn-primary {
    background-color: #007bff;
    color: #fff;
}

.btn-primary:hover {
    background-color: #0056b3;
}

.btn-secondary {
    background-color: #6c757d;
    color: #fff;
}

.btn-secondary:hover {
    background-color: #5a6268;
}
</style>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/flats/edit.blade.php ENDPATH**/ ?>