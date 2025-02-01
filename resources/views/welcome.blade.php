<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
        }

        .welcome-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #1a73e8;
            margin-bottom: 1.5rem;
        }

        .login-btn {
            background-color: #1a73e8;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
            text-decoration: none; /* Remove underline from link */
        }

        .login-btn:hover {
            background-color: #1557b0;
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        <h1>Welcome to My Project</h1>
        <a href="{{ route('login') }}" class="login-btn">Go To Login</a>
    </div>
</body>
</html>