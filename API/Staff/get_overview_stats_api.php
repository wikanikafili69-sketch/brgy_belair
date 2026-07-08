<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    // --- 1. CORE STATS (The 4 Cards) ---
    $totalResidents = $pdo->query("SELECT COUNT(*) FROM user_info WHERE status = 'Active'")->fetchColumn();
    $newResidents = $pdo->query("SELECT COUNT(*) FROM user_info WHERE status = 'Active' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())")->fetchColumn();
    $totalRequests = $pdo->query("SELECT COUNT(*) FROM service_queues")->fetchColumn();
    $newRequests = $pdo->query("SELECT COUNT(*) FROM service_queues WHERE WEEK(created_at, 1) = WEEK(CURDATE(), 1)")->fetchColumn();
    $todaysWalkin = $pdo->query("SELECT COUNT(*) FROM service_queues WHERE queue_number LIKE 'W%' AND DATE(created_at) = CURDATE()")->fetchColumn();
    $todaysOnline = $pdo->query("SELECT COUNT(*) FROM service_queues WHERE queue_number LIKE 'O%' AND DATE(created_at) = CURDATE()")->fetchColumn();

    // --- 2. NOW SERVING (Live Processing) ---
    // FIXED: Changed status to record_status
    $servingStmt = $pdo->query("SELECT queue_number, service_type FROM service_queues WHERE record_status = 'processing' ORDER BY updated_at DESC LIMIT 3");
    $nowServing = $servingStmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 3. RECENT ACTIVITY (The Pulse) ---
    // FIXED: Aliased record_status to status
    $activityStmt = $pdo->query("SELECT queue_number, record_status AS status, updated_at FROM service_queues ORDER BY updated_at DESC LIMIT 5");
    $recentActivity = $activityStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => [
            'stats' => [
                'total_residents' => $totalResidents,
                'new_residents_month' => $newResidents,
                'total_requests' => $totalRequests,
                'new_requests_week' => $newRequests,
                'walkin_today' => $todaysWalkin,
                'online_today' => $todaysOnline
            ],
            'serving' => $nowServing,
            'activity' => $recentActivity
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>