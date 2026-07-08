<?php
require_once 'Functions/cache_buster.php';
date_default_timezone_set('Asia/Manila');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Queue Monitor</title>

<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Monitor_css/monitor.css'); ?>">
</head>

<body>

<div class="wrapper">

    <div class="top-bar">
        <div style="display:flex; gap:10px; align-items:center;">
            <div class="lang-toggle" id="lang-toggle">🇺🇸</div>
            <div class="mute-btn" id="mute-btn">🔊</div>
            <div class="mute-btn" id="repeat-btn">🔁</div>
        </div>
        <div class="datetime" id="datetime"></div>
    </div>

    <div id="audio-start" class="audio-start">
        🔊 Click to Enable Sound
    </div>

    <h1 class="header">QUEUE MONITOR</h1>

    <div class="row-title">NOW PROCESSING</div>
    <div class="grid">
        <div class="card">
            <div class="title">NORMAL</div>
            <div id="proc-normal" class="list"></div>
        </div>

        <div class="card">
            <div class="title">PRIORITY</div>
            <div id="proc-priority" class="list"></div>
        </div>
    </div>

    <div class="row-title">PENDING QUEUE</div>
    <div class="grid">
        <div class="card">
            <div class="title">NORMAL</div>
            <div id="pend-normal" class="list"></div>
        </div>

        <div class="card">
            <div class="title">PRIORITY</div>
            <div id="pend-priority" class="list"></div>
        </div>
    </div>

</div>

<script src="<?php echo get_fresh_asset('JS/Monitor_js/monitor.js'); ?>"></script>
</body>
</html>