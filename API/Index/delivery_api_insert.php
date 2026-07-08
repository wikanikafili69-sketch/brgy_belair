<?php
// API/Index/delivery_api_insert.php
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

    // 1. Get prefix (Default to 'WDL-' for Web Delivery)
    $prefix = isset($data['queue_prefix']) ? $data['queue_prefix'] : 'WDL-';

    // 2. Count rows in the Delivery table to get the next number
    $count_sql = "SELECT COUNT(*) as total_rows FROM request_clearance_delivery_parking";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $formatted_queue = $prefix . $next_number; // e.g., WDL-1

    // 3. Insert into Universal Queue Ledger
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status) 
                  VALUES ('Truck / Delivery', :qno, 'for approval')";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([':qno' => $formatted_queue]);

    // 4. Insert Request Data into the Delivery Table
    // Changed additional_contact_number to other_purpose_details
    $insert_sql = "INSERT INTO request_clearance_delivery_parking (
        company_name, location, date_from_to, time_from, time_to, 
        vehicle_plate_number, purpose, other_purpose_details, contact_number, 
        queue_number, record_status
    ) VALUES (
        :company, :location, :date_range, :time_from, :time_to, 
        :vehicles, :purpose, :other_purpose, :phone, 
        :queue, 'for approval'
    )";
    
    $insert_stmt = $pdo->prepare($insert_sql);
    $insert_stmt->execute([
        ':company'       => $data['company_name'],
        ':location'      => $data['location'],
        ':date_range'    => $data['date_range'],
        ':time_from'     => $data['time_from'],
        ':time_to'       => $data['time_to'],
        ':vehicles'      => $data['vehicles'],
        ':purpose'       => $data['purpose'],
        ':other_purpose' => !empty($data['other_purpose_details']) ? $data['other_purpose_details'] : null,
        ':phone'         => $data['phone'],
        ':queue'         => $formatted_queue
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Delivery Clearance request submitted.',
        'queue_no' => $formatted_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>