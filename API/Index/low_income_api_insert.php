<?php
// API/Index/low_income_api_insert.php
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

    // 1. Get prefix (Default to 'WL-' for Web Low Income)
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WL-';

    // 2. Count rows in the Low Income table to get the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_certificate_low_income";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $formatted_queue = $prefix . $next_number; // e.g., WL-1

    // 3. Insert into Universal Queue Ledger
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('Certificate of Low Income', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 4. Insert Request Data into the Low Income Table
    // --> Added 'other_purpose_details' to the columns
    $insert_sql = "INSERT INTO request_certificate_low_income (
        full_name, home_address, purpose, other_purpose_details, contact_number, 
        income_amount, work_details, queue_number, record_status
    ) VALUES (
        :fname, :addr, :purpose, :other_purpose, :phone, 
        :amount, :work, :queue, 'for approval'
    )";
    
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':fname'         => $data['full_name'],
        ':addr'          => $data['home_address'],
        ':purpose'       => $data['purpose'],
        // Handle the new Other Purpose column safely
        ':other_purpose' => !empty($data['other_purpose_details']) ? $data['other_purpose_details'] : null,
        ':phone'         => $data['phone'],
        ':amount'        => $data['amount'],
        ':work'          => $data['work'],
        ':queue'         => $formatted_queue
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Low Income request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>