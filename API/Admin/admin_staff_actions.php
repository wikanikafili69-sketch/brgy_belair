<?php
// Include your database connection 
require_once '../../Admin/admin_auth.php';
require_once '../../Connections/db_connect.php'; 

// ── 1. HANDLE POST REQUESTS (Edit & Reset Pass) ──
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // ===================================================================
    // EDIT STAFF (Responds with JSON for JavaScript fetch)
    // ===================================================================
    if ($action === 'edit_staff') {
        header('Content-Type: application/json'); 
        
        $user_id = $_POST['user_id'];
        $f_name = trim($_POST['f_name']);
        $m_name = trim($_POST['m_name']);
        $l_name = trim($_POST['l_name']);
        $username = trim($_POST['username']);
        $email = trim($_POST['email']);
        $position = $_POST['position'];
        $existing_image = $_POST['existing_image'];
        
        // 🚨 NEW: Grab the access rights string from JS
        $access_rights_json = $_POST['access_rights'] ?? '[]';

        try {
            // Start a transaction so if one query fails, they all roll back
            $pdo->beginTransaction();

            // 1. DUPLICATE CHECKS (Ignore their own user_id!)
            $stmt = $pdo->prepare("SELECT user_id FROM user_credentials WHERE username = ? AND user_id != ?");
            $stmt->execute([$username, $user_id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Username is already taken by another user.']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT user_id FROM user_credentials WHERE email = ? AND user_id != ?");
            $stmt->execute([$email, $user_id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'This email is already registered to another user.']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT user_id FROM user_credentials WHERE f_name = ? AND m_name = ? AND l_name = ? AND user_id != ?");
            $stmt->execute([$f_name, $m_name, $l_name, $user_id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Another staff member with this exact full name already exists.']);
                exit;
            }

            // 2. HANDLE NEW IMAGE UPLOAD
            $image_location = $existing_image;

            if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
                if (!function_exists('imagecreatefromjpeg')) {
                    throw new Exception("Server missing GD Image Library.");
                }

                $fileTmpPath = $_FILES['profile_image']['tmp_name'];
                $imageInfo = @getimagesize($fileTmpPath);
                
                if ($imageInfo !== false) {
                    $mimeType = $imageInfo['mime'];
                    if (in_array($mimeType, ['image/jpeg', 'image/png'])) {
                        
                        if (!empty($existing_image)) {
                            $fileName = $existing_image;
                        } else {
                            $random_chars = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz0123456789"), 0, 5);
                            $date_str = date("Ymd");
                            $fileName = "{$random_chars}_{$date_str}_{$user_id}.jpg";
                        }
                        
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
                                unset($sourceImage); $sourceImage = $bg;        
                            }
                        }

                        if ($sourceImage) {
                            if (imagejpeg($sourceImage, $path, 75)) {
                                $image_location = $fileName; 
                            }
                            unset($sourceImage);
                        }
                    }
                }
            }

            // 3. UPDATE USER CREDENTIALS
            $stmt = $pdo->prepare("UPDATE user_credentials SET f_name = ?, m_name = ?, l_name = ?, username = ?, email = ?, position = ?, profile_image_location = ? WHERE user_id = ?");
            $stmt->execute([$f_name, $m_name, $l_name, $username, $email, $position, $image_location, $user_id]);
            
            // ═══════════════════════════════════════════════════
            // 4. UPDATE ACCESS RIGHTS (NEW)
            // ═══════════════════════════════════════════════════
            // First, delete all old permissions for this user
            $delStmt = $pdo->prepare("DELETE FROM user_access WHERE user_id = ?");
            $delStmt->execute([$user_id]);

            // Decode the new ones and insert them
            $access_rights = json_decode($access_rights_json, true);
            if (is_array($access_rights) && count($access_rights) > 0) {
                $accessStmt = $pdo->prepare("INSERT INTO user_access (user_id, access_id) VALUES (?, ?)");
                foreach ($access_rights as $access_id) {
                    $accessStmt->execute([$user_id, (int)$access_id]);
                }
            }
            // ═══════════════════════════════════════════════════

            // Commit the transaction!
            $pdo->commit();
            
            echo json_encode(['success' => true, 'message' => 'Profile and access rights updated successfully!']);
            
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit; 
    }
    
    // ===================================================================
    // RESET PASSWORD (Standard Form - Redirects)
    // ===================================================================
    elseif ($action === 'reset_password') {
        $user_id = $_POST['user_id'];
        $raw_password = $_POST['new_password'];
        $hashed_password = password_hash($raw_password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("UPDATE user_credentials SET hashed_password = ? WHERE user_id = ?");
        if ($stmt->execute([$hashed_password, $user_id])) {
            header("Location: ../../Admin/admin_staff.php?toast=" . urlencode('Password reset successfully.') . "&type=info");
            exit;
        }
    }
}

// ── 2. HANDLE GET REQUESTS (Suspend, Activate, Delete) ──
if (isset($_GET['action']) && isset($_GET['id'])) {
    $action = $_GET['action'];
    $id = $_GET['id'];

    if ($action === 'suspend') {
        $pdo->prepare("UPDATE user_credentials SET status = 'archived' WHERE user_id = ?")->execute([$id]);
        $toast_msg = 'Account suspended.';
        $toast_type = 'success';
    } 
    elseif ($action === 'activate') {
        $pdo->prepare("UPDATE user_credentials SET status = 'active' WHERE user_id = ?")->execute([$id]);
        $toast_msg = 'Account activated.';
        $toast_type = 'success';
    } 
    elseif ($action === 'delete') {
        $stmt = $pdo->prepare("SELECT profile_image_location FROM user_credentials WHERE user_id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if ($user && !empty($user['profile_image_location'])) {
            $imgPath = '../../Images/staff_profiles/' . $user['profile_image_location'];
            if (file_exists($imgPath)) {
                unlink($imgPath);
            }
        }
        $pdo->prepare("DELETE FROM user_credentials WHERE user_id = ?")->execute([$id]);
        $toast_msg = 'Account permanently deleted.';
        $toast_type = 'success';
    }
    
    header("Location: ../../Admin/admin_staff.php?toast=" . urlencode($toast_msg) . "&type=" . urlencode($toast_type));
    exit;
}

header("Location: ../../Admin/admin_staff.php");
exit;
?>