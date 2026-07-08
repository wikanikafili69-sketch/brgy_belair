<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

// 🔥 SUPPORT BOTH JSON + FORM DATA
$data = $_POST;

if (empty($data)) {
    $data = json_decode(file_get_contents("php://input"), true);
}

$rbi_id = $data['rbi_id'] ?? null;
$status = $data['status'] ?? null;

// ── VALIDATION ─────────────────────────────
if (!$rbi_id || !$status) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing Resident ID or Status.'
    ]);
    exit;
}

// 🔥 ALLOWED STATUS ONLY (SAFE)
$allowedStatus = ['Active', 'Archived'];

if (!in_array($status, $allowedStatus)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid status value.'
    ]);
    exit;
}

try {

    // ── CHECK IF EXISTS ─────────────────────
    $check = $pdo->prepare("SELECT rbi_id FROM user_info WHERE rbi_id = :id");
    $check->execute([':id' => $rbi_id]);

    if ($check->rowCount() === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Resident not found.'
        ]);
        exit;
    }

    // ── UPDATE STATUS ───────────────────────
    $sql = "UPDATE user_info SET status = :status WHERE rbi_id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':id' => $rbi_id
    ]);

    echo json_encode([
        'success' => true,
        'message' => "Resident successfully marked as $status."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>