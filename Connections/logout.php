<?php
// Connections/logout.php
session_start();

// 1. Empty the session variables
session_unset();

// 2. Destroy the session entirely
session_destroy();

// 3. Redirect them back to the login page (Up one folder level to the root)
header("Location: ../staff.php");
exit();
?>