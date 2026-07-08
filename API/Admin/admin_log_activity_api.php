<?php
require_once '../../Admin/admin_auth.php';
error_reporting(0); 
header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

try {
    // ⚠️ Adjust this path to your DB connection file
    require_once '../../Connections/db_connect.php'; 

    // Get the incoming JSON data from JavaScript
    $data = json_decode(file_get_contents("php://input"), true);
    $action = isset($data['action']) ? trim($data['action']) : '';
    
    // Safely get the current admin's name from the session
    $staff_name = isset($_SESSION['admin_name']) ? $_SESSION['admin_name'] : 'Administrator';

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