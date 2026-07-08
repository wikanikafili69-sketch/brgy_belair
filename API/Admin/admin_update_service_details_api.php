<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");

// Uncomment this in production!
// if (!isset($_SESSION['brgy_session'])) { 
//     echo json_encode(['success' => false, 'message' => 'Unauthorized']); 
//     exit; 
// }

require_once '../../Connections/db_connect.php';

// 1. Get the JSON payload from Javascript
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['record_id']) || empty($data['fields']) || empty($data['service_type'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required data.']);
    exit;
}

$record_id = $data['record_id'];
$fields = $data['fields'];
$service_type = strtolower($data['service_type']); 

// 2. Map the service type to the exact Database Table
$tables_map = [
    'business clearance'                   => 'request_business_clearance',
    'concrete pouring certification'       => 'request_certificate_concrete_pouring',
    'concrete pouring clearance'           => 'request_certificate_concrete_pouring',
    'concrete pouring'                     => 'request_certificate_concrete_pouring',
    'indigency'                            => 'request_certificate_indigency',
    'certificate of indigency'             => 'request_certificate_indigency',
    'legal guardian'                       => 'request_certificate_legal_guardian',
    'legal guardian certificate'           => 'request_certificate_legal_guardian',
    'low income'                           => 'request_certificate_low_income',
    'certificate of low income'            => 'request_certificate_low_income',
    'residency'                            => 'request_certificate_residency',
    'certificate of residency'             => 'request_certificate_residency',
    'tent permit'                          => 'request_certificate_tent_permit',
    'certificate of tent permit'           => 'request_certificate_tent_permit',
    'delivery parking'                     => 'request_clearance_delivery_parking',
    'delivery & loading/unloading'         => 'request_clearance_delivery_parking',
    'first time job seeker'                => 'request_first_time_job_seeker',
    'barangay id'                          => 'request_barangay_id',
    'other services'                       => 'request_other_services'
];

if (!array_key_exists($service_type, $tables_map)) {
    echo json_encode(['success' => false, 'message' => 'Invalid service type detected: ' . $service_type]);
    exit;
}

$target_table = $tables_map[$service_type];

// 3. SECURITY: Whitelist Allowed Columns
$allowed_columns = [
    'business_name', 'full_name', 'resident_name', 'business_address', 'address', 'home_address', 
    'legal_guardian_name', 'work_details', 'income_amount', 
    'kind_of_business', 'business_category', 'clearance_type', 'purpose', 'certificate_type',
    'contact_number', 'age', 'civil_status', 'years_of_residency', 'residency_duration',
    'birthdate', 'email', 'emergency_contact_name', 'emergency_contact_number',
    'company_name', 'location', 'date_from_to', 'time_from', 'time_to', 'date_used',
    'vehicle_plate_number', 'other_purpose_details'
];

// ==========================================
// 🚨 PHOTO PROCESSING & OVERWRITE LOGIC
// ==========================================

if (isset($fields['new_photo_base64']) && !empty($fields['new_photo_base64'])) {
    $base64_string = $fields['new_photo_base64'];
    $parts = explode(',', $base64_string);
    
    if (count($parts) == 2) {
        $image_data = base64_decode($parts[1]);
        $uploadDir = '../../Images/id_pictures/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // 1. CHECK DATABASE FOR EXISTING PHOTO
        $checkStmt = $pdo->prepare("SELECT photo_path FROM {$target_table} WHERE request_id = ?");
        $checkStmt->execute([$record_id]);
        $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        // 2. DECIDE FILENAME
        if ($existingRecord && !empty($existingRecord['photo_path'])) {
            // Overwrite the existing file by keeping its original name
            // basename() extracts just the filename (e.g., id_abcde_20260425_123.jpg)
            $fileName = basename($existingRecord['photo_path']); 
        } else {
            // First time uploading a photo: Generate a brand new random name
            $randomChars = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz"), 0, 5);
            $dateNow = date('Ymd');
            $fileName = 'id_' . $randomChars . '_' . $dateNow . '_' . $record_id . '.jpg';
        }
        
        $filePath = $uploadDir . $fileName;
        
        // 3. Save the new image data over the old file (or create new)
        file_put_contents($filePath, $image_data);
        
        // Update database with the path (whether it's the old path or the new one)
        $fields['photo_path'] = "Images/id_pictures/" . $fileName;
    }
}

// Remove base64 string from array so it doesn't try to save the raw string to the database
if (isset($fields['new_photo_base64'])) unset($fields['new_photo_base64']);
if (!in_array('photo_path', $allowed_columns)) $allowed_columns[] = 'photo_path';
// ==========================================

// 4. Build the Dynamic Query safely
$set_clauses = [];
$params = [];

foreach ($fields as $column => $value) {
    if (in_array($column, $allowed_columns)) {
        $set_clauses[] = "`$column` = ?";
        
        // 🚨 SMART NULL CONVERSION: 
        // If the Javascript sends an empty string, convert it to a true SQL NULL
        $params[] = ($value === '') ? null : $value; 
    }
}

if (empty($set_clauses)) {
    echo json_encode(['success' => false, 'message' => 'No valid fields provided to update.']);
    exit;
}

// Add the ID to the end of our parameters for the WHERE clause
$params[] = $record_id; 
$sql_set_string = implode(", ", $set_clauses);

// 5. Execute the Update
try {
    $stmt = $pdo->prepare("UPDATE {$target_table} SET {$sql_set_string} WHERE request_id = ?");
    $stmt->execute($params);

    echo json_encode([
        'success' => true, 
        'message' => 'Database updated successfully.',
        'new_photo_path' => isset($fields['photo_path']) ? $fields['photo_path'] : null
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>