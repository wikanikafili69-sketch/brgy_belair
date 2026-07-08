<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {
    $createdBy = isset($_SESSION['admin_name']) ? $_SESSION['admin_name'] : 'Admin';

    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? 'General';
    $content = $_POST['content'] ?? '';
    $publishOption = $_POST['publish_option'] ?? 'Publish Now';
    $eventDate = !empty($_POST['event_date']) ? $_POST['event_date'] : null;
    $is_featured = isset($_POST['is_featured']) ? 1 : 0;
    
    $status = ($publishOption === 'Save as Draft') ? 'Archived' : 'Active';

    // RULE 1: Drafts cannot be featured
    if ($status === 'Archived') {
        $is_featured = 0;
    }

    // RULE 2: Max 3 Featured Posts
    if ($is_featured == 1) {
        $checkCount = $pdo->query("SELECT COUNT(*) FROM news_announcements WHERE is_featured = 1 AND status = 'Active'")->fetchColumn();
        if ($checkCount >= 3) {
            echo json_encode(['success' => false, 'message' => 'Maximum of 3 featured posts allowed. Please edit an existing post and un-feature it first.']);
            exit;
        }
    }

    if (empty($title) || empty($content)) {
        echo json_encode(['success' => false, 'message' => 'Title and Content are required.']);
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

    $publishDate = date('Y-m-d'); 
    $thumbPath = '../Images/BARANGAY_BG.jpg'; 

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../Documents/news_announcement/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $newFileName = 'news_' . time() . '_' . uniqid() . '.' . $fileExtension;
        $destination = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $destination)) {
            $thumbPath = '../Documents/news_announcement/' . $newFileName;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload image.']);
            exit;
        }
    }

    $stmt = $pdo->prepare("
        INSERT INTO news_announcements 
        (title, excerpt, tag, tagClass, type, icon, thumb, publish_date, event_date, status, is_featured, created_by) 
        VALUES (:title, :excerpt, :tag, :tagClass, :type, :icon, :thumb, :publish_date, :event_date, :status, :is_featured, :created_by)
    ");

    $stmt->execute([
        ':title' => $title,
        ':excerpt' => $content,
        ':tag' => $tag,
        ':tagClass' => $tagClass,
        ':type' => $category,
        ':icon' => $icon,
        ':thumb' => $thumbPath,
        ':publish_date' => $publishDate,
        ':event_date' => $eventDate,
        ':status' => $status,
        ':is_featured' => $is_featured,
        ':created_by' => $createdBy
    ]);

    echo json_encode(['success' => true, 'message' => 'Announcement saved successfully.']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>