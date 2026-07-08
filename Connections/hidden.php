<?php
// Include your existing database connection.
require_once 'db_connect.php'; 

// Data to Insert or Update
$username = 'test';
$f_name = 'test1';
$l_name = 'test2';
$m_name = 'test3';
$raw_password = 'password'; 
$email = 'test@gmail.com';
$status = 'active';
$position = 'superadmin';

// Hash the password securely using bcrypt
$hashed_password = password_hash($raw_password, PASSWORD_DEFAULT); 

// Prepare the Insert statement with ON DUPLICATE KEY UPDATE
// Note: This assumes your 'username' column is set as a UNIQUE index or PRIMARY KEY in your database.
$sql = "INSERT INTO user_credentials 
        (username, f_name, l_name, m_name, hashed_password, email, status, position) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        hashed_password = VALUES(hashed_password)";

try {
    // $pdo is already available here from your included db_connect.php
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $username, 
        $f_name, 
        $l_name, 
        $m_name, 
        $hashed_password, 
        $email, 
        $status, 
        $position
    ]);
    
    // rowCount() returns 1 if a new row was inserted, and 2 if an existing row was updated.
    if ($stmt->rowCount() == 1) {
        echo "Success: New hidden admin user successfully added!";
    } elseif ($stmt->rowCount() == 2) {
        echo "Success: User '{$username}' already existed. Their password has been updated!";
    } else {
        echo "Notice: User '{$username}' already exists and the password was already the same (no changes made).";
    }

} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage();
}
?>