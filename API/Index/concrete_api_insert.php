<?php
// API/Index/concrete_api_insert.php
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

    // 1. Get prefix (Default to 'WCP-' for Web Concrete Pouring)
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WCP-';

    // 2. Count rows in the Concrete table to get the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_certificate_concrete_pouring";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $formatted_queue = $prefix . $next_number; // e.g., WCP-1

    // 3. Insert into Universal Queue Ledger
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('Concrete Pouring', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 4. Insert Request Data into the Concrete Pouring Table
    $insert_sql = "INSERT INTO request_certificate_concrete_pouring (
        company_name, purpose, location, date_from_to, time_from, time_to, 
        vehicles, contact_number, queue_number, record_status
    ) VALUES (
        :company, :purpose, :location, :date_range, :time_from, :time_to, 
        :vehicles, :phone, :queue, 'for approval'
    )";
    
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':company'    => $data['company_name'],
        ':purpose'    => $data['purpose'],
        ':location'   => $data['location'],
        ':date_range' => $data['date_range'],
        ':time_from'  => $data['time_from'],
        ':time_to'    => $data['time_to'],
        ':vehicles'   => $data['vehicles'],
        ':phone'      => $data['phone'],
        ':queue'      => $formatted_queue
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Concrete Pouring request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>