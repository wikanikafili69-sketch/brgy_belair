<?php

require_once '../../Admin/admin_auth.php';
require_once '../../Connections/db_connect.php'; 

header('Content-Type: application/json');

try {
    // 1. Fetch Statistics
    $total_staff = $pdo->query("SELECT COUNT(*) FROM user_credentials")->fetchColumn();
    $active_staff = $pdo->query("SELECT COUNT(*) FROM user_credentials WHERE status = 'active'")->fetchColumn();
    $admin_roles = $pdo->query("SELECT COUNT(*) FROM user_credentials WHERE position = 'admin'")->fetchColumn();
    $suspended_staff = $pdo->query("SELECT COUNT(*) FROM user_credentials WHERE status = 'archived'")->fetchColumn();
    
    // ═══════════════════════════════════════════════════
    // 2. FETCH USERS WITH ACCESS RIGHTS (UPDATED)
    // ═══════════════════════════════════════════════════
    // We use LEFT JOIN to get all users even if they have 0 access rights.
    // GROUP_CONCAT bundles their access_ids together like "1,4,5"
    $stmt = $pdo->query("
        SELECT u.*, GROUP_CONCAT(ua.access_id) as access_rights_csv 
        FROM user_credentials u 
        LEFT JOIN user_access ua ON u.user_id = ua.user_id 
        GROUP BY u.user_id 
        ORDER BY u.created_at DESC
    ");
    
    $raw_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $users = [];

    // Loop through and clean up the data for JavaScript
    foreach ($raw_users as $user) {
        // Turn the "1,4,5" string into a real PHP array: [1, 4, 5]
        if (!empty($user['access_rights_csv'])) {
            $user['access_rights'] = explode(',', $user['access_rights_csv']);
        } else {
            $user['access_rights'] = []; // Empty array if no access rights
        }
        
        // Remove the temporary CSV column so our JSON stays clean
        unset($user['access_rights_csv']);
        
        // Add the cleaned user to our final array
        $users[] = $user;
    }
    // ═══════════════════════════════════════════════════

    // 3. Return as JSON
    echo json_encode([
        'success' => true,
        'stats' => [
            'total' => $total_staff,
            'active' => $active_staff,
            'admin' => $admin_roles,
            'suspended' => $suspended_staff
        ],
        'data' => $users
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>