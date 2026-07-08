<?php
// API/Admin/add_resident_api.php
// 1. Require the bouncer to ensure only logged-in Admins can run this script!
require_once '../../Admin/admin_auth.php';
require_once '../../Connections/db_connect.php';

if (!isset($_GET['type']) || !isset($_GET['from']) || !isset($_GET['to'])) {
    die("Invalid request parameters.");
}

$type       = $_GET['type'];
$dateFrom   = $_GET['from'];
$dateTo     = $_GET['to'];
$start_date = $dateFrom . " 00:00:00";
$end_date   = $dateTo   . " 23:59:59";

// ── QUERY ─────────────────────────────────────────────────────────────────────
try {
    $results  = [];
    $filename = "Report_" . date('Ymd');

    switch ($type) {

        case 'Resident Population Report':
            $stmt = $pdo->prepare("
                SELECT first_name, last_name, gender, birth_date,
                       contact_no, street AS purok, status, created_at
                FROM user_info
                WHERE created_at BETWEEN :start AND :end
                ORDER BY created_at DESC
            ");
            $stmt->execute([':start' => $start_date, ':end' => $end_date]);
            $results  = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $filename = "Resident_Population_" . $dateFrom . "_to_" . $dateTo;
            break;

        case 'Blotter Incident Report':
            $stmt = $pdo->prepare("
                SELECT case_number, blotter_type, number_of_case,
                       complainants, defendants, hearing_date,
                       about, moderator, issue_problem
                FROM blotter_list
                WHERE hearing_date BETWEEN :start AND :end
                ORDER BY hearing_date DESC
            ");
            $stmt->execute([':start' => $dateFrom, ':end' => $dateTo]);
            $results  = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $filename = "Blotter_Report_" . $dateFrom . "_to_" . $dateTo;
            break;

        case 'Queue Activity Report':
        case 'Monthly Certificate Summary':
            $stmt = $pdo->prepare("
                SELECT queue_number, service_type, priority, status, created_at, updated_at
                FROM service_queues
                WHERE created_at BETWEEN :start AND :end
                ORDER BY created_at DESC
            ");
            $stmt->execute([':start' => $start_date, ':end' => $end_date]);
            $results  = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $filename = "Queue_Service_Report_" . $dateFrom . "_to_" . $dateTo;
            break;

        default:
            die("Report type not supported yet.");
    }

} catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

// ── OUTPUT HEADERS ────────────────────────────────────────────────────────────
header('Content-Type: application/vnd.ms-excel; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '.xls"');
header('Cache-Control: max-age=0');

// ── HELPERS ───────────────────────────────────────────────────────────────────
$total     = count($results);
$cols      = $total > 0 ? count($results[0]) : 1;
$generated = date('F j, Y  h:i A');
$period    = date('F j, Y', strtotime($dateFrom)) . ' – ' . date('F j, Y', strtotime($dateTo));

function prettifyCol($col) {
    return ucwords(str_replace('_', ' ', $col));
}

function esc($val) {
    return htmlspecialchars($val ?? '—', ENT_QUOTES, 'UTF-8');
}

function statusBadge($status) {
    $s = strtolower(trim($status));
    if (in_array($s, ['completed', 'approved']))  return ['#dcfce7', '#166534'];
    if (in_array($s, ['pending']))                return ['#fef9c3', '#854d0e'];
    if (in_array($s, ['processing']))             return ['#dbeafe', '#1e40af'];
    if (in_array($s, ['cancelled', 'rejected']))  return ['#fee2e2', '#991b1b'];
    return ['#f3f4f6', '#374151'];
}

?>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Report</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body, table, td, th {
    font-family: Arial, sans-serif;
    font-size: 10pt;
    color: #07102a;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* ── TITLE BLOCK ── */
  .row-brand td {
    background: #07102a;
    color: #ffffff;
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    padding: 14px 8px;
    letter-spacing: 3px;
  }
  .row-title td {
    background: #c8a84b;
    color: #07102a;
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    padding: 7px 8px;
    letter-spacing: 1px;
  }
  .row-meta td {
    background: #f3f5fa;
    color: #7a8cb0;
    font-size: 9pt;
    font-style: italic;
    text-align: center;
    padding: 5px 8px;
  }
  .row-stripe td {
    background: #2c57e5;
    padding: 2px;
    font-size: 1pt;
    line-height: 2px;
  }

  /* ── SUMMARY BAR ── */
  .row-summary td {
    background: #0c1835;
    color: #c8a84b;
    font-size: 9pt;
    font-weight: bold;
    padding: 6px 12px;
    letter-spacing: 0.5px;
  }

  /* ── COLUMN HEADERS ── */
  .row-header th {
    background: #07102a;
    color: #ffffff;
    font-size: 9pt;
    font-weight: bold;
    text-align: center;
    padding: 9px 12px;
    border: 1px solid #2c57e5;
    white-space: nowrap;
  }

  /* ── DATA ROWS ── */
  .row-even td {
    background: #f3f5fa;
    padding: 6px 10px;
    border: 1px solid #d1d9ee;
    vertical-align: middle;
  }
  .row-odd td {
    background: #ffffff;
    padding: 6px 10px;
    border: 1px solid #d1d9ee;
    vertical-align: middle;
  }
  .row-empty td {
    background: #ffffff;
    color: #7a8cb0;
    font-style: italic;
    text-align: center;
    padding: 20px;
    border: 1px solid #d1d9ee;
  }

  /* ── STATUS BADGE ── */
  .badge {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 8pt;
    font-weight: bold;
  }

  /* ── FOOTER ── */
  .row-gap td {
    background: #ffffff;
    border: none;
    padding: 8px;
  }
  .row-footer td {
    background: #f3f5fa;
    color: #7a8cb0;
    font-size: 8pt;
    font-style: italic;
    text-align: center;
    padding: 7px;
    border-top: 3px solid #c8a84b;
  }
</style>
</head>
<body>
<table>

  <!-- BRAND -->
  <tr class="row-brand">
    <td colspan="<?= $cols ?>">BARANGAY 101 &nbsp;&mdash;&nbsp; ADMIN MANAGEMENT SYSTEM</td>
  </tr>

  <!-- REPORT TITLE -->
  <tr class="row-title">
    <td colspan="<?= $cols ?>"><?= strtoupper(esc($type)) ?></td>
  </tr>

  <!-- META -->
  <tr class="row-meta">
    <td colspan="<?= $cols ?>">
      Period: &nbsp;<?= esc($period) ?> &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; Generated: &nbsp;<?= esc($generated) ?>
    </td>
  </tr>

  <!-- BLUE STRIPE -->
  <tr class="row-stripe">
    <td colspan="<?= $cols ?>">&nbsp;</td>
  </tr>

  <!-- SUMMARY -->
  <tr class="row-summary">
    <td colspan="<?= $cols ?>">
      SUMMARY &nbsp;&nbsp;&bull;&nbsp;&nbsp;
      Total Records: <?= $total ?> &nbsp;&nbsp;&bull;&nbsp;&nbsp;
      Report: <?= esc($type) ?>
    </td>
  </tr>

  <!-- COLUMN HEADERS -->
  <?php if ($total > 0): ?>
  <tr class="row-header">
    <?php foreach (array_keys($results[0]) as $col): ?>
      <th><?= esc(prettifyCol($col)) ?></th>
    <?php endforeach; ?>
  </tr>
  <?php endif; ?>

  <!-- DATA ROWS -->
  <?php if ($total === 0): ?>
  <tr class="row-empty">
    <td colspan="<?= $cols ?>">No records found for the selected date range.</td>
  </tr>
  <?php else: ?>
    <?php foreach ($results as $i => $row): ?>
    <tr class="<?= $i % 2 === 0 ? 'row-even' : 'row-odd' ?>">
      <?php foreach ($row as $key => $val): ?>
        <?php
          $k = strtolower($key);
          if ($k === 'status' && $val) {
              [$bg, $fg] = statusBadge($val);
              echo '<td style="text-align:center;"><span class="badge" style="background:' . $bg . ';color:' . $fg . ';">' . esc($val) . '</span></td>';
          } elseif ($k === 'case_number' || $k === 'queue_number') {
              echo '<td style="font-weight:bold;font-family:Courier New,monospace;">' . esc($val) . '</td>';
          } elseif ($k === 'priority') {
              $label = $val > 0 ? 'Priority' : 'Standard';
              $bg    = $val > 0 ? '#fef9c3' : '#f3f4f6';
              $fg    = $val > 0 ? '#854d0e' : '#374151';
              echo '<td style="text-align:center;"><span class="badge" style="background:' . $bg . ';color:' . $fg . ';">' . $label . '</span></td>';
          } elseif (in_array($k, ['birth_date', 'hearing_date', 'created_at', 'updated_at']) && $val) {
              echo '<td style="font-family:Courier New,monospace;font-size:9pt;">' . esc($val) . '</td>';
          } else {
              echo '<td>' . esc($val) . '</td>';
          }
        ?>
      <?php endforeach; ?>
    </tr>
    <?php endforeach; ?>
  <?php endif; ?>

  <!-- GAP -->
  <tr class="row-gap">
    <td colspan="<?= $cols ?>">&nbsp;</td>
  </tr>

  <!-- FOOTER -->
  <tr class="row-footer">
    <td colspan="<?= $cols ?>">
      Barangay 101 &mdash; Confidential Document &mdash; Generated by the Barangay 101 Admin Management System
    </td>
  </tr>

</table>
</body>
</html>