<?php
// 1. Require the Staff bouncer to ensure only logged-in Staff can see these stats
require_once '../../Staff/staff_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    // Get search and filters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $filter_status = isset($_GET['filter_status']) ? $_GET['filter_status'] : '';
    $filter_gender = isset($_GET['filter_gender']) ? $_GET['filter_gender'] : '';
    $filter_purok = isset($_GET['filter_purok']) ? $_GET['filter_purok'] : '';

    // Enforce 20 rows per page limit
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 20; 
    if ($page < 1) $page = 1;
    $offset = ($page - 1) * $limit;

    $where_conditions = [];
    $params = [];

    // SEARCH UPGRADE
    if ($search !== '') {
        $where_conditions[] = "(
            CONCAT(first_name, ' ', last_name) LIKE :search1 OR
            CONCAT(last_name, ' ', first_name) LIKE :search2 OR
            CONCAT(first_name, ' ', middle_name, ' ', last_name) LIKE :search3 OR
            CONCAT(first_name, ' ', last_name, ' ', name_ext) LIKE :search4 OR

            first_name LIKE :search5 OR
            last_name LIKE :search6 OR
            middle_name LIKE :search7 OR
            name_ext LIKE :search8 OR

            email LIKE :search9 OR
            contact_no LIKE :search10 OR
            rbi_id LIKE :search11 OR

            street LIKE :search12 OR
            barangay LIKE :search13
        )";

        $like = '%' . $search . '%';

        $params[':search1'] = $like;
        $params[':search2'] = $like;
        $params[':search3'] = $like;
        $params[':search4'] = $like;
        $params[':search5'] = $like;
        $params[':search6'] = $like;
        $params[':search7'] = $like;
        $params[':search8'] = $like;
        $params[':search9'] = $like;
        $params[':search10'] = $like;
        $params[':search11'] = $like;
        $params[':search12'] = $like;
        $params[':search13'] = $like;
    }
    
    if ($filter_status !== '') {
        $where_conditions[] = "status = :status";
        $params[':status'] = $filter_status;
    }
    
    if ($filter_gender !== '') {
        $where_conditions[] = "gender = :gender";
        $params[':gender'] = strtoupper($filter_gender);
    }
    
    if ($filter_purok !== '') {
        $where_conditions[] = "street LIKE :purok"; // Assuming street is where Purok is saved
        $params[':purok'] = '%' . $filter_purok . '%';
    }

    $where_clause = '';
    if (count($where_conditions) > 0) {
        $where_clause = "WHERE " . implode(" AND ", $where_conditions);
    }

    // 1. Pagination Count
    $count_sql = "SELECT COUNT(*) as total FROM user_info " . $where_clause;
    $count_stmt = $pdo->prepare($count_sql);
    foreach ($params as $key => $val) {
        $count_stmt->bindValue($key, $val);
    }
    $count_stmt->execute();
    $total_rows = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $total_pages = ceil($total_rows / $limit);

// 2. Fetch Real-time Table Data (UPGRADED BLOTTER CHECK)
    $sql = "SELECT user_info.*, 
            EXISTS (
                SELECT 1 FROM blotter_list 
                WHERE blotter_type IN ('BLOTTER', 'COMPLAIN') 
                AND LOWER(status) = 'active'
                AND defendants LIKE CONCAT('%', TRIM(user_info.first_name), '%')
                AND defendants LIKE CONCAT('%', TRIM(user_info.last_name), '%')
            ) AS has_blotter
            FROM user_info " . $where_clause . " 
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset";
            
    $stmt = $pdo->prepare($sql);

    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }

    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Overall Summary Counts (For the top chips)
    $summary = ['total' => 0, 'active' => 0, 'archived' => 0];
    $summary['total'] = $pdo->query("SELECT COUNT(*) FROM user_info")->fetchColumn();
    
    $sum_sql = "SELECT status, COUNT(*) as count FROM user_info GROUP BY status";
    $sum_stmt = $pdo->query($sum_sql);
    $summary_data = $sum_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($summary_data as $row) {
        $stat = strtolower($row['status']);
        if (isset($summary[$stat])) {
            $summary[$stat] = (int)$row['count'];
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