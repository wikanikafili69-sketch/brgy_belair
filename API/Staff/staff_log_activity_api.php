<?php

require_once '../../Staff/staff_auth.php';
error_reporting(0); 
header('Content-Type: application/json');
//date_default_timezone_set('Asia/Manila');

try {
    // ⚠️ Adjust this path to your DB connection file
    require_once '../../Connections/db_connect.php'; 

    // Get the incoming JSON data from JavaScript
    $data = json_decode(file_get_contents("php://input"), true);
    $action = isset($data['action']) ? trim($data['action']) : '';
    
    // Safely get the current staff's name from the session 
    // (login_process.php sets this as 'admin_name' for both staff and admins)
    $staff_name = isset($_SESSION['admin_name']) ? $_SESSION['admin_name'] : 'Staff Member';

    if (empty($action)) {
        throw new Exception("No action provided.");
    }

    $timestamp = date('Y-m-d H:i:s');

    // Insert into your activity_logs table using PDO
    $stmt = $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (:name, :action, :time)");
    $stmt->execute([
        'name' => $staff_name,
        'action' => $action,
        'time' => $timestamp
    ]);

    echo json_encode(['success' => true, 'message' => 'Logged successfully']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>