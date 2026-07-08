<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

// --- HELPER FUNCTION: Check if the requester has an active blotter ---
function check_blotter_for_queue($pdo, $queue_number) {
    $tables = [
        'request_business_clearance', 'request_certificate_concrete_pouring',
        'request_certificate_indigency', 'request_certificate_legal_guardian',
        'request_certificate_low_income', 'request_certificate_residency',
        'request_certificate_tent_permit', 'request_clearance_delivery_parking',
        'request_first_time_job_seeker', 'request_barangay_id', 'request_other_services'
    ];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE BINARY queue_number = :qno LIMIT 1");
            $stmt->execute([':qno' => $queue_number]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($res) {
                // Find the name column
                $name = !empty($res['full_name']) ? $res['full_name'] : (!empty($res['resident_name']) ? $res['resident_name'] : '');
                
                if ($name) {
                    // Extract First and Last Name for flexible searching
                    $parts = explode(' ', trim($name));
                    $first = $parts[0];
                    $last = count($parts) > 1 ? end($parts) : '';
                    
                    $b_sql = "SELECT 1 FROM blotter_list WHERE blotter_type IN ('BLOTTER', 'COMPLAIN') AND LOWER(status) = 'active' AND defendants LIKE ?";
                    $b_params = ["%$first%"];
                    
                    if ($last) {
                        $b_sql .= " AND defendants LIKE ?";
                        $b_params[] = "%$last%";
                    }
                    
                    $b_stmt = $pdo->prepare($b_sql);
                    $b_stmt->execute($b_params);
                    return $b_stmt->fetch() ? 1 : 0;
                }
                break; // Found the table, no need to loop further
            }
        } catch (Exception $e) { continue; }
    }
    return 0;
}

try {
    // AUTO-UNLOCK SCRIPT (Updated to record_status)
    $unlock_sql = "UPDATE service_queues 
                   SET record_status = 'pending', processed_by = NULL 
                   WHERE record_status = 'processing' 
                   AND updated_at < (NOW() - INTERVAL 1 HOUR)";
    $pdo->query($unlock_sql);
} catch (Exception $e) { }

