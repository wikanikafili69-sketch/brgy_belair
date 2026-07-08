<?php
session_start();

require_once 'Functions/cache_buster.php';

// If already logged in, redirect directly to dashboard
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header("Location: queue.php");
    exit();
}

$login_error = '';

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['login'])) {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);

    // Hardcoded credentials check
    if ($email === 'walkin@gmail.com' && $password === '12345678') {
        $_SESSION['logged_in'] = true;
        $_SESSION['user_email'] = $email;
        
        // Redirect to dashboard
        header("Location: queue.php");
        exit();
    } else {
        $login_error = "Invalid email or password.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Walk-in Login - Barangay Management System</title>
    
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_style.css'); ?>">
</head>
<body>

    <div class="login-wrapper">
        <div class="login-card fade-in-up">
            
            <div class="login-header">
             <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay Logo" class="login-logo">
                <h2 class="display-title" style="font-size: 2.2rem;">Walk-in Access</h2>
                <p class="section-desc" style="margin: 0 auto; font-size: 0.9rem;">Enter your credentials to access services</p>
            </div>

            <?php if ($login_error): ?>
                <div style="background: rgba(224, 80, 80, 0.2); border: 1px solid var(--red); color: var(--white); padding: 10px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 0.85rem;">
                    <?php echo $login_error; ?>
                </div>
            <?php endif; ?>

            <form id="loginForm" action="walkin.php" method="POST">
                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" id="email" name="email" class="form-control" placeholder="" required>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <div class="password-wrapper">
                        <input type="password" id="password" name="password" class="form-control" placeholder="" required>
                        <button type="button" id="togglePassword" class="toggle-btn">Show</button>
                    </div>
                </div>

                <button type="submit" name="login" class="btn-primary login-btn">
                    Sign In <span class="btn-arrow">→</span>
                </button>
            </form>

        
        </div>
    </div>

    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_function.js'); ?>"></script>

</body>
</html>