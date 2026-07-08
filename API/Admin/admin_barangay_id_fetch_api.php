<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");

require_once '../../Connections/db_connect.php';

// --- UPGRADED HELPER FUNCTION: Fetch Name, Contact Number, AND Check Blotter ---
function get_queue_extended_details($pdo, $queue_number) {
    $tables = [
        'request_business_clearance', 'request_certificate_concrete_pouring',
        'request_certificate_indigency', 'request_certificate_legal_guardian',
        'request_certificate_low_income', 'request_certificate_residency',
        'request_certificate_tent_permit', 'request_clearance_delivery_parking',
        'request_first_time_job_seeker', 'request_barangay_id', 'request_other_services'
    ];
    
    // Default return structure
    $details = [
        'has_blotter' => 0,
        'full_name' => '',
        'contact_number' => ''
    ];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE BINARY queue_number = :qno LIMIT 1");
            $stmt->execute([':qno' => $queue_number]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($res) {
                // Find the name column
                $name = !empty($res['full_name']) ? $res['full_name'] : (!empty($res['resident_name']) ? $res['resident_name'] : '');
                // Find the phone column
                $phone = !empty($res['contact_number']) ? $res['contact_number'] : (!empty($res['phone_number']) ? $res['phone_number'] : '');
                
                $details['full_name'] = $name;
                $details['contact_number'] = $phone;
                
                if ($name) {
                    // Extract First and Last Name for flexible blotter searching
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
                    $details['has_blotter'] = $b_stmt->fetch() ? 1 : 0;
                }
                break; // Found the table, no need to loop further
            }
        } catch (Exception $e) { continue; }
    }
    return $details;
}

try {
    // AUTO-UNLOCK SCRIPT (Updated for record_status)
    $unlock_sql = "UPDATE service_queues 
                   SET record_status = 'pending', processed_by = NULL 
                   WHERE record_status = 'processing' 
                   AND updated_at < (NOW() - INTERVAL 1 HOUR)";
    $pdo->query($unlock_sql);
} catch (Exception $e) { }

try {
    // Get filters and search from GET request
    $filter_date = isset($_GET['filter_date']) && $_GET['filter_date'] !== '' ? $_GET['filter_date'] : date('Y-m-d');
    $filter_status = isset($_GET['filter_status']) ? $_GET['filter_status'] : 'all'; 
    $filter_type = isset($_GET['filter_type']) ? $_GET['filter_type'] : 'all';
    $filter_source = isset($_GET['filter_source']) ? $_GET['filter_source'] : 'all'; 
    $search = isset($_GET['search']) ? trim($_GET['search']) : ''; 

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    if ($page < 1) $page = 1;
    
    $offset = ($page - 1) * $limit;

    // Build the WHERE clause dynamically
    $where_clause = "WHERE DATE(created_at) = :fdate AND LOWER(service_type) LIKE '%barangay id%'";
    $params = [':fdate' => $filter_date];

    // Filter by Status (Updated for record_status)
    if ($filter_status !== 'all') {
        $where_clause .= " AND record_status = :fstatus";
        $params[':fstatus'] = $filter_status;
    }

    // Filter by Source (WK = Walk-in, OR = Online)
    if ($filter_source === 'walkin') {
        $where_clause .= " AND queue_number LIKE 'WK%'";
    } elseif ($filter_source === 'online') {
        $where_clause .= " AND queue_number LIKE 'OR%'";
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

    // QUERY 2: Fetch Table Data (Updated to fetch record_status)
    $sql = "SELECT queue_number, service_type, created_at, record_status, processed_by, priority 
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
            $row['record_status'] = strtolower($row['record_status']); 
            $row['is_locked_by_other'] = ($row['processed_by'] !== null && $row['processed_by'] !== $current_user);
            
            // Fetch Name, Phone, and Blotter status
            $ext_details = get_queue_extended_details($pdo, $row['queue_number']);
            $row['has_blotter'] = $ext_details['has_blotter'];
            $row['full_name'] = $ext_details['full_name'];
            $row['contact_number'] = $ext_details['contact_number'];
            
            $response_data[] = $row;
        }
    }

    // --- GET REAL-TIME TOP SUMMARY CHIPS (Updated for new workflow) ---
    $status_summary = [
        'for approval' => 0, 
        'pending' => 0, 
        'processing' => 0, 
        'ready for pickup' => 0, 
        'completed' => 0, 
        'rejected' => 0
    ];
    
    try {
        // Base where clause for status and type counting shouldn't include their own filters
        $summary_where = "WHERE DATE(created_at) = :fdate AND LOWER(service_type) LIKE '%barangay id%'";
        
        // Include source filter in summary if selected
        if ($filter_source === 'walkin') {
            $summary_where .= " AND queue_number LIKE 'WK%'";
        } elseif ($filter_source === 'online') {
            $summary_where .= " AND queue_number LIKE 'OR%'";
        }

        $status_sql = "SELECT record_status, COUNT(*) as total FROM service_queues " . $summary_where . " GROUP BY record_status";
        $status_stmt = $pdo->prepare($status_sql);
        $status_stmt->execute([':fdate' => $filter_date]);
        $status_results = $status_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($status_results as $s_row) {
            $stat = strtolower($s_row['record_status']);
            if (isset($status_summary[$stat])) $status_summary[$stat] = (int)$s_row['total'];
        }
    } catch (Exception $e) { }

    // --- GET REAL-TIME TYPE COUNTS ---
    $type_summary = [];
    try {
        $type_sql = "SELECT service_type, COUNT(*) as total FROM service_queues " . $summary_where . " GROUP BY service_type";
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