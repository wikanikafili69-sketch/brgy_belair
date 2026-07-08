<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    $date = $_GET['filter_date'] ?? '';
    $status = $_GET['filter_status'] ?? 'all';

    // FIXED: Aliased record_status AS status
    $query = "SELECT queue_number, service_type, created_at, record_status AS status FROM service_queues WHERE 1=1";
    $params = [];

    if (!empty($date)) {
        $query .= " AND DATE(created_at) = :date";
        $params[':date'] = $date;
    }
    if ($status !== 'all') {
        // FIXED: Filtering uses record_status
        $query .= " AND record_status = :status";
        $params[':status'] = $status;
    }

    $query .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $results]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>