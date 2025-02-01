

<?php $__env->startSection('content'); ?>
<div class="container">
    <h2>Edit Building Name</h2>
    <form action="<?php echo e(route('building.update', $building->id)); ?>" method="POST">
        <?php echo csrf_field(); ?>
        <?php echo method_field('PUT'); ?>
        <div class="form-group">
            <label for="name">Building Name</label>
            <input type="text" name="name" value="<?php echo e($building->name); ?>" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary">Update Building</button>
    </form>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/dashboard/edit.blade.php ENDPATH**/ ?>