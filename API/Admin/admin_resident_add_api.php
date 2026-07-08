<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

$data = $_POST;

if (empty($data)) {
    echo json_encode([
        'success' => false,
        'message' => 'No data received.'
    ]);
    exit;
}

try {

    // ── 1. CLEAN & NORMALIZE ──────────────────────────
    $first_name  = strtoupper(trim($data['first_name']));
    $middle_name = strtoupper(trim($data['middle_name']));
    $last_name   = strtoupper(trim($data['last_name']));
    $name_ext    = strtoupper(trim($data['name_ext']));
    $birth_date  = $data['birth_date'];

    $contact_no  = trim($data['contact_no']);
    $email       = trim($data['email']);

    // ── 2. VALIDATIONS ──────────────────────────

    // Email format
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit;
    }

    // Contact format (PH: 09XXXXXXXXX)
    if (!empty($contact_no) && !preg_match('/^09\d{9}$/', $contact_no)) {
        echo json_encode(['success' => false, 'message' => 'Invalid contact number (use 09XXXXXXXXX).']);
        exit;
    }

    // Duplicate EMAIL
    if (!empty($email)) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_info WHERE email = :email");
        $stmt->execute([':email' => $email]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already registered.']);
            exit;
        }
    }

    // Duplicate CONTACT
    if (!empty($contact_no)) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_info WHERE contact_no = :contact");
        $stmt->execute([':contact' => $contact_no]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Contact number already registered.']);
            exit;
        }
    }

    // ── 3. DUPLICATE NAME + BIRTHDATE ──────────────────────────
    $checkSql = "SELECT COUNT(*) FROM user_info 
                 WHERE first_name = :fn AND last_name = :ln 
                 AND middle_name = :mn AND name_ext = :ext 
                 AND birth_date = :dob";

    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([
        ':fn'  => $first_name,
        ':ln'  => $last_name,
        ':mn'  => $middle_name,
        ':ext' => $name_ext,
        ':dob' => $birth_date
    ]);

    if ($checkStmt->fetchColumn() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Resident already registered (same name and birth date).'
        ]);
        exit;
    }

    // ── 4. INSERT ──────────────────────────
    $sql = "INSERT INTO user_info (
                household_number, first_name, middle_name, last_name, name_ext, 
                household_type, contact_no, email, gender, birth_date, birth_place, 
                civil_status, religion, house_number, street, barangay, 
                municipality_city, province, educational_attainment, registered_voter, 
                precinct_no, employment_business, kind_of_business, citizenship, 
                years_of_stay, residence_status, is_solo_parent, is_senior_citizen, 
                is_pwd, status, created_at
            ) VALUES (
                :h_no, :fn, :mn, :ln, :ext, :h_type, :contact, :email, :gender, :dob, :pob, 
                :civil, :rel, :house_no, :street, :brgy, :muni, :prov, :edu, :voter, 
                :precinct, :emp, :biz, :citizen, :years, :res_stat, :solo, :senior, 
                :pwd, 'Active', NOW()
            )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':h_no'     => $data['household_number'],
        ':fn'       => $first_name,
        ':mn'       => $middle_name,
        ':ln'       => $last_name,
        ':ext'      => $name_ext,
        ':h_type'   => $data['household_type'],
        ':contact'  => $contact_no,
        ':email'    => $email,
        ':gender'   => strtoupper($data['gender']),
        ':dob'      => $birth_date ?: null,
        ':pob'      => $data['birth_place'],
        ':civil'    => $data['civil_status'],
        ':rel'      => $data['religion'],
        ':house_no' => $data['house_number'],
        ':street'   => $data['street'],
        ':brgy'     => $data['barangay'],
        ':muni'     => $data['municipality_city'],
        ':prov'     => $data['province'],
        ':edu'      => $data['educational_attainment'],
        ':voter'    => $data['registered_voter'],
        ':precinct' => $data['precinct_no'],
        ':emp'      => $data['employment_business'],
        ':biz'      => $data['kind_of_business'],
        ':citizen'  => $data['citizenship'],
        ':years'    => $data['years_of_stay'],
        ':res_stat' => $data['residence_status'],
        ':solo'     => $data['is_solo_parent'],
        ':senior'   => $data['is_senior_citizen'],
        ':pwd'      => $data['is_pwd']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Resident registered successfully!'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>