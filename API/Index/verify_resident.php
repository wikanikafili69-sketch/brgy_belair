<?php
// API/Index/verify_resident.php
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit;
}

try {
    $lastname   = trim($data['lastname'] ?? '');
    $firstname  = trim($data['firstname'] ?? '');
    $middlename = trim($data['middlename'] ?? '');
    $name_ext   = trim($data['name_ext'] ?? '');
    $birthdate  = trim($data['birthdate'] ?? '');

    if (empty($lastname) || empty($firstname) || empty($birthdate)) {
        echo json_encode(['success' => false, 'message' => 'Last Name, First Name, and Birth Date are required.']);
        exit;
    }

    // Base query: Last Name, First Name, and Birth Date are mandatory for the search
    $sql = "SELECT * FROM user_info 
            WHERE last_name = :last 
            AND first_name = :first 
            AND birth_date = :bdate";
            
    $params = [
        ':last' => $lastname, 
        ':first' => $firstname,
        ':bdate' => $birthdate
    ];

    // Add middle name to search if provided
    if (!empty($middlename)) {
        $sql .= " AND middle_name = :middle";
        $params[':middle'] = $middlename;
    }

    // Add extension to search if provided
    if (!empty($name_ext)) {
        $sql .= " AND name_ext = :ext";
        $params[':ext'] = $name_ext;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ── THE TRICKY LOGIC ─────────────────────────────────────
    if (count($users) === 0) {
        echo json_encode(['success' => false, 'message' => 'Record not found. Please check your spelling and birth date, or register for RBI.']);
    } 
    elseif (count($users) === 1) {
        // EXACTLY ONE MATCH - SUCCESS!
        $user = $users[0];
        
        $fname = strtoupper($user['first_name']);
        $mname = !empty($user['middle_name']) ? strtoupper($user['middle_name']) . ' ' : '';
        $lname = strtoupper($user['last_name']);
        $ext   = !empty($user['name_ext']) ? ' ' . strtoupper($user['name_ext']) : '';

        // Result: "JUAN SANTOS DELA CRUZ JR"
        $full_display_name = $fname . ' ' . $mname . $lname . $ext;

        echo json_encode([
            'success'   => true,
            'full_name' => $full_display_name
        ]);
    } 
    else {
        // MULTIPLE MATCHES FOUND! (Same Name & Birth Date)
        if (empty($name_ext)) {
            // Force them to enter their extension
            echo json_encode(['success' => false, 'message' => 'Multiple identical records found. Please specify your Name Extension (e.g., JR, SR, III) to verify.']);
        } else {
            // Highly unlikely: Duplicate entries in DB with the exact same extension
            echo json_encode(['success' => false, 'message' => 'System error: Duplicate exact records found. Please contact the barangay administrator.']);
        }
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>