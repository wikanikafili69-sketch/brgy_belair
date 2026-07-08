<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header('Content-Type: application/json');
require_once '../../Connections/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch all active residents
    try {
        $stmt = $pdo->query("SELECT * FROM user_info WHERE status = 'Active' ORDER BY created_at DESC");
        $residents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $residents]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    // Add a new resident
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Extract variables from the JSON payload
    $first_name = $data['first_name'] ?? '';
    $last_name = $data['last_name'] ?? '';
    $middle_name = $data['middle_name'] ?? '';
    $birth_date = $data['birth_date'] ?? null;
    $gender = strtoupper($data['gender'] ?? ''); // Enum: MALE, FEMALE, OTHER
    $civil_status = $data['civil_status'] ?? '';
    $street = $data['address'] ?? ''; 
    $contact_no = $data['contact_no'] ?? '';
    $registered_voter = (isset($data['voter_status']) && $data['voter_status'] === 'Registered Voter') ? 1 : 0;
    
    // Generate a temporary rbi_id (Note: It's highly recommended to make rbi_id AUTO_INCREMENT in your DB)
    $rbi_id = time(); 

    try {
        $sql = "INSERT INTO user_info 
                (rbi_id, first_name, last_name, middle_name, birth_date, gender, civil_status, street, contact_no, registered_voter, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$rbi_id, $first_name, $last_name, $middle_name, $birth_date, $gender, $civil_status, $street, $contact_no, $registered_voter]);
        
        echo json_encode(['status' => 'success', 'message' => 'Resident added successfully']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>