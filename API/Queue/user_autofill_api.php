<?php

header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

try {

// --- UPDATED SQL QUERY ---
    $sql = "SELECT 
        CONCAT(
            first_name,
            IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(' ', middle_name), ''),
            CONCAT(' ', last_name),
            IF(name_ext IS NOT NULL AND name_ext != '', CONCAT(', ', name_ext), '')
        ) AS fullname,
        
        -- NEW: Concatenate the address fields with a comma and space
        CONCAT_WS(', ', 
            NULLIF(house_number, ''),
            NULLIF(street, ''),
            NULLIF(barangay, ''),
            NULLIF(municipality_city, ''),
            NULLIF(province, '')
        ) AS full_address,
        
        birth_date,
        contact_no,
        email,
        years_of_stay
    FROM user_info
    WHERE status = 'Active'
    ORDER BY first_name ASC";

    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $users
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}