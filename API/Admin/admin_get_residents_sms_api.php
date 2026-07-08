<?php
require_once '../../Admin/admin_auth.php';
header('Content-Type: application/json');

require_once '../../Connections/db_connect.php';

// Ensure admin is logged in
if (!isset($_SESSION['admin_name'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$action = $_GET['action'] ?? '';

// ==========================================
// NEW FUNCTION: Send SMS via PhilSMS
// ==========================================
function sendPhilSMS($recipient, $message) {
    // 1. Paste your actual PhilSMS API Bearer Token below
    $philsms_token = '2746|dsYd84iZW6TJQH5tJi6kkSq8rlaTinbrHr2C0bbe018a2e91'; 
    $sender_id = 'PhilSMS'; // Use 'PhilSMS' or your custom approved Sender ID

    // ==========================================
    // FORMAT PHONE NUMBERS TO 63 (Handles multiple comma-separated numbers)
    // ==========================================
    $numbers = explode(',', $recipient);
    $formatted_numbers = [];

    foreach ($numbers as $num) {
        // Remove any spaces or non-numeric characters for this specific number
        $num = preg_replace('/[^0-9]/', '', $num);

        // Only format if the number isn't completely empty
        if (!empty($num)) {
            if (substr($num, 0, 2) === '09') {
                $num = '63' . substr($num, 1);
            } elseif (substr($num, 0, 2) !== '63') {
                $num = '63' . $num;
            }
            $formatted_numbers[] = $num;
        }
    }
    
    // Join them back together with commas
    $final_recipients = implode(',', $formatted_numbers);
    // ==========================================

    $payload = json_encode([
        'recipient' => $final_recipients,
        'sender_id' => $sender_id,
        'type'      => 'plain',       // <--- ADDED THIS LINE TO FORCE TEXT MESSAGE
        'message'   => $message
    ]);

    $ch = curl_init();
    // Standard PhilSMS v3 API endpoint (FIXED URL)
    curl_setopt($ch, CURLOPT_URL, 'https://dashboard.philsms.com/api/v3/sms/send'); 
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $philsms_token,
        'Content-Type: application/json',
        'Accept: application/json'
    ]);

    $output = curl_exec($ch);
    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    return [
        'output'      => $output, 
        'http_status' => $http_status,
        'curl_error'  => $curl_error
    ];
}

try {
    if ($action === 'get_group') {
        $group = $_GET['group'] ?? 'all';
        
        $sql = "SELECT contact_no FROM user_info WHERE contact_no IS NOT NULL AND contact_no != ''";
        
        if ($group === 'senior') {
            $sql .= " AND is_senior_citizen = 1"; 
        } elseif ($group === 'pwd') {
            $sql .= " AND is_pwd = 1";
        } elseif ($group === 'solo_parent') {
            $sql .= " AND is_solo_parent = 1";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo json_encode([
            'success' => true, 
            'count'   => count($results), 
            'numbers' => implode(',', $results) 
        ]);
        exit();

    } elseif ($action === 'search') {
        $query = $_GET['query'] ?? '';
        
        $sql = "SELECT rbi_id, CONCAT(first_name, ' ', last_name) AS full_name, contact_no AS contact_number 
                FROM user_info";
                
        $params = [];
        if ($query !== '') {
            $sql .= " WHERE CONCAT(first_name, ' ', last_name) LIKE :query";
            $params[':query'] = "%$query%";
        }
        
        $sql .= " ORDER BY first_name ASC"; 
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $results]);
        exit();

    // ==========================================
    // NEW ACTION: Send the SMS
    // ==========================================
    } elseif ($action === 'send_sms') {
        // Read the JSON payload sent from your Javascript fetch request
        $data = json_decode(file_get_contents("php://input"), true);
        $phone = isset($data['phone_number']) ? trim($data['phone_number']) : '';
        $message = isset($data['message']) ? trim($data['message']) : '';

        if (empty($phone) || empty($message)) {
            echo json_encode(['success' => false, 'message' => 'Phone number and message are required.']);
            exit();
        }

        // Call our new custom function
        $api_response = sendPhilSMS($phone, $message);
        
        if ($api_response['output'] === false) {
            echo json_encode([
                'success' => false, 
                'message' => 'Server connection error.',
                'error_details' => $api_response['curl_error']
            ]);
            exit;
        }

        $result = json_decode($api_response['output'], true);

        if ($api_response['http_status'] == 200 && isset($result['status']) && $result['status'] === 'success') {
            echo json_encode([
                'success' => true, 
                'message' => 'SMS queued successfully.',
                'data' => $result
            ]);
        } else {
            $errorMsg = 'Unknown PhilSMS Error';
            if (is_array($result) && isset($result['message'])) {
                $errorMsg = $result['message'];
            } else {
                $errorMsg = $api_response['output'];
            }

            echo json_encode([
                'success' => false, 
                'message' => 'PhilSMS rejected the request: ' . $errorMsg,
                'http_status' => $api_response['http_status']
            ]);
        }
        exit();
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>