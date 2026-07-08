<?php
// Admin/admin_auth.php
session_start();

// 1. Are they logged in at all?
if (!isset($_SESSION['user_id'])) {
    // Send them back to the unified login page
    header("Location: ../staff.php");
    exit(); 
}

// 2. Role Check: Allow BOTH 'admin' and 'superadmin'
$current_role = $_SESSION['position'] ?? '';

if ($current_role !== 'admin' && $current_role !== 'superadmin') {
    // Kick Staff back to the Staff side
    if ($current_role === 'staff') {
        header("Location: ../Staff/staff_dashboard.php");
    } else {
        header("Location: ../staff.php");
    }
    exit(); 
}

// 3. 30-Minute Inactivity Timeout
$timeout_duration = 1800; // 1800 seconds = 30 minutes

if (isset($_SESSION['last_activity'])) {
    $elapsed_time = time() - $_SESSION['last_activity'];

    if ($elapsed_time > $timeout_duration) {
        // Time is up. Shred the session badge.
        session_unset();
        session_destroy();
        
        // Send them back to the login page
        header("Location: ../staff.php");
        exit();
    }
}

// Reset the stopwatch because they just loaded the page
$_SESSION['last_activity'] = time();

// ════════════════════════════════════
// 4. ACCESS CONTROL LIST (ACL) HELPERS
// ════════════════════════════════════

/**
 * Checks if the currently logged-in user is a Super Admin.
 * You can call this function on any page that includes this auth file.
 */
function isSuperAdmin() {
    return isset($_SESSION['position']) && $_SESSION['position'] === 'superadmin';
}


// ════════════════════════════════════
// 4. ACCESS CONTROL LIST (ACL) HELPER
// ════════════════════════════════════

/**
 * Checks if the logged-in user has a specific permission.
 * * @param string $required_access The name of the permission (e.g., 'generate_reports')
 * @return bool True if they have access, False otherwise.
 */
function hasAccess($required_access) {
    // 1. Superadmin automatically gets access to EVERYTHING
    if (isset($_SESSION['position']) && $_SESSION['position'] === 'superadmin') {
        return true;
    }
    
    // 2. Check if the user has the permissions array in their session
    if (!isset($_SESSION['permissions']) || !is_array($_SESSION['permissions'])) {
        return false; // Deny access if no permissions are found
    }
    
    // 3. Check if the required access name exists in their array
    return in_array($required_access, $_SESSION['permissions']);
}


?>


