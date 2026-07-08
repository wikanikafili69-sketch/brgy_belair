<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

// Get the raw POST data from the JavaScript fetch
$data = json_decode(file_get_contents("php://input"), true);

// Check if we received the ID and the new Status
$rbi_id = isset($data['rbi_id']) ? $data['rbi_id'] : null;
$status = isset($data['status']) ? $data['status'] : null;

if (!$rbi_id || !$status) {
    echo json_encode(['success' => false, 'message' => 'Missing ID or Status.']);
    exit;
}

try {
    // Update the status in your user_info table
    $sql = "UPDATE user_info SET status = :status WHERE rbi_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':id' => $rbi_id
    ]);

    echo json_encode(['success' => true, 'message' => "Resident successfully marked as $status."]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>