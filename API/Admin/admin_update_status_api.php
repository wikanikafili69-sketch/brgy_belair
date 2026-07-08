<?php
// Fix the paths: Go up two folders to reach the main Admin and Connections folders
require_once '../../Admin/admin_auth.php'; 
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php'; 

$data = json_decode(file_get_contents("php://input"), true);
$queue_number = $data['queue_number'] ?? '';
$status = strtolower($data['status'] ?? ''); 

// 1. Basic validation
if (empty($queue_number) || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Queue number and status are required.']);
    exit;
}

// 2. SECURITY: Strict Whitelist (✅ UPDATED with your new statuses)
$allowed_statuses = [
    'for approval', 
    'pending', 
    'processing', 
    'ready for pickup', 
    'completed', 
    'rejected', 
    'cancelled' // Kept cancelled just in case legacy data uses it!
];

if (!in_array($status, $allowed_statuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status change requested.']);
    exit;
}

// 3. List of ALL your specific service tables
$service_tables = [
    'request_business_clearance',
    'request_certificate_concrete_pouring',
    'request_certificate_indigency',
    'request_certificate_legal_guardian',
    'request_certificate_low_income',
    'request_certificate_residency',
    'request_certificate_tent_permit',
    'request_clearance_delivery_parking',
    'request_first_time_job_seeker',
    'request_barangay_id',
    'request_other_services'
];

try {
    $pdo->beginTransaction();

    // ✅ CHANGED: Target 'record_status' instead of 'status'
    // If reverting to pending or for approval, clear the 'processed_by' lock
    if ($status === 'pending' || $status === 'for approval') {
        $sql_main = "UPDATE service_queues SET record_status = ?, processed_by = NULL, updated_at = NOW() WHERE queue_number = ?";
        $stmt_main = $pdo->prepare($sql_main);
        $stmt_main->execute([$status, $queue_number]);
    } else {
        $sql_main = "UPDATE service_queues SET record_status = ?, updated_at = NOW() WHERE queue_number = ?";
        $stmt_main = $pdo->prepare($sql_main);
        $stmt_main->execute([$status, $queue_number]);
    }

    // Update the specific service tables as well
    foreach ($service_tables as $table) {
        $sql_service = "UPDATE `$table` SET record_status = ? WHERE queue_number = ?";
        $stmt_service = $pdo->prepare($sql_service);
        $stmt_service->execute([$status, $queue_number]);
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>