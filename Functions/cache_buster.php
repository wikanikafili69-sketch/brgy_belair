<?php
function get_fresh_asset($file_path) {
    // 1. Detect if we are on localhost or Hostinger
    $is_localhost = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);

    // 2. Set the Base URL dynamically
    if ($is_localhost) {
        // Points to your local XAMPP/WAMP folder
        $base_url = '/brgy_belair/'; 
    } else {
        // On Hostinger, the root domain is the base
        $base_url = '/';
    }

    // 3. Find the physical file on the server to check its modified time
    $absolute_path = $_SERVER['DOCUMENT_ROOT'] . $base_url . $file_path;
    
    // 4. Generate the cache-busting URL
    if (file_exists($absolute_path)) {
        $version = filemtime($absolute_path);
        return $base_url . $file_path . '?v=' . $version;
    } else {
        // Safe fallback if the file isn't found
        return $base_url . $file_path . '?v=' . time();
    }
}
?>