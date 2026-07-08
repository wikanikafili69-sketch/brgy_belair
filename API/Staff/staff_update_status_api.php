<?php
// Require the Staff bouncer
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php'; 

$data = json_decode(file_get_contents("php://input"), true);
$queue_number = $data['queue_number'] ?? '';
// Updated to look for 'record_status' sent by our new JS file
$status = strtolower($data['record_status'] ?? ''); 

// 1. Basic validation
if (empty($queue_number) || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Queue number and record_status are required.']);
    exit;
}

// 2. SECURITY: Staff are now allowed to move documents between these four states
$allowed_statuses = ['pending', 'processing', 'completed', 'rejected'];
if (!in_array($status, $allowed_statuses)) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized status change.']);
    exit;
}

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

    if ($status === 'pending') {
        // Staff reverted to pending/unlocked (Updated to record_status)
        $sql_main = "UPDATE service_queues SET record_status = ?, processed_by = NULL, updated_at = NOW() WHERE queue_number = ?";
    } else {
        // Staff marked as processing, completed, or rejected (Updated to record_status)
        $sql_main = "UPDATE service_queues SET record_status = ?, updated_at = NOW() WHERE queue_number = ?";
    }
    
    $stmt_main = $pdo->prepare($sql_main);
    $stmt_main->execute([$status, $queue_number]);

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