<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['id']) || empty($_POST['status'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

try {
    $id = (int)$_POST['id'];
    $newStatus = $_POST['status']; // Will be 'Active' or 'Archived'

    // If archiving, automatically un-feature it. Otherwise, leave is_featured alone.
    $featuredUpdate = ($newStatus === 'Archived') ? ", is_featured = 0" : "";

    // Update the status (and potentially the featured flag) in the database
    $sql = "UPDATE news_announcements SET status = :status" . $featuredUpdate . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':status' => $newStatus, ':id' => $id]);

    $message = $newStatus === 'Archived' ? 'Announcement archived (and un-featured).' : 'Announcement restored to active.';
    echo json_encode(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>