<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

// Get JSON body payload
$data = $_POST;

if (empty($data['rbi_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing Resident ID.']);
    exit;
}

try {
    $sql = "UPDATE user_info SET 
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            name_ext = :name_ext,
            household_type = :household_type,
            contact_no = :contact_no,
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
    ':first_name' => $data['first_name'],
    ':middle_name' => $data['middle_name'],
    ':last_name' => $data['last_name'],
    ':name_ext' => $data['name_ext'],
    ':household_type' => $data['household_type'],
    ':contact_no' => $data['contact_no'],
    ':gender' => strtoupper($data['gender']),
    ':birth_date' => $data['birth_date'] ?: null,
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
    ':rbi_id' => $data['rbi_id']
]);

// ✅ 👉 PUT IMAGE CODE HERE
// HANDLE IMAGE UPLOAD
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {

    $file = $_FILES['photo'];

    if ($file['size'] > 20 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Image too large (max 20MB).']);
        exit;
    }

    $allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!in_array($file['type'], $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid image type.']);
        exit;
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $data['rbi_id'] . "_" . date("Ymd") . "_rbi." . $ext;

    $uploadDir = "../../Images/rbi_pictures/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $target = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        $photo_path = "Images/rbi_pictures/" . $filename;

        $update = $pdo->prepare("UPDATE user_info SET photo_path = :photo WHERE rbi_id = :id");
        $update->execute([
            ':photo' => $photo_path,
            ':id' => $data['rbi_id']
        ]);
    }
}

    echo json_encode(['success' => true, 'message' => 'Resident profile updated successfully!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>