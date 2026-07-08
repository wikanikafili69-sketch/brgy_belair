<?php
// API/Index/insert_residency.php
header("Content-Type: application/json");

// Go up two folders (API -> Index) to reach the Connections folder
require_once '../../Connections/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit;
}

try {
    // Start Transaction
    $pdo->beginTransaction();

    // 1. Get the prefix sent from JavaScript (Default to 'WR-')
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WR-';

    // 2. Count total rows to determine the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_certificate_residency";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    
    // 3. Combine the prefix and the number (e.g., 'WR-1')
    $formatted_queue = $prefix . $next_number;

    // 4. Insert into the Universal Queue Ledger (lowercase 'pending')
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('Certificate of Residency', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 5. Insert Request Data into the Residency Table
    // ADDED: other_purpose_details column
    $insert_sql = "INSERT INTO request_certificate_residency (
        full_name, home_address, purpose, other_purpose_details, contact_number, queue_number, record_status
    ) VALUES (
        :fname, :addr, :purpose, :other_purpose, :phone, :queue, 'for approval'
    )";
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':fname'         => $data['full_name'],
        ':addr'          => $data['home_address'],
        ':purpose'       => $data['purpose'],
        ':other_purpose' => isset($data['other_purpose_details']) ? $data['other_purpose_details'] : null,
        ':phone'         => $data['phone'],
        ':queue'         => $formatted_queue
    ]);

    // Commit Transaction
    $pdo->commit();

    // Send success response
    echo json_encode([
        'success' => true,
        'message' => 'Residency request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    // Rollback if anything fails
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>