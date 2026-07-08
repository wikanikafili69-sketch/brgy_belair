<?php

session_start();
header('Content-Type: application/json');

// 1. Include your existing database connection
// This file should have date_default_timezone_set('Asia/Manila'); at the top!
require_once '../../Connections/db_connect.php'; 

// 2. Read incoming JSON data from the frontend
$data = json_decode(file_get_contents("php://input"));
$username_input = trim($data->username ?? '');
$password = $data->password ?? '';

if (empty($username_input) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please provide both username and password.']);
    exit;
}

// 3. Fetch user from the database using username instead of email
$stmt = $pdo->prepare("SELECT * FROM user_credentials WHERE username = :username LIMIT 1");
$stmt->execute(['username' => $username_input]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    // 4. Check if account is active based on your ENUM
    if ($user['status'] !== 'active') {
         echo json_encode(['success' => false, 'message' => 'Your account is currently ' . $user['status'] . '. Contact Admin.']);
         exit;
    }

    // --- SECURITY ADDITION: Lockout Check Logic ---
    // Get the exact current time in PHP (respecting the Asia/Manila timezone from db_connect.php)
    $current_time = new DateTime();
    $current_time_str = $current_time->format('Y-m-d H:i:s');

    if (!empty($user['lockout_time'])) {
        $lockout_time = new DateTime($user['lockout_time']);
        
        // If the current time is still BEFORE the lockout time, block the login
        if ($current_time < $lockout_time) {
            $diff = $current_time->diff($lockout_time);
            // Calculate total minutes remaining
            $minutes_left = ($diff->days * 24 * 60) + ($diff->h * 60) + $diff->i;
            
            // If it's less than a minute, show seconds
            if ($minutes_left == 0) {
                 echo json_encode(['success' => false, 'message' => "Account temporarily locked. Try again in {$diff->s} seconds."]);
            } else {
                 echo json_encode(['success' => false, 'message' => "Account temporarily locked. Try again in $minutes_left minutes."]);
            }
            exit;
        }
    }
    // ----------------------------------------------

    // 5. Verify the hashed password
    if (password_verify($password, $user['hashed_password'])) {
        
        // Combine f_name and l_name for the full display name
        $full_name = trim($user['f_name'] . ' ' . $user['l_name']);

        // =========================================================
        // ✅ ACTIVITY LOGGING (Triggered on successful login)
        // =========================================================
        try {
            $action = "Logged into the system.";
            $timestamp = date('Y-m-d H:i:s');
            
            $log_stmt = $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (:name, :action, :time)");
            $log_stmt->execute([
                'name' => $full_name, 
                'action' => $action, 
                'time' => $timestamp
            ]);
        } catch(Exception $e) {
            // Silently ignore errors here so we don't accidentally block the user from logging in
        }
        // =========================================================
        
        // SUCCESS: Reset failed attempts and clear lockout time. 
        // Update last_time_login using PHP's current time to avoid server timezone issues.
        $updateStmt = $pdo->prepare("UPDATE user_credentials SET failed_attempts = 0, lockout_time = NULL, last_time_login = :now WHERE user_id = :id");
        $updateStmt->execute([
            'now' => $current_time_str,
            'id'  => $user['user_id']
        ]);

        // 6. Set Sessions for the Admin/Staff Dashboard
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['admin_name'] = $full_name;
        $_SESSION['position'] = $user['position'];
        
        // Create initials from f_name and l_name (e.g., "Maria Santos" -> "MS")
        $initials = strtoupper(substr($user['f_name'], 0, 1) . substr($user['l_name'], 0, 1));
        $_SESSION['admin_initials'] = $initials;

        // ════════════════════════════════════
        // ✅ FETCH AND STORE ACCESS LIST
        // ════════════════════════════════════
        // We use JOIN to get the text names of the permissions from the access_list table
        $permStmt = $pdo->prepare("
            SELECT al.access_name 
            FROM user_access ua
            JOIN access_list al ON ua.access_id = al.id
            WHERE ua.user_id = :uid
        ");
        $permStmt->execute(['uid' => $user['user_id']]);
        
        // PDO::FETCH_COLUMN turns the result into a simple, flat array: ['generate_reports', 'manage_users']
        $_SESSION['permissions'] = $permStmt->fetchAll(PDO::FETCH_COLUMN);
        // ════════════════════════════════════

        // Send success back to JS
        echo json_encode([
            'success' => true,
            'role' => $user['position'],
            'username' => $user['username']
        ]);
    } else {
        // --- SECURITY ADDITION: Failed Attempt Logic ---
        $max_attempts = 5;
        $lockout_duration_minutes = 15;
        
        // Make sure we treat NULL as 0 just in case
        $current_fails = $user['failed_attempts'] ? (int)$user['failed_attempts'] : 0;
        $attempts = $current_fails + 1;
        $new_lockout_time_str = null;
        $response_message = "";

        if ($attempts >= $max_attempts) {
            // Calculate a time 15 minutes from right now
            $future_time = clone $current_time;
            $future_time->modify("+$lockout_duration_minutes minutes");
            $new_lockout_time_str = $future_time->format('Y-m-d H:i:s');
            
            $response_message = "Too many failed attempts. Account locked for $lockout_duration_minutes minutes.";
        } else {
            $remaining = $max_attempts - $attempts;
            $response_message = "Invalid password. $remaining attempts remaining.";
        }

        // Update the database with the new failed count and potential lockout time
        $failStmt = $pdo->prepare("UPDATE user_credentials SET failed_attempts = :attempts, lockout_time = :lock_time WHERE user_id = :id");
        $failStmt->execute([
            'attempts'  => $attempts,
            'lock_time' => $new_lockout_time_str,
            'id'        => $user['user_id']
        ]);

        echo json_encode(['success' => false, 'message' => $response_message]);
        // ----------------------------------------------
    }
} else {
     // Security best practice: Don't tell the attacker if the username exists or not.
     echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
}
?>