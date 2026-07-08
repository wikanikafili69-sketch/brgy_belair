<?php
// 1. Start the session and check basic login
require_once 'admin_auth.php';

// 2. Send the actual HTTP 403 Forbidden status code to the browser!
http_response_code(403);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Forbidden — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      background-color: #f1f5f9; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      margin: 0; 
      color: #334155;
    }
    .error-container { 
      background: white; 
      padding: 50px 40px; 
      border-radius: 16px; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
      text-align: center; 
      max-width: 450px; 
      border-top: 5px solid #ef4444;
    }
    .error-code { 
      font-size: 5rem; 
      font-weight: 800; 
      color: #ef4444; 
      margin: 0; 
      line-height: 1;
    }
    .error-title { 
      font-size: 1.5rem; 
      font-weight: 600; 
      margin: 15px 0 10px; 
      color: #0f172a;
    }
    .error-message { 
      color: #64748b; 
      margin-bottom: 30px; 
      line-height: 1.6;
    }
    .btn-back { 
      background: #3b82f6; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.3s ease;
    }
    .btn-back:hover { 
      background: #2563eb; 
    }
    .icon-lock {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>

  <div class="error-container">
    <i class="fa-solid fa-lock icon-lock"></i>
    <h1 class="error-code">403</h1>
    <h2 class="error-title">Access Forbidden</h2>
    <p class="error-message">Oops! It looks like you don't have the necessary permissions to view this module. If you believe this is a mistake, please contact the Super Administrator.</p>
    
    <a href="javascript:history.back()" class="btn-back">
      <i class="fa-solid fa-arrow-left"></i> Go Back
    </a>
  </div>

</body>
</html>