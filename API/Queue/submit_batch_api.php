<?php
// API/Queue/submit_batch_api.php
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

$cart = json_decode(file_get_contents('php://input'), true);

if (!$cart || empty($cart)) {
    echo json_encode(['success' => false, 'message' => 'Cart is empty or no data received.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // ---------------------------------------------------------
    // 1. GENERATE MASTER QUEUE NUMBER
    // ---------------------------------------------------------
    $prefix = "WK-"; 
    $count_sql = "SELECT COUNT(*) as total_rows FROM service_queues";
    $count_stmt = $pdo->query($count_sql);
    $row_data = $count_stmt->fetch();
    
    $next_number = $row_data['total_rows'] + 1;
    $master_queue = $prefix . str_pad($next_number, 4, '0', STR_PAD_LEFT);

    // ---------------------------------------------------------
    // 2. COMBINE SERVICE TYPES
    // ---------------------------------------------------------
    $service_types_array = [];
    foreach ($cart as $item) {
        $service_types_array[] = $item['service_type'];
    }
    $combined_service_types = implode(', ', array_unique($service_types_array));

    // ---------------------------------------------------------
    // ✅ NEW: GET HIGHEST PRIORITY FROM CART
    // ---------------------------------------------------------
    $priority_level = 0;

    foreach ($cart as $item) {
        if (isset($item['priority']) && (int)$item['priority'] > $priority_level) {
            $priority_level = (int)$item['priority'];
        }
    }

    // ---------------------------------------------------------
    // 3. INSERT INTO SERVICE QUEUE (WITH PRIORITY)
    // ---------------------------------------------------------
    $queue_sql = "INSERT INTO service_queues (service_type, queue_number, record_status, priority) 
                  VALUES (:stype, :qno, 'for approval', :priority)";
    $queue_stmt = $pdo->prepare($queue_sql);
    $queue_stmt->execute([
        ':stype'    => $combined_service_types,
        ':qno'      => $master_queue,
        ':priority' => $priority_level
    ]);

    // ---------------------------------------------------------
    // 4. DISTRIBUTE CART ITEMS TO SPECIFIC TABLES
    // ---------------------------------------------------------
    foreach ($cart as $item) {
        
        switch ($item['service_type']) {
            
            case 'Business Clearance':
                $insert_sql = "INSERT INTO request_business_clearance (
                    full_name, clearance_type, business_category, kind_of_business, 
                    business_name, business_address, contact_number, queue_number, record_status
                ) VALUES (:fname, :ctype, :bcat, :kind, :bname, :baddr, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'  => $item['fullname'],
                    ':ctype'  => $item['clearance_type'],
                    ':bcat'   => $item['business_type'], 
                    ':kind'   => $item['business_kind'],
                    ':bname'  => $item['business_name'],
                    ':baddr'  => $item['address'],
                    ':phone'  => $item['phone'],
                    ':queue'  => $master_queue 
                ]);
                break;

            case 'Concrete Pouring':
                $insert_sql = "INSERT INTO request_certificate_concrete_pouring (
                    company_name, purpose, location, date_from_to, time_from, time_to, 
                    vehicles, contact_number, queue_number, record_status
                ) VALUES (:company, :purpose, :location, :date_range, :time_from, :time_to, :vehicles, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':company'    => $item['company_name'],
                    ':purpose'    => $item['purpose'],
                    ':location'   => $item['location'],
                    ':date_range' => $item['date_range'],
                    ':time_from'  => $item['time_from'],
                    ':time_to'    => $item['time_to'],
                    ':vehicles'   => $item['vehicles'],
                    ':phone'      => $item['phone'],
                    ':queue'      => $master_queue
                ]);
                break;

            case 'Truck / Delivery':
                $insert_sql = "INSERT INTO request_clearance_delivery_parking (
                    company_name, location, date_from_to, time_from, time_to, 
                    vehicle_plate_number, purpose, other_purpose_details, contact_number, 
                    queue_number, record_status
                ) VALUES (:company, :location, :date_range, :time_from, :time_to, :vehicles, :purpose, :other_purpose, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':company'       => $item['company_name'],
                    ':location'      => $item['location'],
                    ':date_range'    => $item['date_range'],
                    ':time_from'     => $item['time_from'],
                    ':time_to'       => $item['time_to'],
                    ':vehicles'      => $item['vehicles'],
                    ':purpose'       => $item['purpose'],
                    ':other_purpose' => !empty($item['other_purpose']) ? $item['other_purpose'] : null,
                    ':phone'         => $item['phone'],
                    ':queue'         => $master_queue
                ]);
                break;

            case 'Certificate of Indigency':
                $insert_sql = "INSERT INTO request_certificate_indigency (
                    full_name, home_address, certificate_type, authorized_person, 
                    household_type, purpose, other_purpose_details, contact_number, queue_number, record_status
                ) VALUES (:fname, :addr, :ctype, :auth, :house, :purpose, :other_purpose, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'         => $item['fullname'],
                    ':addr'          => $item['address'],
                    ':ctype'         => 'CERTIFICATE OF INDIGENCY', 
                    ':auth'          => null, 
                    ':house'         => null, 
                    ':purpose'       => $item['purpose'],
                    ':other_purpose' => !empty($item['other_purpose']) ? $item['other_purpose'] : null,
                    ':phone'         => $item['phone'],
                    ':queue'         => $master_queue
                ]);
                break;

            case 'First Time Job Seeker':
                $insert_sql = "INSERT INTO request_first_time_job_seeker (
                    full_name, home_address, residency_duration, contact_number, 
                    queue_number, record_status
                ) VALUES (:fname, :addr, :duration, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'    => $item['fullname'],
                    ':addr'     => $item['address'],
                    ':duration' => $item['years_months'], 
                    ':phone'    => $item['phone'],
                    ':queue'    => $master_queue
                ]);
                break;

            case 'Legal Guardian Certificate':
                $insert_sql = "INSERT INTO request_certificate_legal_guardian (
                    full_name, legal_guardian_name, home_address, purpose, other_purpose_details,
                    contact_number, queue_number, record_status
                ) VALUES (:fname, :guardian, :addr, :purpose, :other_purpose, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'         => $item['fullname'],
                    ':guardian'      => $item['guardian'], 
                    ':addr'          => $item['address'],
                    ':purpose'       => $item['purpose'],
                    ':other_purpose' => !empty($item['other_purpose']) ? $item['other_purpose'] : null,
                    ':phone'         => $item['phone'],
                    ':queue'         => $master_queue
                ]);
                break;

            case 'Certificate of Low Income':
                $insert_sql = "INSERT INTO request_certificate_low_income (
                    full_name, home_address, purpose, other_purpose_details, contact_number, 
                    income_amount, work_details, queue_number, record_status
                ) VALUES (:fname, :addr, :purpose, :other_purpose, :phone, :amount, :work, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'         => $item['fullname'],
                    ':addr'          => $item['address'],
                    ':purpose'       => $item['purpose'],
                    ':other_purpose' => !empty($item['other_purpose']) ? $item['other_purpose'] : null,
                    ':phone'         => $item['phone'],
                    ':amount'        => $item['amount'],
                    ':work'          => $item['work'],
                    ':queue'         => $master_queue
                ]);
                break;

            case 'Certificate of Residency':
                $insert_sql = "INSERT INTO request_certificate_residency (
                    full_name, home_address, purpose, other_purpose_details, contact_number, 
                    queue_number, record_status
                ) VALUES (:fname, :addr, :purpose, :other_purpose, :phone, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'         => $item['fullname'],
                    ':addr'          => $item['address'],
                    ':purpose'       => $item['purpose'],
                    ':other_purpose' => !empty($item['other_purpose']) ? $item['other_purpose'] : null,
                    ':phone'         => $item['phone'],
                    ':queue'         => $master_queue
                ]);
                break;

            case 'Certificate of Tent Permit':
                // ✅ ADDED TENT PERMIT LOGIC
                $insert_sql = "INSERT INTO request_certificate_tent_permit (
                    full_name, home_address, purpose, other_purpose_details, 
                    contact_number, date_used, queue_number, record_status
                ) VALUES (:fname, :addr, :purpose, :other_purpose, :phone, :date_used, :queue, 'for approval')";
                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'         => $item['fullname'],
                    ':addr'          => $item['address'],
                    ':purpose'       => $item['purpose'],
                    ':other_purpose' => !empty($item['other_purpose']) ? $item['other_purpose'] : null,
                    ':phone'         => $item['phone'],
                    ':date_used'     => $item['date_used'],
                    ':queue'         => $master_queue
                ]);
                break;

            case 'Other Services':
                $insert_sql = "INSERT INTO request_other_services (
                    full_name, address, birthdate, contact_number, certificate_type, queue_number, record_status
                ) VALUES (:fname, :addr, :bday, :phone, :ctype, :queue, 'for approval')";

                $insert_stmt = $pdo->prepare($insert_sql);
                $insert_stmt->execute([
                    ':fname'  => $item['fullname'],
                    ':addr'   => $item['address'],
                    ':bday'   => $item['birthdate'],
                    ':phone'  => $item['phone'],
                    ':ctype'  => $item['certificate_type'],
                    ':queue'  => $master_queue
                ]);
                break;

            case 'Barangay ID':

                // ------------------------------------
                // 1. INSERT FIRST (NO PHOTO YET)
                // ------------------------------------
                $insert_sql = "INSERT INTO request_barangay_id (
                    full_name,
                    address,
                    birthdate,
                    contact_number,
                    email,
                    emergency_contact_name,
                    emergency_contact_number,
                    photo_path,
                    queue_number,
                    record_status
                ) VALUES (
                    :fname,
                    :addr,
                    :bday,
                    :phone,
                    :email,
                    :ecname,
                    :ecnum,
                    NULL,
                    :queue,
                    'for approval'
                )";

                $stmt = $pdo->prepare($insert_sql);
                $stmt->execute([
                    ':fname'  => $item['fullname'],
                    ':addr'   => $item['address'],
                    ':bday'   => $item['birthdate'],
                    ':phone'  => $item['phone'],
                    ':email'  => !empty($item['email']) ? $item['email'] : null,
                    ':ecname' => $item['emergency_name'],
                    ':ecnum'  => $item['emergency_number'],
                    ':queue'  => $master_queue
                ]);

                // ------------------------------------
                // 2. GET REAL AUTO ID
                // ------------------------------------
                $requestId = $pdo->lastInsertId();

                $photoPath = null;

                if (!empty($item['photo'])) {

                    $imageData = $item['photo'];

                    if (preg_match('/^data:image\/(\w+);base64,/', $imageData)) {

                        $imageData = substr($imageData, strpos($imageData, ',') + 1);
                        $imageData = base64_decode($imageData);

                        if ($imageData === false) {
                            throw new Exception("Invalid image encoding.");
                        }

                        if (strlen($imageData) > (10 * 1024 * 1024)) {
                            throw new Exception("Image exceeds 10MB limit.");
                        }

                        $uploadDir = '../../Images/id_pictures/';
                        if (!is_dir($uploadDir)) {
                            mkdir($uploadDir, 0777, true);
                        }

                       // ------------------------------------
                        // 3. GENERATE RANDOM CHARACTERS & DATE
                        // ------------------------------------
                        // Only a-z (lowercase letters) as requested
                        $characters = 'abcdefghijklmnopqrstuvwxyz';
                        $randomChars = substr(str_shuffle($characters), 0, 5);
                        $dateNow = date('Ymd');

                        // ------------------------------------
                        // 4. FINAL FILE NAME (NEW FORMAT)
                        // ------------------------------------
                        // Result: id_abcde_20260425_104.png
                        $fileName = 'id_' . $randomChars . '_' . $dateNow . '_' . $requestId . '.png';
                        $filePath = $uploadDir . $fileName;

                        if (!file_put_contents($filePath, $imageData)) {
                            throw new Exception("Failed to save image.");
                        }

                        $photoPath = 'Images/id_pictures/' . $fileName;

                        // ------------------------------------
                        // 5. UPDATE PHOTO PATH
                        // ------------------------------------
                        $update_sql = "UPDATE request_barangay_id 
                                       SET photo_path = :photo 
                                       WHERE request_id = :request_id";

                        $update_stmt = $pdo->prepare($update_sql);
                        $update_stmt->execute([
                            ':photo' => $photoPath,
                            ':request_id' => $requestId
                        ]);
                    }
                }

                break;
                        
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Batch request submitted successfully.',
        'queue_no' => $master_queue
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>