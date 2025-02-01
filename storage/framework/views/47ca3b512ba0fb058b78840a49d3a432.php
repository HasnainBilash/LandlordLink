

<?php $__env->startSection('content'); ?>

<style>
    .dashboard-container {
        margin: 20px;
        text-align: center;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .dashboard-title {
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        flex-grow: 1;
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
        text-decoration: none;
        color: inherit;
        position: relative;
    }

    .building-box:hover {
        transform: translateY(-10px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        background-color: #f0f8ff;
        text-decoration: none;
    }

    .more-options {
        position: absolute;
        top: 30px;
        right: 40px;
    }

    .more-options-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        width: 35px;
        height: 35px;
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
        min-width: 100px;
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

    .add-flat-btn {
        transition: transform 0.2s;
        background-color: rgb(0, 179, 54);
    }

    .add-flat-btn:hover {
        transform: translateY(-3px);
        background-color: rgb(0, 179, 54);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
</style>

<div class="dashboard-container">
    <div class="dashboard-header">
        <h1 class="dashboard-title"><?php echo e($building->name); ?> Flats</h1>
        <a href="<?php echo e(route('flats.create', $building->id)); ?>" class="btn btn-primary add-flat-btn">+ New Flat</a>
    </div>
    <div class="buildings-grid">
        <?php $__currentLoopData = $flats; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $flat): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <div class="building-box-container" style="position: relative;">
            <a href="<?php echo e(route('flats.show', $flat->id)); ?>" class="building-box">
                <h4><?php echo e($flat->name); ?></h4>
                <p>Total Payment Due:</p>
                <p>$<?php echo e(number_format($flat->total_payment_due, 2)); ?></p>
            </a>

            <!-- More options menu (kept separate from the box click) -->
            <div class="dropdown more-options">
                <button class="more-options-btn">&#8226;&#8226;&#8226;</button>
                <div class="dropdown-menu">
                    <a class="dropdown-item" href="<?php echo e(route('flats.edit', $flat->id)); ?>">Edit</a>
                    <form action="<?php echo e(route('flats.destroy', $flat->id)); ?>" method="POST">
                        <?php echo csrf_field(); ?>
                        <?php echo method_field('DELETE'); ?>
                        <button type="submit" class="dropdown-item">Delete</button>
                    </form>
                </div>
            </div>
        </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        // Get all "more options" buttons
        const moreOptionsButtons = document.querySelectorAll('.more-options-btn');

        moreOptionsButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                event.stopPropagation(); // Prevent the click from propagating to the parent
                const dropdownMenu = this.nextElementSibling; // Get the dropdown menu

                // Close all other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.style.display = 'none';
                    }
                });

                // Toggle the current dropdown
                if (dropdownMenu.style.display === 'block') {
                    dropdownMenu.style.display = 'none';
                } else {
                    dropdownMenu.style.display = 'block';
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', function () {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        });
    });
</script>

<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/building/show.blade.php ENDPATH**/ ?>