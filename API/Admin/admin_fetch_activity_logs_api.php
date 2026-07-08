<?php
// Turn off raw HTML errors so we don't break the JSON format
require_once '../../Admin/admin_auth.php';
error_reporting(0); 
header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

try {
    // ⚠️ Adjust this path to exactly where your db_connect.php is located!
    // Based on your comment, it seems to be in a "Connections" folder.
    require_once '../../Connections/db_connect.php'; 

    // Check if the PDO connection variable actually exists
    if (!isset($pdo)) {
        throw new Exception("Database connection variable (\$pdo) is missing. Check your require_once path.");
    }

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $offset = ($page - 1) * $limit;

    $searchParam = "%{$search}%";

    // 1. Get the total count for pagination using PDO
    $countSql = "SELECT COUNT(*) as total FROM activity_logs WHERE staff_name LIKE :search1 OR action LIKE :search2";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute(['search1' => $searchParam, 'search2' => $searchParam]);
    $totalResult = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalRecords = $totalResult['total'];
    $totalPages = ceil($totalRecords / $limit);

    // 2. Fetch the actual data using PDO
    $sql = "SELECT id, staff_name, action, timestamp FROM activity_logs WHERE staff_name LIKE :search1 OR action LIKE :search2 ORDER BY timestamp DESC LIMIT :offset, :limit";
    $stmt2 = $pdo->prepare($sql);
    
    // We must bind limits as integers in PDO
    $stmt2->bindValue(':search1', $searchParam, PDO::PARAM_STR);
    $stmt2->bindValue(':search2', $searchParam, PDO::PARAM_STR);
    $stmt2->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt2->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt2->execute();

    $data = [];
    while ($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
        // Format the time nicely for the modal
        $row['formatted_time'] = date('M d, Y \a\t h:i A', strtotime($row['timestamp']));
        
        // Auto-assign role based on name to trigger the correct CSS badge
        $row['role'] = (stripos($row['staff_name'], 'admin') !== false || stripos($row['staff_name'], 'administrator') !== false) ? 'admin' : 'staff';
        
        $data[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_records' => $totalRecords
        ]
    ]);

} catch (PDOException $e) {
    // Catch PDO-specific database errors
    echo json_encode([
        'success' => false,
        'message' => "Database Error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Catch general errors
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>