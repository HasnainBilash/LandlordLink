<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $__env->yieldContent('title', 'My Dashboard'); ?></title>
    <!-- Include Bootstrap CSS from CDN -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <!-- Add custom styles if needed -->
    <style>
        /* Remove any default padding or margin */
        body, html {
            margin: 0;
            padding: 0;
        }

        .navbar {
            margin-bottom: 0; /* Remove bottom margin */
            padding-top: 0; /* Remove any padding at the top of the navbar */
            padding-bottom: 0; /* Remove bottom padding */
        }

        body {
            padding-top: 0; /* Remove the padding top */
        }

        /* Center navbar items including the brand */
        .navbar-collapse {
            display: flex;
            justify-content: center; /* Center all content inside navbar */
            width: 100%; /* Ensure navbar takes up full width */
        }

        .navbar-brand {
            font-size: 2rem; /* Make the text bigger */
            flex-grow: 1; /* Allow navbar brand to take up all available space and center */
            text-align: center;
            margin: 0; /* Remove default margins */
        }

        .navbar-nav {
            flex-grow: 0; /* Don't allow navbar items to grow, keep them aligned */
        }

        /* Ensure right-aligned menu items (About Us & Give Feedback) */
        .navbar-nav.ml-auto {
            margin-left: auto; /* Make sure the options stay to the right */
        }

        /* Styling the right menu options */
        .nav-link {
            font-size: 1.1rem;
        }

        /* Mobile view styling */
        @media (max-width: 768px) {
            .navbar-brand {
                font-size: 1.5rem; /* Slightly smaller on mobile */
            }
        }
    </style>
</head>
<body>

    <!-- Navbar for navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="<?php echo e(route('dashboard.index')); ?>">LandlordLink</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ml-auto">
                <!-- Right corner options -->
                <li class="nav-item">
                    <a class="nav-link" href="#">About Us</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Give Feedback</a>
                </li>
            </ul>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container">
        <?php echo $__env->yieldContent('content'); ?>
    </div>

    <!-- Include Bootstrap JS from CDN -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

</body>
</html>
<?php /**PATH D:\A file for all my projects\LandlordLink\resources\views/layouts/app.blade.php ENDPATH**/ ?>