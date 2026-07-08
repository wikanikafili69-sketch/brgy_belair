<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

// Ensure an ID was passed in the URL (e.g., ?id=5)
if (empty($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'No ID provided.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM news_announcements WHERE id = :id");
    $stmt->execute([':id' => (int)$_GET['id']]);
    $announcement = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($announcement) {
        echo json_encode(['success' => true, 'data' => $announcement]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Announcement not found.']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>