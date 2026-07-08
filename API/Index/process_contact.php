<?php
// FILE: process_contact.php
require_once '../../Connections/db_connect.php'; // Adjust path if needed

// Tell the browser we are sending JSON back
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Grab and sanitize the text inputs (Now including Email and Contact Number)
    $fullName     = htmlspecialchars(trim($_POST['fullName'] ?? ''));
    $emailAddress = htmlspecialchars(trim($_POST['emailAddress'] ?? ''));
    $contactNum   = htmlspecialchars(trim($_POST['contactNum'] ?? ''));
    $subject      = htmlspecialchars(trim($_POST['subject'] ?? ''));
    $message      = htmlspecialchars(trim($_POST['message'] ?? ''));

    // Basic validation
    if (empty($fullName) || empty($emailAddress) || empty($contactNum) || empty($subject) || empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'All required fields must be filled out.']);
        exit;
    }

    $photoPath = null; // Default to null if no photo is uploaded

    // 2. Handle the Photo Upload (if the user selected a file)
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        // Updated directory path
        $uploadDir = '../../Images/contact_us/';

        // Clean the full name to be safe for file saving (removes illegal characters and spaces)
        $safeFullName = preg_replace('/[^a-zA-Z0-9]/', '_', $fullName);
        
        // Get the original file extension (e.g., jpg, png)
        $fileExtension = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));

        // Generate the new file name using the Full Name
        // Format: Juan_Dela_Cruz_17123456.jpg (Timestamp added to prevent overwriting)
        $fileName = $safeFullName . '_' . time() . '.' . $fileExtension;
        
        $targetFilePath = $uploadDir . $fileName;

        // Allow certain file formats
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (in_array($fileExtension, $allowedTypes)) {
            // Also, it is highly recommended to check if the folder exists and create it if not
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetFilePath)) {
                $photoPath = $fileName; // ✅ GOOD: Saves ONLY the file name (e.g. Juan_123.jpg)
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error uploading the photo. Check folder permissions.']);
                exit;
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Only JPG, JPEG, PNG, & GIF files are allowed.']);
            exit;
        }
    }

    // 3. Insert into the Database (Now including email_address and contact_num)
    try {
        // Using PDO prepared statements
        $stmt = $pdo->prepare("INSERT INTO contact_us (full_name, email_address, contact_num, subject, message, photo_path, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$fullName, $emailAddress, $contactNum, $subject, $message, $photoPath]);

        echo json_encode(['status' => 'success', 'message' => 'Your message has been sent successfully!']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
?>