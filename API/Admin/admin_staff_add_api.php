<?php
require_once '../../Admin/admin_auth.php';
require_once '../../Connections/db_connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $username = trim($_POST['username'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $f_name   = trim($_POST['f_name'] ?? '');
    $l_name   = trim($_POST['l_name'] ?? '');
    $m_name   = trim($_POST['m_name'] ?? '');
    $password = $_POST['password'] ?? ''; 
    $position = $_POST['position'] ?? 'staff'; 
    $status   = $_POST['status'] ?? 'pending';
    
    // 🚨 NEW: Grab the access rights string from JS
    $access_rights_json = $_POST['access_rights'] ?? '[]';

    try {
        $pdo->beginTransaction();

        // 1. DUPLICATE CHECKS
        $stmt = $pdo->prepare("SELECT user_id FROM user_credentials WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Username is already taken.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT user_id FROM user_credentials WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'This email is already registered.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT user_id FROM user_credentials WHERE f_name = ? AND m_name = ? AND l_name = ?");
        $stmt->execute([$f_name, $m_name, $l_name]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'A staff member with this exact full name already exists.']);
            exit;
        }

        // 2. INSERT STAFF (Get ID)
        $hashed_password = password_hash($password, PASSWORD_DEFAULT); 
        $insertStmt = $pdo->prepare("INSERT INTO user_credentials (username, f_name, m_name, l_name, email, hashed_password, position, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $insertStmt->execute([$username, $f_name, $m_name, $l_name, $email, $hashed_password, $position, $status]);
        
        $new_user_id = $pdo->lastInsertId();

        // ═══════════════════════════════════════════════════
        // 2.5 INSERT ACCESS RIGHTS (NEW)
        // ═══════════════════════════════════════════════════
        // Decode the JSON string into a PHP array (e.g., [1, 4, 5])
        $access_rights = json_decode($access_rights_json, true);

        if (is_array($access_rights) && count($access_rights) > 0) {
            // Prepare the insert statement for the linking table
            $accessStmt = $pdo->prepare("INSERT INTO user_access (user_id, access_id) VALUES (?, ?)");
            
            foreach ($access_rights as $access_id) {
                // Ensure the access_id is a clean integer before inserting
                $accessStmt->execute([$new_user_id, (int)$access_id]);
            }
        }
        // ═══════════════════════════════════════════════════

        // 3. SECURE IMAGE COMPRESSION (GD LIBRARY)
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            
            if (!function_exists('imagecreatefromjpeg')) {
                throw new Exception("Server missing GD Image Library.");
            }

            $fileTmpPath = $_FILES['photo']['tmp_name'];
            $imageInfo = @getimagesize($fileTmpPath);
            
            if ($imageInfo === false) {
                throw new Exception("File is not a valid image.");
            }

            $mimeType = $imageInfo['mime'];
            if (!in_array($mimeType, ['image/jpeg', 'image/png'])) {
                throw new Exception("Only JPG and PNG files are allowed.");
            }

            // Naming convention: [5-random-characters]_[YYYYMMDD]_[user_id].jpg
            $random_chars = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz0123456789"), 0, 5);
            $date_str = date("Ymd");
            $fileName = "{$random_chars}_{$date_str}_{$new_user_id}.jpg";
            
            $dir = "../../Images/staff_profiles/";
            if (!is_dir($dir)) mkdir($dir, 0777, true);
            $path = $dir . $fileName;
            
            $sourceImage = false;
            if ($mimeType === 'image/jpeg') {
                $sourceImage = @imagecreatefromjpeg($fileTmpPath);
            } elseif ($mimeType === 'image/png') {
                $sourceImage = @imagecreatefrompng($fileTmpPath);
                if ($sourceImage) {
                    $bg = imagecreatetruecolor(imagesx($sourceImage), imagesy($sourceImage));
                    imagefill($bg, 0, 0, imagecolorallocate($bg, 255, 255, 255));
                    imagecopy($bg, $sourceImage, 0, 0, 0, 0, imagesx($sourceImage), imagesy($sourceImage));
                    unset($sourceImage); 
                    $sourceImage = $bg;         
                }
            }

            if ($sourceImage) {
                // Secondary Backend compression
                if (imagejpeg($sourceImage, $path, 75)) {
                    $updateStmt = $pdo->prepare("UPDATE user_credentials SET profile_image_location = ? WHERE user_id = ?");
                    $updateStmt->execute([$fileName, $new_user_id]);
                }
                unset($sourceImage);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Staff registered successfully!']);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>