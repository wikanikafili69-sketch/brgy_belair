<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    // Get search and filters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $filter_status = isset($_GET['filter_status']) ? $_GET['filter_status'] : '';
    $filter_gender = isset($_GET['filter_gender']) ? $_GET['filter_gender'] : '';
    // Purok filter removed

    // Enforce 20 rows per page limit
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 20; 
    if ($page < 1) $page = 1;
    $offset = ($page - 1) * $limit;

    $where_conditions = [];
    $params = [];

    if ($search !== '') {
        $where_conditions[] = "(
            CONCAT(first_name, ' ', last_name) LIKE :s1 OR
            CONCAT(last_name, ' ', first_name) LIKE :s2 OR
            CONCAT(first_name, ' ', middle_name, ' ', last_name) LIKE :s3 OR
            CONCAT(first_name, ' ', last_name, ' ', name_ext) LIKE :s4 OR

            LOWER(first_name) LIKE LOWER(:s5) OR
            LOWER(last_name) LIKE LOWER(:s6) OR
            LOWER(middle_name) LIKE LOWER(:s7) OR
            LOWER(name_ext) LIKE LOWER(:s8) OR

            LOWER(email) LIKE LOWER(:s9) OR
            contact_no LIKE :s10 OR
            rbi_id LIKE :s11 OR

            LOWER(street) LIKE LOWER(:s12) OR
            LOWER(barangay) LIKE LOWER(:s13)
        )";
        
        $searchTerm = '%' . strtolower($search) . '%';
        // Bind the search term 13 times to match the 13 placeholders
        for ($i = 1; $i <= 13; $i++) {
            $params[":s$i"] = $searchTerm;
        }
    }
    
    if ($filter_status !== '') {
        $where_conditions[] = "status = :status";
        $params[':status'] = $filter_status;
    }
    
    if ($filter_gender !== '') {
        $where_conditions[] = "gender = :gender";
        $params[':gender'] = strtoupper($filter_gender);
    }
    
    // Removed Purok condition logic here

    $where_clause = '';
    if (count($where_conditions) > 0) {
        $where_clause = "WHERE " . implode(" AND ", $where_conditions);
    }

    // 1. Pagination Count
    $count_sql = "SELECT COUNT(*) as total FROM user_info " . $where_clause;
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($params);
    $total_rows = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $total_pages = ceil($total_rows / $limit);

    // 2. Fetch Real-time Table Data (NOW INCLUDING THE ACTIVE BLOTTER CHECK)
    // This checks if the resident's name exists as a defendant in an ACTIVE blotter/complain case
    $sql = "SELECT user_info.*, 
            EXISTS (
                SELECT 1 FROM blotter_list 
                WHERE blotter_type IN ('BLOTTER', 'COMPLAIN') 
                AND status = 'active'
                AND defendants LIKE CONCAT('%', TRIM(user_info.first_name), '%')
                AND defendants LIKE CONCAT('%', TRIM(user_info.last_name), '%')
            ) AS has_blotter
        FROM user_info 
        $where_clause 
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset";
        
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) { // Removed the '&'
        $stmt->bindValue($key, $val);   // Changed to bindValue
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $raw_results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // FIX: Convert all database column names to lowercase so Javascript can read them perfectly
    $results = [];
    foreach ($raw_results as $row) {
        $lower_row = array_change_key_case($row, CASE_LOWER);
        
        // Ensure email key always exists
        if (!isset($lower_row['email'])) {
            $lower_row['email'] = '';
        }
        $results[] = $lower_row;
    }

    // 3. Overall Summary Counts (For the top chips)
    $summary = ['total' => 0, 'active' => 0, 'archived' => 0];
    $summary['total'] = $pdo->query("SELECT COUNT(*) FROM user_info")->fetchColumn();
    
    $sum_sql = "SELECT status, COUNT(*) as count FROM user_info GROUP BY status";
    $sum_stmt = $pdo->query($sum_sql);
    $summary_data = $sum_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($summary_data as $row) {
        // Lowercase the keys here too to protect against capitalized 'Status' column names
        $lower_row = array_change_key_case($row, CASE_LOWER);
        $stat = strtolower($lower_row['status']);
        if (isset($summary[$stat])) {
            $summary[$stat] = (int)$lower_row['count'];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $results,
        'summary' => $summary,
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