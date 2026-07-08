<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can execute this
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

// Grab the user_id integer from the login session!
$staff_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

// Security fallback: Prevent execution if session was lost
if ($staff_id === 0) {
    echo json_encode(['success' => false, 'message' => 'Session invalid or expired. Please log in again.']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$queue_number = $data['queue_number'] ?? '';

if (empty($queue_number)) {
    echo json_encode(['success' => false, 'message' => 'Queue number is required.']);
    exit;
}

try {
    // UPDATED QUERY: We now lock the document if it is 'pending' or 'processing' (Updated to record_status)
    $sql = "UPDATE service_queues 
            SET processed_by = :staff_set, updated_at = NOW() 
            WHERE queue_number = :queue_number 
            AND record_status IN ('pending', 'processing') 
            AND (processed_by IS NULL OR processed_by = :staff_check)";
    
    $stmt = $pdo->prepare($sql);
    
    // Pass the integer $staff_id into the execute array
    $stmt->execute([
        ':staff_set'    => $staff_id,
        ':queue_number' => $queue_number,
        ':staff_check'  => $staff_id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        // If rowCount is 0, let's figure out why it failed to lock
        $check = $pdo->prepare("SELECT record_status, processed_by FROM service_queues WHERE queue_number = ?");
        $check->execute([$queue_number]);
        $row = $check->fetch();

        if ($row) {
            // Check against our new allowed locking states
            if (!in_array($row['record_status'], ['pending', 'processing'])) {
                echo json_encode(['success' => false, 'message' => "Document cannot be opened. Status is currently: " . strtoupper($row['record_status'])]);
            } elseif ($row['processed_by'] !== null && $row['processed_by'] != $staff_id) {
                echo json_encode(['success' => false, 'message' => "This document is already open in another staff member's workspace."]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to lock the document.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Record not found in the database.']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>