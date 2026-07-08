<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

try {
    $id = (int)$_POST['id'];
    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? 'General';
    $content = $_POST['content'] ?? '';
    $status = $_POST['status'] ?? 'Active';
    $eventDate = !empty($_POST['event_date']) ? $_POST['event_date'] : null;
    $is_featured = isset($_POST['is_featured']) ? 1 : 0;
    
    // RULE 1: Archiving automatically un-features the post
    if ($status === 'Archived') {
        $is_featured = 0;
    }

    // RULE 2: Max 3 Featured Posts (excluding the post we are currently editing)
    if ($is_featured == 1) {
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM news_announcements WHERE is_featured = 1 AND status = 'Active' AND id != :id");
        $stmtCheck->execute([':id' => $id]);
        $checkCount = $stmtCheck->fetchColumn();

        if ($checkCount >= 3) {
            echo json_encode(['success' => false, 'message' => 'Maximum of 3 featured posts allowed. Please un-feature an existing post first.']);
            exit;
        }
    }

    if (empty($title) || empty($content)) {
        echo json_encode(['success' => false, 'message' => 'Title and Content cannot be empty.']);
        exit;
    }

    $tag = $category; 
    $tagClass = 'chip-blue';
    $icon = '📢';

    switch ($category) {
        case 'Official Announcement': $tagClass = 'chip-blue'; $icon = '📢'; break;
        case 'Health Advisory': $tagClass = 'chip-green'; $icon = '🏥'; break;
        case 'Education': $tagClass = 'chip-blue'; $icon = '🎓'; break;
        case 'Infrastructure Update': $tagClass = 'chip-default'; $icon = '🚧'; break;
        case 'Safety & Security': $tagClass = 'chip-red'; $icon = '🚨'; break;
    }

    $sql = "UPDATE news_announcements 
            SET title = :title, excerpt = :excerpt, tag = :tag, tagClass = :tagClass, 
                type = :type, icon = :icon, status = :status, is_featured = :is_featured, event_date = :event_date";
    
    $params = [
        ':title' => $title,
        ':excerpt' => $content,
        ':tag' => $tag,
        ':tagClass' => $tagClass,
        ':type' => $category,
        ':icon' => $icon,
        ':status' => $status,
        ':is_featured' => $is_featured,
        ':event_date' => $eventDate,
        ':id' => $id
    ];

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../Documents/news_announcement/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $newFileName = 'news_' . time() . '_' . uniqid() . '.' . $fileExtension;
        $destination = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $destination)) {
            $sql .= ", thumb = :thumb";
            $params[':thumb'] = '../Documents/news_announcement/' . $newFileName;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload new image.']);
            exit;
        }
    }

    $sql .= " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Announcement updated successfully.']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>