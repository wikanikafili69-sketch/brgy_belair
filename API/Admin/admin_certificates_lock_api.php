<?php
// 1. Require the Admin bouncer to ensure only logged-in Admins can execute this
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

// Grab the user_id integer from the login session!
$admin_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

// Security fallback: Prevent execution if session was lost
if ($admin_id === 0) {
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
    // ✅ CHANGED: status -> record_status
    $sql = "UPDATE service_queues 
            SET record_status = 'processing', processed_by = :admin_set, updated_at = NOW() 
            WHERE queue_number = :queue_number 
            AND (record_status = 'pending' OR (record_status = 'processing' AND processed_by = :admin_check))";
    
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':admin_set'    => $admin_id,
        ':queue_number' => $queue_number,
        ':admin_check'  => $admin_id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        // ✅ CHANGED: status -> record_status
        $check = $pdo->prepare("SELECT record_status, processed_by FROM service_queues WHERE queue_number = ?");
        $check->execute([$queue_number]);
        $row = $check->fetch();

        if ($row && $row['record_status'] === 'processing') {
            echo json_encode(['success' => false, 'message' => "This request is already being processed by another staff member or admin."]);
        } else {
            echo json_encode(['success' => false, 'message' => 'This request cannot be locked right now. It may have been completed or cancelled.']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>