<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

$queue_number = isset($_GET['queue_number']) ? $_GET['queue_number'] : '';

if (empty($queue_number)) {
    echo json_encode(['success' => false, 'message' => 'Queue number is required.']);
    exit;
}

try {
    // 1. FIRST: Get the master status from the service_queues table! (Updated to record_status)
    $status_stmt = $pdo->prepare("SELECT record_status, created_at FROM service_queues WHERE queue_number = :qno LIMIT 1");
    $status_stmt->execute([':qno' => $queue_number]);
    $master_record = $status_stmt->fetch(PDO::FETCH_ASSOC);
    
    // Updated to record_status
    $master_status = $master_record ? $master_record['record_status'] : 'pending';

    // 2. Define ALL the tables we need to search
    $tables_to_search = [
        'request_business_clearance'         => 'business clearance',
        'request_certificate_concrete_pouring'=> 'concrete pouring',
        'request_certificate_indigency'      => 'indigency',
        'request_certificate_legal_guardian' => 'legal guardian',
        'request_certificate_low_income'     => 'low income',
        'request_certificate_residency'      => 'residency',
        'request_certificate_tent_permit'    => 'tent permit',
        'request_clearance_delivery_parking' => 'delivery parking',
        'request_first_time_job_seeker'      => 'first time job seeker',
        'request_barangay_id'                => 'barangay id',       
        'request_other_services'             => 'other services'     
    ];

    $all_items_found = [];

    // 3. Hunt through every table for this exact Queue Number
    foreach ($tables_to_search as $table => $service_name) {
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE BINARY queue_number = :qno");
        $stmt->execute([':qno' => $queue_number]);
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($rows) {
            foreach ($rows as $row) {
                $row['internal_service_type'] = $service_name;
                
                // Updated to record_status so the frontend JS reads it properly
                $row['record_status'] = $master_status;
                
                // 🔥 NEW: Check Blotter Status for this specific resident
                $name = !empty($row['full_name']) ? $row['full_name'] : (!empty($row['resident_name']) ? $row['resident_name'] : '');
                $has_blotter = 0;
                
                if ($name) {
                    $parts = explode(' ', trim($name));
                    $first = $parts[0];
                    $last = count($parts) > 1 ? end($parts) : '';
                    
                    $b_sql = "SELECT 1 FROM blotter_list WHERE blotter_type IN ('BLOTTER', 'COMPLAIN') AND LOWER(status) = 'active' AND defendants LIKE ?";
                    $b_params = ["%$first%"];
                    if ($last) {
                        $b_sql .= " AND defendants LIKE ?";
                        $b_params[] = "%$last%";
                    }
                    $b_stmt = $pdo->prepare($b_sql);
                    $b_stmt->execute($b_params);
                    if ($b_stmt->fetch()) {
                        $has_blotter = 1;
                    }
                }
                
                $row['has_blotter'] = $has_blotter;
                $all_items_found[] = $row;
            }
        }
    }

    if (count($all_items_found) === 0) {
        echo json_encode(['success' => false, 'message' => 'No request details found for this queue number across any tables.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data' => $all_items_found 
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>