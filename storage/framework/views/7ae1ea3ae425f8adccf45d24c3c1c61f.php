

<?php $__env->startSection('content'); ?>
<div class="container">
    <div class="d-flex justify-content-between align-items-center mt-4">
        <h1>Deposit History for <?php echo e($flat->name); ?></h1>
        <a href="<?php echo e(route('flats.show', $flat->id)); ?>" class="btn btn-secondary">Back to Flat</a>
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
                            <?php $__currentLoopData = $deposits; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $deposit): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <tr>
                                    <td><?php echo e($deposit->created_at->format('Y-m-d H:i:s')); ?></td>
                                    <td><?php echo e(number_format($deposit->rent_deposit, 2)); ?></td>
                                    <td><?php echo e(number_format($deposit->bills_deposit, 2)); ?></td>
                                </tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/flats/history.blade.php ENDPATH**/ ?>