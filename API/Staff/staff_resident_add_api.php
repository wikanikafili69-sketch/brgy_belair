<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

$data = $_POST;

try {

    // ── 1. VALIDATION ─────────────────────────────
    if (empty($data['first_name']) || empty($data['last_name'])) {
        echo json_encode(['success' => false, 'message' => 'Name is required.']);
        exit;
    }

    // ── 2. DUPLICATE CHECK ────────────────────────
    $check = $pdo->prepare("
        SELECT COUNT(*) FROM user_info
        WHERE first_name = :fn 
        AND last_name = :ln 
        AND middle_name = :mn 
        AND name_ext = :ext
        AND birth_date = :dob
    ");

    $check->execute([
        ':fn' => strtoupper($data['first_name']),
        ':ln' => strtoupper($data['last_name']),
        ':mn' => strtoupper($data['middle_name'] ?? ''),
        ':ext' => strtoupper($data['name_ext'] ?? ''),
        ':dob' => $data['birth_date']
    ]);

    if ($check->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Resident already exists.']);
        exit;
    }

    // ── 3. INSERT ─────────────────────────────────
    $sql = "INSERT INTO user_info (
        first_name, middle_name, last_name, name_ext,
        household_type, contact_no, email,
        gender, birth_date, birth_place,
        civil_status, religion,
        house_number, street, barangay,
        municipality_city, province,
        educational_attainment, registered_voter,
        precinct_no, employment_business, kind_of_business,
        citizenship, years_of_stay, residence_status,
        is_solo_parent, is_senior_citizen, is_pwd,
        is_dswd_beneficiary, is_aics_beneficiary,
        is_akap_beneficiary, is_tupad_beneficiary,
        dswd_other, dswd_date_received,
        is_livelihood_beneficiary, livelihood_specify,
        livelihood_date_finished,
        status, created_at
    ) VALUES (
        :fn, :mn, :ln, :ext,
        :household_type, :contact, :email,
        :gender, :dob, :pob,
        :civil, :religion,
        :house_no, :street, :brgy,
        :muni, :prov,
        :edu, :voter,
        :precinct, :emp, :biz,
        :citizen, :years, :res_stat,
        :solo, :senior, :pwd,
        :dswd, :aics,
        :akap, :tupad,
        :dswd_other, :dswd_date,
        :livelihood, :livelihood_specify,
        :livelihood_date,
        'Active', NOW()
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':fn' => strtoupper($data['first_name']),
        ':mn' => strtoupper($data['middle_name'] ?? ''),
        ':ln' => strtoupper($data['last_name']),
        ':ext' => strtoupper($data['name_ext'] ?? ''),
        ':household_type' => $data['household_type'],
        ':contact' => $data['contact_no'],
        ':email' => $data['email'] ?? '',
        ':gender' => strtoupper($data['gender']),
        ':dob' => $data['birth_date'] ?: null,
        ':pob' => $data['birth_place'],
        ':civil' => $data['civil_status'],
        ':religion' => $data['religion'],
        ':house_no' => $data['house_number'],
        ':street' => $data['street'],
        ':brgy' => $data['barangay'],
        ':muni' => $data['municipality_city'],
        ':prov' => $data['province'],
        ':edu' => $data['educational_attainment'],
        ':voter' => $data['registered_voter'],
        ':precinct' => $data['precinct_no'],
        ':emp' => $data['employment_business'],
        ':biz' => $data['kind_of_business'],
        ':citizen' => $data['citizenship'],
        ':years' => $data['years_of_stay'],
        ':res_stat' => $data['residence_status'],
        ':solo' => $data['is_solo_parent'],
        ':senior' => $data['is_senior_citizen'],
        ':pwd' => $data['is_pwd'],
        ':dswd' => $data['is_dswd_beneficiary'],
        ':aics' => $data['is_aics_beneficiary'],
        ':akap' => $data['is_akap_beneficiary'],
        ':tupad' => $data['is_tupad_beneficiary'],
        ':dswd_other' => $data['dswd_other'],
        ':dswd_date' => $data['dswd_date_received'] ?: null,
        ':livelihood' => $data['is_livelihood_beneficiary'],
        ':livelihood_specify' => $data['livelihood_specify'],
        ':livelihood_date' => $data['livelihood_date_finished'] ?: null
    ]);

    $rbi_id = $pdo->lastInsertId();

    // ── 4. IMAGE UPLOAD ───────────────────────────
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {

        $file = $_FILES['photo'];

        if ($file['size'] > 20 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'Image too large.']);
            exit;
        }

        $allowed = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!in_array($file['type'], $allowed)) {
            echo json_encode(['success' => false, 'message' => 'Invalid image type.']);
            exit;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = $rbi_id . "_" . date("Ymd") . "_rbi." . $ext;

        $uploadDir = "../../Images/rbi_pictures/";
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $target = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $target)) {
            $photo_path = "Images/rbi_pictures/" . $filename;

            $update = $pdo->prepare("UPDATE user_info SET photo_path = :photo WHERE rbi_id = :id");
            $update->execute([
                ':photo' => $photo_path,
                ':id' => $rbi_id
            ]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Resident added successfully!'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>