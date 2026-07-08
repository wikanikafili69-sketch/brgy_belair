<?php
// API/Index/legal_guardian_api_insert.php
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

    // 1. Get prefix (Default to 'WLG-' for Web Legal Guardian)
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WLG-';

    // 2. Count rows in the Legal Guardian table to get the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_certificate_legal_guardian";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $formatted_queue = $prefix . $next_number; // e.g., WLG-1

    // 3. Insert into Universal Queue Ledger
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('Legal Guardian Certificate', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 4. Insert Request Data into the Legal Guardian Table
    // --> Added 'other_purpose_details' to the columns
    $insert_sql = "INSERT INTO request_certificate_legal_guardian (
        full_name, legal_guardian_name, home_address, purpose, other_purpose_details,
        contact_number, queue_number, record_status
    ) VALUES (
        :fname, :guardian, :addr, :purpose, :other_purpose,
        :phone, :queue, 'for approval'
    )";
    
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':fname'         => $data['full_name'],
        ':guardian'      => $data['legal_guardian_name'],
        ':addr'          => $data['home_address'],
        ':purpose'       => $data['purpose'],
        // Handle the new Other Purpose column safely
        ':other_purpose' => !empty($data['other_purpose_details']) ? $data['other_purpose_details'] : null,
        ':phone'         => $data['phone'],
        ':queue'         => $formatted_queue
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Legal Guardian request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>