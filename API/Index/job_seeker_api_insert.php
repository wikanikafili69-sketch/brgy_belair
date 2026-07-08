<?php
// API/Index/job_seeker_api_insert.php
header("Content-Type: application/json");

// Go up two folders to reach the Connections folder
require_once '../../Connections/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Get prefix (Default to 'WJS-' for Web Job Seeker)
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WJS-';

    // 2. Count rows in the Job Seeker table to get the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_first_time_job_seeker";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $formatted_queue = $prefix . $next_number; // e.g., WJS-1

    // 3. Insert into Universal Queue Ledger
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('First Time Job Seeker', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 4. Insert Request Data into the Job Seeker Table
    $insert_sql = "INSERT INTO request_first_time_job_seeker (
        full_name, home_address, residency_duration, contact_number, 
        queue_number, record_status
    ) VALUES (
        :fname, :addr, :duration, :phone, 
        :queue, 'for approval'
    )";
    
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':fname'    => $data['full_name'],
        ':addr'     => $data['home_address'],
        ':duration' => $data['residency_duration'],
        ':phone'    => $data['phone'],
        ':queue'    => $formatted_queue
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'First Time Job Seeker request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>