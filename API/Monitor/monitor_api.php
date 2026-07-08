<?php
header("Content-Type: application/json");

// ✅ IMPORTANT: correct path (because inside API/Monitor/)
require_once '../../Connections/db_connect.php';

// ✅ FORCE MANILA TIME (NOT CLIENT TIME)
date_default_timezone_set('Asia/Manila');
$today = date('Y-m-d');

// ==========================================
// FETCH DATA
// ==========================================
// FIX: Added 'for approval' to the IN clause
$sql = "SELECT queue_number, priority, record_status, created_at
        FROM service_queues
        WHERE DATE(created_at) = :today
        AND record_status IN ('pending', 'for approval', 'processing')
        AND queue_number LIKE 'W%'
        ORDER BY priority DESC, created_at ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute([':today' => $today]);

$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ==========================================
// PREPARE GROUPS (4 CONTAINERS NOW)
// ==========================================
$proc_normal   = [];
$proc_priority = [];

$pend_normal   = [];
$pend_priority = [];

// ==========================================
// PROCESS LOGIC
// ==========================================
foreach ($data as $row) {

    $priority = (int)$row['priority'];
    $status = $row['record_status'];

    // ======================
    // PROCESSING
    // ======================
    if ($status === 'processing') {
        if ($priority === 0) {
            $proc_normal[] = $row;
        } else {
            $proc_priority[] = $row;
        }
    }

    // ======================
    // PENDING & FOR APPROVAL
    // ======================
    // FIX: Check for both 'pending' and 'for approval'
    if ($status === 'pending' || $status === 'for approval') {
        if ($priority === 0) {
            $pend_normal[] = $row;
        } else {
            $pend_priority[] = $row;
        }
    }
}

// ==========================================
// RETURN JSON
// ==========================================
echo json_encode([
    "proc_normal"   => $proc_normal,
    "proc_priority" => $proc_priority,

    "pend_normal"   => $pend_normal,
    "pend_priority" => $pend_priority
]);