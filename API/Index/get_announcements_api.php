<?php
// API/Index/get_announcements_api.php
session_start();
header("Content-Type: application/json");

// Adjust the path to your db connection file. Assuming it's in '../../Connections/'
require_once '../../Connections/db_connect.php';

try {
    // 1. Fetch the 3 Featured Announcements
    $stmtFeatured = $pdo->query("SELECT * FROM news_announcements WHERE is_featured = 1 AND status = 'Active' ORDER BY publish_date DESC LIMIT 3");
    $featuredData = $stmtFeatured->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch the rest of the Announcements
    $stmtList = $pdo->query("SELECT * FROM news_announcements WHERE is_featured = 0 AND status = 'Active' ORDER BY publish_date DESC");
    $listData = $stmtList->fetchAll(PDO::FETCH_ASSOC);

    // Add formatted_date for JavaScript display
    foreach ($featuredData as &$item) {
        $item['formatted_date'] = date('M d, Y', strtotime($item['publish_date']));
    }
    foreach ($listData as &$item) {
        $item['formatted_date'] = date('M d, Y', strtotime($item['publish_date']));
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'featured' => $featuredData, // This sends all 3 to the JS
            'list' => $listData
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>