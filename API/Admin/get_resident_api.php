<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    // If a specific ID is requested, return just that resident
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM user_info WHERE rbi_id = :id LIMIT 1");
        $stmt->execute([':id' => $_GET['id']]);
        $resident = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($resident) {
            echo json_encode(['success' => true, 'data' => $resident]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Resident not found.']);
        }
    } 
    // Otherwise, fetch all active residents
    else {
        $stmt = $pdo->query("SELECT * FROM user_info WHERE status = 'Active' ORDER BY last_name ASC, first_name ASC");
        $residents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'     => true,
            'data'        => $residents,
            'total_count' => count($residents)
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>