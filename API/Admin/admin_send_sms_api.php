<?php
// Adjust this path if your admin_auth.php is located elsewhere
require_once '../../Admin/admin_auth.php';
header('Content-Type: application/json');

// Get JSON input from the JavaScript fetch request
$data = json_decode(file_get_contents("php://input"), true);
$phone = isset($data['phone_number']) ? trim($data['phone_number']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';

if (empty($phone) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Phone number and message are required.']);
    exit;
}

// ==========================================
// FORMAT PHONE NUMBER TO 63
// ==========================================
// Remove any spaces or non-numeric characters just in case
$phone = preg_replace('/[^0-9]/', '', $phone);

if (substr($phone, 0, 2) === '09') {
    $phone = '63' . substr($phone, 1);
} 
elseif (substr($phone, 0, 2) !== '63') {
    $phone = '63' . $phone;
}
// ==========================================

// ==========================================
// PHILSMS API CONFIGURATION
// ==========================================
// 1. Paste your actual PhilSMS API Bearer Token below
$philsms_token = '2746|dsYd84iZW6TJQH5tJi6kkSq8rlaTinbrHr2C0bbe018a2e91'; 

// 2. Set your Sender ID (Use 'PhilSMS' or your own custom approved Sender ID)
$sender_id = 'PhilSMS';

// PhilSMS expects a JSON payload
$payload = json_encode([
    'recipient' => $phone,
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

// PhilSMS uses Bearer Token authorization and requires JSON content types in the headers
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $philsms_token,
    'Content-Type: application/json',
    'Accept: application/json'
]);

$output = curl_exec($ch);
$curl_error = curl_error($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Catch server/cURL connection errors
if ($output === false) {
    echo json_encode([
        'success' => false, 
        'message' => 'Server connection error.',
        'error_details' => $curl_error
    ]);
    exit;
}

$result = json_decode($output, true);

// PhilSMS returns HTTP 200 and usually a "status": "success" block
if ($http_status == 200 && isset($result['status']) && $result['status'] === 'success') {
    echo json_encode([
        'success' => true, 
        'message' => 'SMS queued successfully.',
        'data' => $result
    ]);
} else {
    // If PhilSMS rejected it (e.g., wrong API token, insufficient balance)
    $errorMsg = 'Unknown PhilSMS Error';
    if (is_array($result) && isset($result['message'])) {
        $errorMsg = $result['message'];
    } else {
        $errorMsg = $output; // Fallback to raw output if not JSON
    }

    echo json_encode([
        'success' => false, 
        'message' => 'PhilSMS rejected the request: ' . $errorMsg,
        'http_status' => $http_status
    ]);
}
?>