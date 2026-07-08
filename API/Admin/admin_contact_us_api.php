<?php
session_start();
// Adjust this path if necessary to point to your DB connection
require_once '../../Connections/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    try {
        $stmt = $pdo->prepare("SELECT * FROM contact_us WHERE status = 'active' ORDER BY date_created DESC");
        $stmt->execute();
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $messages]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}
?>