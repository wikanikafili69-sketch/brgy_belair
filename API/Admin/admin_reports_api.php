<?php
// API/Admin/admin_reports_api.php
header('Content-Type: application/json');
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
require_once '../../Connections/db_connect.php';

$type     = $_GET['type']     ?? '';
$dateFrom = $_GET['dateFrom'] ?? '';
$dateTo   = $_GET['dateTo']   ?? '';
$category = $_GET['category'] ?? 'all';

if (!$type || !$dateFrom || !$dateTo) {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters.']);
    exit;
}

$start_date = $dateFrom . " 00:00:00";
$end_date   = $dateTo   . " 23:59:59";

try {
    $results = [];

    switch ($type) {

case 'Resident Population Report':
    $selectCols = "
        CONCAT(first_name, ' ', COALESCE(middle_name,''), ' ', last_name) AS full_name,
        gender,
        birth_date,
        street AS purok,
        employment_business,
        kind_of_business,
        educational_attainment,
        status,
        created_at
    ";

    $query  = "SELECT {$selectCols} FROM user_info WHERE created_at BETWEEN :start AND :end";
    $params = [':start' => $start_date, ':end' => $end_date];

    // Map dropdown values to LIKE patterns on employment_business
    $categoryMap = [
        'employed'      => '%employed%',
        'unemployed'    => '%unemployed%',
        'self_employed' => '%self%',
        'business'      => '%business%',
        'student'       => '%student%',
        'retired'       => '%retired%',
    ];

    if ($category !== 'all' && isset($categoryMap[$category])) {
        $query .= " AND employment_business LIKE :category";
        $params[':category'] = $categoryMap[$category];
    }

    $query .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    break;



    case 'Resident Demographics Report':
    $selectCols = "
        CONCAT(first_name, ' ', COALESCE(middle_name,''), ' ', last_name) AS full_name,
        gender,
        birth_date,
        civil_status,
        street             AS purok,
        residence_status,
        educational_attainment,
        registered_voter,
        is_senior_citizen,
        is_pwd,
        is_solo_parent,
        is_dswd_beneficiary,
        is_akap_beneficiary,
        is_tupad_beneficiary,
        is_livelihood_beneficiary,
        status,
        created_at
    ";

    $query  = "SELECT {$selectCols} FROM user_info WHERE created_at BETWEEN :start AND :end";
    $params = [':start' => $start_date, ':end' => $end_date];

    switch ($category) {
        case 'voters':
            $query .= " AND registered_voter = 1";
            break;
        case 'senior':
            $query .= " AND is_senior_citizen = 1";
            break;
        case 'pwd':
            $query .= " AND is_pwd = 1";
            break;
        case 'solo_parent':
            $query .= " AND is_solo_parent = 1";
            break;
        case 'male':
            $query .= " AND gender = 'MALE'";
            break;
        case 'female':
            $query .= " AND gender = 'FEMALE'";
            break;
        case 'youth':
            // Age 15–30 computed from birth_date
            $query .= " AND TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 15 AND 30";
            break;
        case 'dswd':
            $query .= " AND is_dswd_beneficiary = 1";
            break;
        case 'akap':
            $query .= " AND is_akap_beneficiary = 1";
            break;
        case 'tupad':
            $query .= " AND is_tupad_beneficiary = 1";
            break;
        case 'livelihood':
            $query .= " AND is_livelihood_beneficiary = 1";
            break;
        case 'active':
            $query .= " AND status = 'Active'";
            break;
        case 'archived':
            $query .= " AND status = 'Archived'";
            break;
        // 'all' — no extra filter
    }


case 'Certificate Issuance Report':
    $certTables = [
        'business_clearance'    => [
            'table'      => 'request_business_clearance',
            'label'      => 'Business Clearance',
            'name_col'   => 'full_name',
        ],
        'concrete_pouring'      => [
            'table'      => 'request_certificate_concrete_pouring',
            'label'      => 'Concrete Pouring Certificate',
            'name_col'   => 'company_name',        // ← company_name
        ],
        'indigency'             => [
            'table'      => 'request_certificate_indigency',
            'label'      => 'Certificate of Indigency',
            'name_col'   => 'full_name',
        ],
        'legal_guardian'        => [
            'table'      => 'request_certificate_legal_guardian',
            'label'      => 'Legal Guardian Certificate',
            'name_col'   => 'full_name',
        ],
        'low_income'            => [
            'table'      => 'request_certificate_low_income',
            'label'      => 'Low Income Certificate',
            'name_col'   => 'full_name',
        ],
        'residency'             => [
            'table'      => 'request_certificate_residency',
            'label'      => 'Certificate of Residency',
            'name_col'   => 'full_name',
        ],
        'tent_permit'           => [
            'table'      => 'request_certificate_tent_permit',
            'label'      => 'Tent Permit Certificate',
            'name_col'   => 'full_name',
        ],
        'delivery_parking'      => [
            'table'      => 'request_clearance_delivery_parking',
            'label'      => 'Delivery / Parking Clearance',
            'name_col'   => 'company_name',        // ← company_name
        ],
        'first_time_job_seeker' => [
            'table'      => 'request_first_time_job_seeker',
            'label'      => 'First Time Job Seeker',
            'name_col'   => 'full_name',
        ],
    ];

    $tablesToQuery = ($category !== 'all' && isset($certTables[$category]))
        ? [$category => $certTables[$category]]
        : $certTables;

    $results = [];

    foreach ($tablesToQuery as $key => $info) {
        $tableCheck = $pdo->query("SHOW TABLES LIKE '{$info['table']}'")->rowCount();
        if ($tableCheck === 0) continue;

        // Use the correct name column per table
        $nameCol = $info['name_col'];

        $stmt = $pdo->prepare("
            SELECT 
                request_id,
                '{$info['label']}'  AS certificate_type,
                {$nameCol}          AS requester_name,
                contact_number,
                queue_number,
                record_status,
                requested_at
            FROM {$info['table']}
            WHERE requested_at BETWEEN :start AND :end
            ORDER BY requested_at DESC
        ");
        $stmt->execute([':start' => $start_date, ':end' => $end_date]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $results = array_merge($results, $rows);
    }

    // Sort merged results by date descending
    usort($results, fn($a, $b) => strtotime($b['requested_at']) - strtotime($a['requested_at']));
    break;


    case 'Priority Report':
    $selectCols = "
        CONCAT(first_name, ' ', COALESCE(middle_name,''), ' ', last_name) AS full_name,
        gender,
        birth_date,
        TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age,
        street          AS purok,
        contact_no,
        civil_status,
        is_senior_citizen,
        is_pwd,
        residence_status,
        status,
        created_at
    ";

    $query  = "SELECT {$selectCols} FROM user_info WHERE created_at BETWEEN :start AND :end";
    $params = [':start' => $start_date, ':end' => $end_date];

    switch ($category) {
        case 'senior':
            $query .= " AND is_senior_citizen = 1";
            break;
        case 'pwd':
            $query .= " AND is_pwd = 1";
            break;
        case 'senior_pwd':
            // Residents who are BOTH senior AND pwd
            $query .= " AND is_senior_citizen = 1 AND is_pwd = 1";
            break;
        case 'all':
        default:
            // All priority residents — either senior or pwd
            $query .= " AND (is_senior_citizen = 1 OR is_pwd = 1)";
            break;
    }

    $query .= " ORDER BY is_senior_citizen DESC, is_pwd DESC, created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    break;

    $query .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    break;

        case 'Blotter Incident Report':
            $query  = "SELECT case_number, blotter_type, number_of_case,
                              complainants, defendants, hearing_date,
                              about, moderator, issue_problem
                       FROM blotter_list
                       WHERE hearing_date BETWEEN :start AND :end";
            $params = [':start' => $dateFrom, ':end' => $dateTo];

            if ($category !== 'all') {
                $query .= " AND blotter_type = :category";
                $params[':category'] = $category;
            }

            $query .= " ORDER BY hearing_date DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'Queue Activity Report':
        case 'Monthly Certificate Summary':
            $query  = "SELECT queue_number, service_type, priority, status, created_at, updated_at
                       FROM service_queues
                       WHERE created_at BETWEEN :start AND :end";
            $params = [':start' => $start_date, ':end' => $end_date];

            if ($category !== 'all') {
                $query .= " AND service_type = :category";
                $params[':category'] = $category;
            }

            $query .= " ORDER BY created_at DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Report type not supported yet.']);
            exit;
    }


    echo json_encode(['status' => 'success', 'data' => $results]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);


    
}



?>