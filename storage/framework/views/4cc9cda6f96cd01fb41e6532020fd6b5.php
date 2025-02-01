

<?php $__env->startSection('content'); ?>
<div class="container">
    <div class="d-flex justify-content-between align-items-center mt-4">
        <h1>Deposit for <?php echo e($flat->name); ?></h1>
        <a href="<?php echo e(route('flats.show', $flat->id)); ?>" class="btn btn-secondary">Back to Flat</a>
    </div>
    <div class="row mt-4">
        <div class="col-md-6 offset-md-3">
            <form action="<?php echo e(route('flats.deposit.submit', $flat->id)); ?>" method="POST" onsubmit="return confirm('Are you sure you want to submit this deposit?');">
                <?php echo csrf_field(); ?>
                <div class="mb-3">
                    <label for="rent" class="form-label">Rent Deposit ($)</label>
                    <input type="number" class="form-control <?php $__errorArgs = ['rent'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="rent" name="rent" min="0" max="<?php echo e($flat->rent_amount); ?>" step="0.01" placeholder="Enter rent deposit">
                    <small class="text-muted">Maximum: $<?php echo e(number_format($flat->rent_amount, 2)); ?></small>
                    <?php $__errorArgs = ['rent'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                        <div class="invalid-feedback"><?php echo e($message); ?></div>
                    <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                </div>
                <div class="mb-3">
                    <label for="bills" class="form-label">Bills Deposit ($)</label>
                    <input type="number" class="form-control <?php $__errorArgs = ['bills'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="bills" name="bills" min="0" max="<?php echo e($flat->bills_amount); ?>" step="0.01" placeholder="Enter bills deposit">
                    <small class="text-muted">Maximum: $<?php echo e(number_format($flat->bills_amount, 2)); ?></small>
                    <?php $__errorArgs = ['bills'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                        <div class="invalid-feedback"><?php echo e($message); ?></div>
                    <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                </div>
                <button type="submit" class="btn btn-primary">Submit Deposit</button>
            </form>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/flats/deposit.blade.php ENDPATH**/ ?>