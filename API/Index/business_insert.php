<?php
// API/Index/insert_business.php
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

    // 1. Get prefix (Default to 'WB-' for Web Business)
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WB-';

    // 2. Count rows in the Business table to get the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_business_clearance";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $formatted_queue = $prefix . $next_number; // e.g., WB-1

    // 3. Insert into Universal Queue Ledger
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('Business Clearance', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 4. Insert Request Data into the Business Table
    $insert_sql = "INSERT INTO request_business_clearance (
        full_name, clearance_type, business_category, kind_of_business, 
        business_name, business_address, contact_number, queue_number, record_status
    ) VALUES (
        :fname, :ctype, :bcat, :kind, 
        :bname, :baddr, :phone, :queue, 'for approval'
    )";
    
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':fname'  => $data['full_name'],
        ':ctype'  => $data['clearance_type'],
        ':bcat'   => $data['business_category'],
        ':kind'   => $data['kind_of_business'],
        ':bname'  => $data['business_name'],
        ':baddr'  => $data['business_address'],
        ':phone'  => $data['phone'],
        ':queue'  => $formatted_queue
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Business Clearance request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>