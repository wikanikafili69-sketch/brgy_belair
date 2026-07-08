<?php
// API/Admin/get_admin_overview_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    // --- 1. CORE STATS ---
    $totalResidents  = $pdo->query("SELECT COUNT(*) FROM user_info")->fetchColumn();
    $activeBlotters  = $pdo->query("SELECT COUNT(*) FROM blotter_list WHERE LOWER(status) = 'active'")->fetchColumn();

    // Pending certs = sum of all pending across all 9 certificate tables
    $certTables = [
        'request_business_clearance'          => 'Business Clearance',
        'request_certificate_concrete_pouring'=> 'Concrete Pouring',
        'request_certificate_indigency'       => 'Certificate of Indigency',
        'request_certificate_legal_guardian'  => 'Legal Guardian',
        'request_certificate_low_income'      => 'Low Income',
        'request_certificate_residency'       => 'Certificate of Residency',
        'request_certificate_tent_permit'     => 'Tent Permit',
        'request_clearance_delivery_parking'  => 'Delivery / Parking Clearance',
        'request_first_time_job_seeker'       => 'First Time Job Seeker',
    ];

    $totalPending = 0;
    $certificateCounts = [];

    foreach ($certTables as $table => $label) {
        // Total count
        $total = $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();

        // ✅ SMART GROUPING: Grouping the new statuses to fit the Dashboard UI cards
        $pending   = $pdo->query("SELECT COUNT(*) FROM `{$table}` WHERE record_status IN ('for approval', 'pending')")->fetchColumn();
        $completed = $pdo->query("SELECT COUNT(*) FROM `{$table}` WHERE record_status IN ('completed', 'ready for pickup')")->fetchColumn();
        $cancelled = $pdo->query("SELECT COUNT(*) FROM `{$table}` WHERE record_status IN ('cancelled', 'rejected')")->fetchColumn();

        $totalPending += (int)$pending;

        $certificateCounts[] = [
            'certificate_type' => $label,
            'table_key'        => $table,
            'total_count'      => (int)$total,
            'pending'          => (int)$pending,
            'completed'        => (int)$completed,
            'cancelled'        => (int)$cancelled,
        ];
    }

    // --- 2. RECENT CERTIFICATES (WITH SMART BLOTTER CHECK) ---
    $unionParts = [];
    foreach ($certTables as $table => $label) {
        $nameCol = ($table === 'request_certificate_concrete_pouring' 
                 || $table === 'request_clearance_delivery_parking')
                 ? 'company_name' : 'full_name';

        // SMART MATCH: Splits full_name to grab the First Word and Last Word 
        // to check against the Blotter database, bypassing middle name issues!
        $unionParts[] = "
            SELECT 
                '{$label}'   AS certificate_type,
                {$nameCol}   AS resident_name,
                contact_number,
                queue_number,
                record_status AS status,
                requested_at  AS date_filed,
                (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END 
                 FROM blotter_list 
                 WHERE LOWER(status) = 'active'
                 AND {$nameCol} != '' 
                 AND {$nameCol} IS NOT NULL
                 AND LOWER(defendants) LIKE CONCAT('%', SUBSTRING_INDEX(LOWER(TRIM({$nameCol})), ' ', 1), '%')
                 AND LOWER(defendants) LIKE CONCAT('%', SUBSTRING_INDEX(LOWER(TRIM({$nameCol})), ' ', -1), '%')
                ) AS has_blotter
            FROM `{$table}`
        ";
    }

    $unionSQL   = implode(' UNION ALL ', $unionParts);
    $recentStmt = $pdo->query("
        SELECT * FROM ({$unionSQL}) AS all_certs
        ORDER BY date_filed DESC
        LIMIT 10
    ");
    $recentCertificates = $recentStmt->fetchAll(PDO::FETCH_ASSOC);


    // --- 3. LIVE QUEUE ---
    // ✅ FIXED: Now queries `record_status` and handles the new workflow states
    $queueStmt = $pdo->query("
        SELECT 
            queue_number,
            service_type,
            record_status AS status,
            priority,
            'Walk-in Resident' AS resident_name,
            0 AS has_blotter
        FROM service_queues
        WHERE DATE(created_at) = CURDATE()
          AND record_status IN ('for approval', 'pending', 'processing')
        ORDER BY created_at ASC
        LIMIT 4
    ");
    $liveQueue = $queueStmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 4. STAFF ON DUTY ---
    $staffOnDuty = [];

    // --- 5. RESIDENT DEMOGRAPHICS & BENEFICIARIES ---
    $residentQuery = "
        SELECT 
            COUNT(rbi_id) as total_residents,
            SUM(CASE WHEN gender = 'MALE' THEN 1 ELSE 0 END) as total_male,
            SUM(CASE WHEN gender = 'FEMALE' THEN 1 ELSE 0 END) as total_female,
            SUM(CASE WHEN registered_voter = 1 THEN 1 ELSE 0 END) as total_voters,
            SUM(CASE WHEN registered_voter = 0 OR registered_voter IS NULL THEN 1 ELSE 0 END) as total_non_voters,
            SUM(CASE WHEN is_pwd = 1 THEN 1 ELSE 0 END) as total_pwd,
            SUM(CASE WHEN is_solo_parent = 1 THEN 1 ELSE 0 END) as total_solo_parent,
            SUM(CASE WHEN is_senior_citizen = 1 THEN 1 ELSE 0 END) as total_senior,
            
            SUM(CASE WHEN residence_status LIKE '%Own%' THEN 1 ELSE 0 END) as total_home_owner,
            SUM(CASE WHEN is_dswd_beneficiary = 1 THEN 1 ELSE 0 END) as total_dswd,
            SUM(CASE WHEN is_aics_beneficiary = 1 THEN 1 ELSE 0 END) as total_aics,
            SUM(CASE WHEN is_akap_beneficiary = 1 THEN 1 ELSE 0 END) as total_akap,
            SUM(CASE WHEN is_tupad_beneficiary = 1 THEN 1 ELSE 0 END) as total_tupad,
            
            (SELECT COUNT(*) FROM barangay_officials) as total_officials
        FROM user_info 
        WHERE status = 'Active'
    ";
    $residentStats = $pdo->query($residentQuery)->fetch(PDO::FETCH_ASSOC);

    // --- FINAL JSON OUTPUT ---
    echo json_encode([
        'success' => true,
        'data' => [
            'stats' => [
                'total_residents' => (int)$totalResidents,
                'pending_certs'   => (int)$totalPending,
                'active_blotters' => (int)$activeBlotters,
            ],
            'resident_stats'      => $residentStats,
            'certificate_counts'  => $certificateCounts,
            'recent_certificates' => $recentCertificates,
            'live_queue'          => $liveQueue,
            'staff_on_duty'       => $staffOnDuty,
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>