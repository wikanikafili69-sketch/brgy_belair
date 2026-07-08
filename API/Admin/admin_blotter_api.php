<?php
// API/Admin/admin_blotter_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper function to handle file uploads
function handleFileUpload($complainantName) {
    if (isset($_FILES['attached_file']) && $_FILES['attached_file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../Documents/blotter/';
        // Create directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileInfo = pathinfo($_FILES['attached_file']['name']);
        $extension = strtolower($fileInfo['extension']);
        
        // Sanitize name: remove spaces and special characters
        $cleanName = preg_replace('/[^a-zA-Z0-9]/', '_', $complainantName);
        if (empty($cleanName)) $cleanName = 'Case';
        
        // Format: Name_YYYYMMDD_HHMMSS.ext
        $dateStr = date('Ymd_His');
        $newFileName = $cleanName . '_' . $dateStr . '.' . $extension;
        $destination = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['attached_file']['tmp_name'], $destination)) {
            return 'Documents/blotter/' . $newFileName;
        }
    }
    return null;
}

try {
    // ─── GET: FETCH ALL BLOTTER RECORDS & RESIDENTS ──────────────────────────
    if ($method === 'GET') {
        // Dynamic Resident Search for Dropdown
        if (isset($_GET['action']) && $_GET['action'] === 'get_residents') {
            $search = isset($_GET['q']) ? trim($_GET['q']) : '';
            
            if (strlen($search) > 0) {
                // CONCAT_WS handles spaces. NULLIF prevents double spaces if middle_name is empty.
                $sql = "SELECT DISTINCT CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), last_name) AS full_name 
                        FROM user_info 
                        WHERE 
                            first_name LIKE :search1 
                            OR middle_name LIKE :search2
                            OR last_name LIKE :search3 
                            OR CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), last_name) LIKE :search4 
                        ORDER BY 
                            CASE 
                                WHEN first_name LIKE :exact1 THEN 1
                                WHEN last_name LIKE :exact2 THEN 2
                                WHEN CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), last_name) LIKE :exact3 THEN 3
                                ELSE 4
                            END,
                            first_name ASC 
                        LIMIT 10";
                
                $stmt = $pdo->prepare($sql);
                
                // Set the wildcard strings
                $searchWildcard = '%' . $search . '%';
                $exactWildcard = $search . '%';
                
                // Bind the parameters individually to prevent the HY093 error
                $stmt->bindValue(':search1', $searchWildcard);
                $stmt->bindValue(':search2', $searchWildcard);
                $stmt->bindValue(':search3', $searchWildcard);
                $stmt->bindValue(':search4', $searchWildcard);
                
                $stmt->bindValue(':exact1', $exactWildcard);
                $stmt->bindValue(':exact2', $exactWildcard);
                $stmt->bindValue(':exact3', $exactWildcard);
                
                $stmt->execute();
                echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } else {
                echo json_encode(['success' => true, 'data' => []]);
            }
            exit;
        }

        // EXISTING: Fetch blotter records WITH Status Filter
        $statusFilter = isset($_GET['status']) ? strtolower($_GET['status']) : 'active';
        $whereClause = "";
        
        if ($statusFilter === 'active') {
            $whereClause = "WHERE status = 'active'";
        } elseif ($statusFilter === 'inactive') {
            $whereClause = "WHERE status = 'inactive'";
        } 
        // If 'all', $whereClause remains empty to fetch everything

        $stmt = $pdo->query("SELECT * FROM blotter_list $whereClause ORDER BY id DESC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // ─── POST (AND FAKE PUT): INSERT / UPDATE RECORD ─────────────────────────
    if ($method === 'POST') {
        // Since we use FormData in JS, data is in $_POST, not php://input
        $input = $_POST;
        $isUpdate = isset($_POST['_method']) && $_POST['_method'] === 'PUT';

        if (empty($input['blotter_type']) || empty($input['case_number'])) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing.']);
            exit;
        }

        // Process File Upload
        $filePath = handleFileUpload($input['complainants'] ?? 'Unknown');

        if ($isUpdate) {
            // UPDATE LOGIC (Now includes case_number)
            $sql = "UPDATE blotter_list SET 
                    blotter_type = :blotter_type, 
                    case_number = :case_number,
                    hearing_date = :hearing_date,
                    number_of_case = :number_of_case, 
                    moderator = :moderator, 
                    defendants = :defendants, 
                    complainants = :complainants, 
                    is_visitor = :is_visitor,
                    about = :about, 
                    issue_problem = :issue_problem, 
                    agreement = :agreement, 
                    document_reference = :document_reference, 
                    noted_by = :noted_by";
            
            $params = [
                ':blotter_type'       => $input['blotter_type'], 
                ':case_number'        => $input['case_number'],
                ':hearing_date'       => !empty($input['hearing_date']) ? $input['hearing_date'] : null,
                ':number_of_case'     => $input['number_of_case'] ?? 1,
                ':moderator'          => $input['moderator'] ?? '', 
                ':defendants'         => $input['defendants'] ?? '',
                ':complainants'       => $input['complainants'] ?? '', 
                ':is_visitor'         => isset($input['is_visitor']) && $input['is_visitor'] == 1 ? 1 : 0,
                ':about'              => $input['about'] ?? '',
                ':issue_problem'      => $input['issue_problem'] ?? '', 
                ':agreement'          => $input['agreement'] ?? '',
                ':document_reference' => $input['document_reference'] ?? '', 
                ':noted_by'           => $input['noted_by'] ?? '',
                ':id'                 => $input['id']
            ];

            // Only update file column if a new file was uploaded
            if ($filePath) {
                $sql .= ", attached_file = :attached_file";
                $params[':attached_file'] = $filePath;
            }
            $sql .= " WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'message' => 'Record updated successfully!']);

        } else {
            // INSERT LOGIC (Added explicit "active" status)
            $sql = "INSERT INTO blotter_list 
                    (blotter_type, case_number, hearing_date, number_of_case, moderator, defendants, complainants, is_visitor, about, issue_problem, agreement, document_reference, noted_by, attached_file, status) 
                    VALUES 
                    (:blotter_type, :case_number, :hearing_date, :number_of_case, :moderator, :defendants, :complainants, :is_visitor, :about, :issue_problem, :agreement, :document_reference, :noted_by, :attached_file, 'active')";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':blotter_type'       => $input['blotter_type'], 
                ':case_number'        => $input['case_number'],
                ':hearing_date'       => !empty($input['hearing_date']) ? $input['hearing_date'] : null,
                ':number_of_case'     => $input['number_of_case'] ?? 1, 
                ':moderator'          => $input['moderator'] ?? '',
                ':defendants'         => $input['defendants'], 
                ':complainants'       => $input['complainants'],
                ':is_visitor'         => isset($input['is_visitor']) && $input['is_visitor'] == 1 ? 1 : 0,
                ':about'              => $input['about'] ?? '', 
                ':issue_problem'      => $input['issue_problem'],
                ':agreement'          => $input['agreement'] ?? '', 
                ':document_reference' => $input['document_reference'] ?? '',
                ':noted_by'           => $input['noted_by'] ?? '', 
                ':attached_file'      => $filePath
            ]);
            echo json_encode(['success' => true, 'message' => 'Blotter record saved successfully!']);
        }
        exit;
    }

    // ─── DELETE: SOFT DELETE BLOTTER RECORD (MARK INACTIVE) ──────────────────
    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("UPDATE blotter_list SET status = 'inactive' WHERE id = :id");
        $stmt->execute([':id' => $input['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Case successfully marked as inactive!']);
        exit;
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>