try {
    // Get filters and search from GET request
    $filter_date = isset($_GET['filter_date']) && $_GET['filter_date'] !== '' ? $_GET['filter_date'] : date('Y-m-d');
    $filter_source = isset($_GET['filter_source']) ? $_GET['filter_source'] : 'all'; // NEW SOURCE FILTER
    $filter_status = isset($_GET['filter_status']) ? $_GET['filter_status'] : 'pending';
    $filter_type = isset($_GET['filter_type']) ? $_GET['filter_type'] : 'all';
    $search = isset($_GET['search']) ? trim($_GET['search']) : ''; 

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    if ($page < 1) $page = 1;
    
    $offset = ($page - 1) * $limit;

    // --- BUILD THE SOURCE CLAUSE ---
    $source_clause = "";
    if ($filter_source === 'W') {
        $source_clause = " AND queue_number LIKE 'W%'";
    } elseif ($filter_source === 'O') {
        $source_clause = " AND queue_number LIKE 'O%'";
    }

    // Build the WHERE clause dynamically
    $where_clause = "WHERE DATE(created_at) = :fdate AND LOWER(service_type) LIKE '%barangay id%'" . $source_clause;
    $params = [':fdate' => $filter_date];

    // Filter by Status
    if ($filter_status !== 'all') {
        $where_clause .= " AND record_status = :fstatus";
        $params[':fstatus'] = $filter_status;
    }

    // Filter by Type
    if ($filter_type !== 'all') {
        $keyword = '';
        $ftype_lower = strtolower($filter_type);
        if (strpos($ftype_lower, 'business') !== false) $keyword = 'business';
        elseif (strpos($ftype_lower, 'guardian') !== false) $keyword = 'guardian';
        elseif (strpos($ftype_lower, 'indigency') !== false) $keyword = 'indigency';
        elseif (strpos($ftype_lower, 'low income') !== false) $keyword = 'low income';
        elseif (strpos($ftype_lower, 'residency') !== false) $keyword = 'residency';
        elseif (strpos($ftype_lower, 'tent') !== false) $keyword = 'tent';
        elseif (strpos($ftype_lower, 'delivery') !== false || strpos($ftype_lower, 'parking') !== false) $keyword = 'parking';
        elseif (strpos($ftype_lower, 'job seeker') !== false) $keyword = 'job seeker';
        elseif (strpos($ftype_lower, 'pouring') !== false) $keyword = 'pouring';
        elseif (strpos($ftype_lower, 'barangay id') !== false) $keyword = 'barangay id';
        elseif (strpos($ftype_lower, 'other') !== false) $keyword = 'other';
        else $keyword = $filter_type;

        $where_clause .= " AND service_type LIKE :ftype";
        $params[':ftype'] = '%' . $keyword . '%';
    }

    // Filter by Search Box (Searches Queue Number)
    if ($search !== '') {
        $where_clause .= " AND queue_number LIKE :search";
        $params[':search'] = '%' . $search . '%';
    }

    // QUERY 1: Count Total Rows
    $count_sql = "SELECT COUNT(*) as total FROM service_queues " . $where_clause;
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($params);
    $total_rows = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $total_pages = ceil($total_rows / $limit);

    // QUERY 2: Fetch Table Data
    $sql = "SELECT queue_number, service_type, created_at, record_status AS status, processed_by, priority 
            FROM service_queues " . $where_clause . " 
            ORDER BY priority DESC, created_at ASC 
            LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => &$val) {
        $stmt->bindParam($key, $val);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $response_data = [];
    $current_user = isset($_SESSION['staff_name']) ? $_SESSION['staff_name'] : 'Unknown Staff';

    if ($results) {
        foreach ($results as $row) {
            $row['formatted_date'] = date('M d, Y h:i A', strtotime($row['created_at']));
            $row['status'] = strtolower($row['status']); 
            $row['is_locked_by_other'] = ($row['processed_by'] !== null && $row['processed_by'] !== $current_user);
            $row['has_blotter'] = check_blotter_for_queue($pdo, $row['queue_number']);
            $response_data[] = $row;
        }
    }

    // --- GET REAL-TIME TOP SUMMARY CHIPS (Filtered by Source) ---
    $status_summary = ['pending' => 0, 'for approval' => 0, 'processing' => 0, 'completed' => 0, 'rejected' => 0];
    try {
        $status_sql = "SELECT record_status, COUNT(*) as total FROM service_queues WHERE DATE(created_at) = :fdate AND LOWER(service_type) LIKE '%barangay id%'" . $source_clause . " GROUP BY record_status";
        $status_stmt = $pdo->prepare($status_sql);
        $status_stmt->execute([':fdate' => $filter_date]);
        $status_results = $status_stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($status_results as $s_row) {
            $stat = strtolower($s_row['record_status']);
            if (isset($status_summary[$stat])) $status_summary[$stat] = (int)$s_row['total'];
        }
    } catch (Exception $e) { }

    // --- GET REAL-TIME TYPE COUNTS (Filtered by Source) ---
    $type_summary = [];
    try {
        $type_sql = "SELECT service_type, COUNT(*) as total FROM service_queues WHERE DATE(created_at) = :fdate AND LOWER(service_type) LIKE '%barangay id%'" . $source_clause . " GROUP BY service_type";
        $type_stmt = $pdo->prepare($type_sql);
        $type_stmt->execute([':fdate' => $filter_date]);
        $type_summary = $type_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) { }

    echo json_encode([
        'success' => true,
        'current_user' => $current_user,
        'data' => $response_data,
        'summary' => $status_summary, 
        'type_summary' => $type_summary, 
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $total_pages,
            'total_records' => $total_rows,
            'limit' => $limit
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>