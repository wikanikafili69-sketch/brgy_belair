<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
require_once '../../Connections/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    // ADD OR EDIT ALBUM
    if ($action === 'add' || $action === 'edit') {
        $album_month = $_POST['album_month'] ?? date('Y-m');
        $title = $_POST['caption'] ?? '';
        $status = $_POST['status'] ?? 'active'; 
        
        $uploadDir = '../../Images/gallery/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // If ADDING new photos to the album
        if (isset($_FILES['gallery_images'])) {
            $fileCount = count($_FILES['gallery_images']['name']);
            
            for ($i = 0; $i < $fileCount; $i++) {
                if ($_FILES['gallery_images']['error'][$i] === UPLOAD_ERR_OK) {
                    $filename = time() . '_' . $i . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", basename($_FILES['gallery_images']['name'][$i]));
                    $targetFilePath = $uploadDir . $filename;
                    
                    if (move_uploaded_file($_FILES['gallery_images']['tmp_name'][$i], $targetFilePath)) {
                        $photo_path = 'Images/gallery/' . $filename; 
                        
                        $stmt = $pdo->prepare("INSERT INTO barangay_gallery (album_month, title, photo_path, status) VALUES (?, ?, ?, ?)");
                        $stmt->execute([$album_month, $title, $photo_path, $status]);
                    }
                }
            }
            echo json_encode(['status' => 'success', 'message' => 'Album updated/created successfully.']);
            exit;
        }

        // If EDITING just the title/status of an existing album (no new photos)
        if ($action === 'edit') {
            $stmt = $pdo->prepare("UPDATE barangay_gallery SET title = ?, status = ? WHERE album_month = ?");
            $stmt->execute([$title, $status, $album_month]);
            echo json_encode(['status' => 'success', 'message' => 'Album details updated.']);
            exit;
        }
    } 
    // DELETE ENTIRE ALBUM
    elseif ($action === 'delete') {
        $album_month = $_POST['album_month'];
        
        // Get all file paths for this month to delete the physical files
        $stmt = $pdo->prepare("SELECT photo_path FROM barangay_gallery WHERE album_month = ?");
        $stmt->execute([$album_month]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($rows as $row) {
            if (file_exists('../../' . $row['photo_path'])) {
                unlink('../../' . $row['photo_path']); 
            }
        }
        
        // Delete records from DB
        $stmt = $pdo->prepare("DELETE FROM barangay_gallery WHERE album_month = ?");
        $stmt->execute([$album_month]);
        echo json_encode(['status' => 'success', 'message' => 'Entire album deleted permanently.']);
        exit;
    }
    // BULK DELETE SPECIFIC PHOTOS INSIDE AN ALBUM (Moved inside the main POST check!)
    elseif ($action === 'delete_photos') {
        $photo_ids = $_POST['photo_ids'] ?? [];
        
        if (!empty($photo_ids)) {
            // Create placeholders for the SQL IN clause (?, ?, ?)
            $placeholders = implode(',', array_fill(0, count($photo_ids), '?'));
            
            // 1. Get file paths so we can delete the actual image files
            $stmt = $pdo->prepare("SELECT photo_path FROM barangay_gallery WHERE id IN ($placeholders)");
            $stmt->execute($photo_ids);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($rows as $row) {
                if (file_exists('../../' . $row['photo_path'])) {
                    unlink('../../' . $row['photo_path']); 
                }
            }
            
            // 2. Delete the records from the database
            $stmt = $pdo->prepare("DELETE FROM barangay_gallery WHERE id IN ($placeholders)");
            $stmt->execute($photo_ids);
            
            echo json_encode(['status' => 'success', 'message' => count($photo_ids) . ' photo(s) deleted successfully.']);
            exit;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'No photos were selected.']);
            exit;
        }
    }
}
?>