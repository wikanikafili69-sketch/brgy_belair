<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

// Get JSON body payload
$data = $_POST;

if (empty($data['rbi_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing Resident ID.']);
    exit;
}

try {

    // ── 1. CLEAN & NORMALIZE ──────────────────────────
    $rbi_id     = $data['rbi_id'];

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

    // Contact format
    if (!empty($contact_no) && !preg_match('/^09\d{9}$/', $contact_no)) {
        echo json_encode(['success' => false, 'message' => 'Invalid contact number (use 09XXXXXXXXX).']);
        exit;
    }

    // Duplicate EMAIL (exclude self)
    if (!empty($email)) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_info WHERE email = :email AND rbi_id != :id");
        $stmt->execute([
            ':email' => $email,
            ':id'    => $rbi_id
        ]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already used by another resident.']);
            exit;
        }
    }

    // Duplicate CONTACT (exclude self)
    if (!empty($contact_no)) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_info WHERE contact_no = :contact AND rbi_id != :id");
        $stmt->execute([
            ':contact' => $contact_no,
            ':id'      => $rbi_id
        ]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'message' => 'Contact number already used by another resident.']);
            exit;
        }
    }

    // Duplicate NAME + BIRTHDATE (exclude self)
    $checkSql = "SELECT COUNT(*) FROM user_info 
                 WHERE first_name = :fn 
                 AND last_name = :ln 
                 AND middle_name = :mn 
                 AND name_ext = :ext 
                 AND birth_date = :dob
                 AND rbi_id != :id";

    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([
        ':fn'  => $first_name,
        ':ln'  => $last_name,
        ':mn'  => $middle_name,
        ':ext' => $name_ext,
        ':dob' => $birth_date,
        ':id'  => $rbi_id
    ]);

    if ($checkStmt->fetchColumn() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Duplicate resident (same name and birth date).'
        ]);
        exit;
    }

    // ── 3. UPDATE ──────────────────────────
    $sql = "UPDATE user_info SET 
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            name_ext = :name_ext,
            household_type = :household_type,
            contact_no = :contact_no,
            email = :email,
            gender = :gender,
            birth_date = :birth_date,
            birth_place = :birth_place,
            civil_status = :civil_status,
            religion = :religion,
            house_number = :house_number,
            street = :street,
            barangay = :barangay,
            municipality_city = :municipality_city,
            province = :province,
            educational_attainment = :educational_attainment,
            registered_voter = :registered_voter,
            precinct_no = :precinct_no,
            employment_business = :employment_business,
            kind_of_business = :kind_of_business,
            citizenship = :citizenship,
            years_of_stay = :years_of_stay,
            residence_status = :residence_status,
            is_solo_parent = :is_solo_parent,
            is_senior_citizen = :is_senior_citizen,
            is_pwd = :is_pwd,
            is_dswd_beneficiary = :is_dswd_beneficiary,
            is_aics_beneficiary = :is_aics_beneficiary,
            is_akap_beneficiary = :is_akap_beneficiary,
            is_tupad_beneficiary = :is_tupad_beneficiary,
            dswd_other = :dswd_other,
            dswd_date_received = :dswd_date_received,
            is_livelihood_beneficiary = :is_livelihood_beneficiary,
            livelihood_specify = :livelihood_specify,
            livelihood_date_finished = :livelihood_date_finished
            WHERE rbi_id = :rbi_id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':first_name' => $first_name,
        ':middle_name' => $middle_name,
        ':last_name' => $last_name,
        ':name_ext' => $name_ext,
        ':household_type' => $data['household_type'],
        ':contact_no' => $contact_no,
        ':email' => $email,
        ':gender' => strtoupper($data['gender']),
        ':birth_date' => $birth_date ?: null,
        ':birth_place' => $data['birth_place'],
        ':civil_status' => $data['civil_status'],
        ':religion' => $data['religion'],
        ':house_number' => $data['house_number'],
        ':street' => $data['street'],
        ':barangay' => $data['barangay'],
        ':municipality_city' => $data['municipality_city'],
        ':province' => $data['province'],
        ':educational_attainment' => $data['educational_attainment'],
        ':registered_voter' => $data['registered_voter'],
        ':precinct_no' => $data['precinct_no'],
        ':employment_business' => $data['employment_business'],
        ':kind_of_business' => $data['kind_of_business'],
        ':citizenship' => $data['citizenship'],
        ':years_of_stay' => $data['years_of_stay'],
        ':residence_status' => $data['residence_status'],
        ':is_solo_parent' => $data['is_solo_parent'],
        ':is_senior_citizen' => $data['is_senior_citizen'],
        ':is_pwd' => $data['is_pwd'],
        ':is_dswd_beneficiary' => $data['is_dswd_beneficiary'],
        ':is_aics_beneficiary' => $data['is_aics_beneficiary'],
        ':is_akap_beneficiary' => $data['is_akap_beneficiary'],
        ':is_tupad_beneficiary' => $data['is_tupad_beneficiary'],
        ':dswd_other' => $data['dswd_other'],
        ':dswd_date_received' => $data['dswd_date_received'] ?: null,
        ':is_livelihood_beneficiary' => $data['is_livelihood_beneficiary'],
        ':livelihood_specify' => $data['livelihood_specify'],
        ':livelihood_date_finished' => $data['livelihood_date_finished'] ?: null,
        ':rbi_id' => $rbi_id
    ]);

    // ── 4. IMAGE UPLOAD (ADD THIS BLOCK) ──────────────────────────
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {

    $file = $_FILES['photo'];

    // Validate size (20MB)
    if ($file['size'] > 20 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Image too large (max 20MB).']);
        exit;
    }

    // Validate type
    $allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!in_array($file['type'], $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid image type.']);
        exit;
    }

    // Extension
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);

    // Filename
    $filename = $rbi_id . "_" . date("Ymd") . "_rbi." . $ext;

    $uploadDir = "../../Images/rbi_pictures/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $target = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {

        $photo_path = "Images/rbi_pictures/" . $filename;

        // Save to DB
        $updatePhoto = $pdo->prepare("UPDATE user_info SET photo_path = :photo WHERE rbi_id = :id");
        $updatePhoto->execute([
            ':photo' => $photo_path,
            ':id'    => $rbi_id
        ]);
    }
}

    echo json_encode([
        'success' => true,
        'message' => 'Resident updated successfully!'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>