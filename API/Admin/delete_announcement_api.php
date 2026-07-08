<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

// Ensure it's a POST request and an ID was sent
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

try {
    // Soft Delete: Update the status to 'Archived' instead of permanently deleting
    $stmt = $pdo->prepare("UPDATE news_announcements SET status = 'Archived' WHERE id = :id");
    $stmt->execute([':id' => (int)$_POST['id']]);

    // Check if the update was successful (rowCount will be 0 if it was already Archived)
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Announcement moved to archives.']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Announcement is already archived or not found.']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>