<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Support both JSON payload and standard Form Data
$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

try {
    $sql = "INSERT INTO user_info (
        first_name, middle_name, last_name, name_ext, household_number, household_type, 
        contact_no, gender, birth_date, birth_place, civil_status, religion, 
        house_number, street, barangay, municipality_city, province, 
        educational_attainment, registered_voter, precinct_no, employment_business, 
        kind_of_business, citizenship, years_of_stay, residence_status, 
        is_solo_parent, is_senior_citizen, is_pwd, is_dswd_beneficiary, 
        is_aics_beneficiary, is_akap_beneficiary, is_tupad_beneficiary, dswd_other, 
        dswd_date_received, is_livelihood_beneficiary, livelihood_specify, livelihood_date_finished,
        status
    ) VALUES (
        :first_name, :middle_name, :last_name, :name_ext, :household_number, :household_type, 
        :contact_no, :gender, :birth_date, :birth_place, :civil_status, :religion, 
        :house_number, :street, :barangay, :municipality_city, :province, 
        :educational_attainment, :registered_voter, :precinct_no, :employment_business, 
        :kind_of_business, :citizenship, :years_of_stay, :residence_status, 
        :is_solo_parent, :is_senior_citizen, :is_pwd, :is_dswd_beneficiary, 
        :is_aics_beneficiary, :is_akap_beneficiary, :is_tupad_beneficiary, :dswd_other, 
        :dswd_date_received, :is_livelihood_beneficiary, :livelihood_specify, :livelihood_date_finished,
        'Active'
    )";

    $stmt = $pdo->prepare($sql);

    // Helpers to handle empty values
    $dateOrNull = function($val) { return empty($val) ? null : $val; };
    $boolToInt = function($val) { return ($val === 'true' || $val === '1' || $val === true) ? 1 : 0; };

    $stmt->execute([
        ':first_name'                => $data['first_name'] ?? null,
        ':middle_name'               => $data['middle_name'] ?? null,
        ':last_name'                 => $data['last_name'] ?? null,
        ':name_ext'                  => $data['name_ext'] ?? null,
        ':household_number'          => $data['household_number'] ?? null,
        ':household_type'            => $data['household_type'] ?? null,
        ':contact_no'                => $data['contact_no'] ?? null,
        ':gender'                    => $data['gender'] ?? null, // 'MALE', 'FEMALE', or 'OTHER'
        ':birth_date'                => $dateOrNull($data['birth_date'] ?? null),
        ':birth_place'               => $data['birth_place'] ?? null,
        ':civil_status'              => $data['civil_status'] ?? null,
        ':religion'                  => $data['religion'] ?? null,
        ':house_number'              => $data['house_number'] ?? null,
        ':street'                    => $data['street'] ?? null,
        ':barangay'                  => $data['barangay'] ?? null,
        ':municipality_city'         => $data['municipality_city'] ?? null,
        ':province'                  => $data['province'] ?? null,
        ':educational_attainment'    => $data['educational_attainment'] ?? null,
        ':registered_voter'          => $boolToInt($data['registered_voter'] ?? 0),
        ':precinct_no'               => $data['precinct_no'] ?? null,
        ':employment_business'       => $data['employment_business'] ?? null,
        ':kind_of_business'          => $data['kind_of_business'] ?? null,
        ':citizenship'               => $data['citizenship'] ?? null,
        ':years_of_stay'             => $data['years_of_stay'] ?? null,
        ':residence_status'          => $data['residence_status'] ?? null,
        ':is_solo_parent'            => $boolToInt($data['is_solo_parent'] ?? 0),
        ':is_senior_citizen'         => $boolToInt($data['is_senior_citizen'] ?? 0),
        ':is_pwd'                    => $boolToInt($data['is_pwd'] ?? 0),
        ':is_dswd_beneficiary'       => $boolToInt($data['is_dswd_beneficiary'] ?? 0),
        ':is_aics_beneficiary'       => $boolToInt($data['is_aics_beneficiary'] ?? 0),
        ':is_akap_beneficiary'       => $boolToInt($data['is_akap_beneficiary'] ?? 0),
        ':is_tupad_beneficiary'      => $boolToInt($data['is_tupad_beneficiary'] ?? 0),
        ':dswd_other'                => $data['dswd_other'] ?? null,
        ':dswd_date_received'        => $dateOrNull($data['dswd_date_received'] ?? null),
        ':is_livelihood_beneficiary' => $boolToInt($data['is_livelihood_beneficiary'] ?? 0),
        ':livelihood_specify'        => $data['livelihood_specify'] ?? null,
        ':livelihood_date_finished'  => $dateOrNull($data['livelihood_date_finished'] ?? null)
    ]);

    echo json_encode([
        'success' => true, 
        'message' => 'Resident added successfully', 
        'rbi_id'  => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>