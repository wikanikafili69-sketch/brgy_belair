<?php
// =================================================================
// ⚙️ ENVIRONMENT TOGGLE (DEVELOPMENT vs PRODUCTION)
// =================================================================
define('ENVIRONMENT', 'development'); 

if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// =================================================================
// 🛡️ FATAL ERROR CATCHER
// =================================================================
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE, E_USER_ERROR, E_RECOVERABLE_ERROR])) {
        http_response_code(200); 
        $errorMessage = (ENVIRONMENT === 'development') 
            ? 'FATAL CRASH: ' . $err['message'] . ' on line ' . $err['line']
            : 'A critical server error occurred. Please contact the administrator.';
        echo json_encode(['success' => false, 'message' => $errorMessage]);
        exit;
    }
});

ini_set('memory_limit', '1024M'); 

header("Content-Type: application/json");
require_once '../../Connections/db_connect.php';

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$data = $_POST;

if (empty($data)) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit;
}

try {
    // ── 1. NORMALIZE ────────────────────────────────────────────
    $fname   = strtoupper(trim($data['first_name'] ?? ''));
    $lname   = strtoupper(trim($data['last_name'] ?? ''));
    $mname   = strtoupper(trim($data['middle_name'] ?? ''));
    $ext     = strtoupper(trim($data['name_ext'] ?? ''));
    $email   = strtolower(trim($data['email'] ?? ''));
    $contact = trim($data['contact_no'] ?? '');
    $dob     = $data['birth_date'] ?? '';

    $gender = strtoupper($data['gender'] ?? 'OTHER');
    if (!in_array($gender, ['MALE', 'FEMALE'])) $gender = 'OTHER';

    $is_voter = ($data['registered_voter'] ?? '') === 'Yes' ? 1 : 0;
    $is_dswd  = ($data['dswd_beneficiary'] ?? '') === 'Yes' ? 1 : 0;
    $is_livelihood = ($data['livelihood_beneficiary'] ?? '') === 'Yes' ? 1 : 0;

    $priority  = $data['priority'] ?? '';
    $is_senior = ($priority === 'Senior Citizen') ? 1 : 0;
    $is_pwd    = ($priority === 'Person with Disability (PWD)') ? 1 : 0;
    $is_solo   = ($priority === 'Solo Parent') ? 1 : 0;

    $religion = ($data['religion'] === 'Other') ? ($data['religion_other'] ?? '') : ($data['religion'] ?? '');
    $dswd_date = !empty($data['dswd_date']) ? $data['dswd_date'] : null;
    $livelihood_date = !empty($data['livelihood_date']) ? $data['livelihood_date'] : null;

    $is_aics  = ($data['chk_aics'] ?? '') === 'true' ? 1 : 0;
    $is_akap  = ($data['chk_akap'] ?? '') === 'true' ? 1 : 0;
    $is_tupad = ($data['chk_tupad'] ?? '') === 'true' ? 1 : 0;


    // ── 2. DUPLICATE CHECKS (BULLETPROOF PHP MATCHING) ──────────
    if (!empty($email)) {
        $stmt = $pdo->prepare("SELECT rbi_id FROM user_info WHERE email = :email");
        $stmt->execute([':email' => $email]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success'=>false,'error_type'=>'email','message'=>'Email already registered.']);
            exit;
        }
    }

    if (!empty($contact)) {
        $stmt = $pdo->prepare("SELECT rbi_id FROM user_info WHERE contact_no = :contact");
        $stmt->execute([':contact' => $contact]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success'=>false,'error_type'=>'contact','message'=>'Contact already registered.']);
            exit;
        }
    }

    // Exact Match Check (Bypasses MySQL Collation Error)
    $checkExact = $pdo->prepare("SELECT rbi_id, IFNULL(middle_name,'') as m_name, IFNULL(name_ext,'') as n_ext FROM user_info WHERE first_name = :fname AND last_name = :lname AND birth_date = :dob");
    $checkExact->execute([':fname' => $fname, ':lname' => $lname, ':dob' => $dob]);
    
    while ($row = $checkExact->fetch(PDO::FETCH_ASSOC)) {
        if (strtoupper(trim($row['m_name'])) === $mname && strtoupper(trim($row['n_ext'])) === $ext) {
            echo json_encode(['success' => false, 'error_type' => 'duplicate', 'message' => 'Exact resident profile already exists.']);
            exit;
        }
    }

    // Name Collision Check / Extension Required (Bypasses MySQL Collation Error)
    if (empty($ext)) {
        $checkName = $pdo->prepare("SELECT rbi_id, IFNULL(middle_name,'') as m_name FROM user_info WHERE first_name = :fname AND last_name = :lname");
        $checkName->execute([':fname' => $fname, ':lname' => $lname]);
        
        while ($row = $checkName->fetch(PDO::FETCH_ASSOC)) {
            if (strtoupper(trim($row['m_name'])) === $mname) {
                echo json_encode(['success' => false, 'error_type' => 'ext_required', 'message' => 'This name already exists. Please add an Extension (e.g., JR, SR) to differentiate.']);
                exit;
            }
        }
    }

    // ── 3. BEGIN DATABASE TRANSACTION ───────────────────────────
    $pdo->beginTransaction();

    $sql = "INSERT INTO user_info (
        first_name, middle_name, last_name, name_ext,
        household_number, household_type, contact_no, email,
        gender, birth_date, birth_place, civil_status, religion,
        house_number, street, barangay, municipality_city, province,
        educational_attainment, employment_business, kind_of_business,
        registered_voter, precinct_no, citizenship, years_of_stay, residence_status,
        is_senior_citizen, is_pwd, is_solo_parent,
        is_dswd_beneficiary, is_aics_beneficiary, is_akap_beneficiary, is_tupad_beneficiary, dswd_other, dswd_date_received,
        is_livelihood_beneficiary, livelihood_specify, livelihood_date_finished,
        status
    ) VALUES (
        :fname,:mname,:lname,:ext,
        :hh_no,:hh_type,:contact,:email,
        :gender,:dob,:pob,:civil,:religion,
        :h_no,:st,:brgy,:muni,:prov,
        :edu,:job,:kind_job,
        :voter,:precinct,:cit,:stay,:res,
        :senior,:pwd,:solo,
        :dswd_yes,:aics,:akap,:tupad,:dswd_oth,:dswd_date,
        :live_yes,:live_spec,:live_date,
        'Active'
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':fname'=>$fname, ':mname'=>$mname, ':lname'=>$lname, ':ext'=>$ext,
        ':hh_no'=>$data['household_number'] ?? '', ':hh_type'=>$data['household_type'] ?? '',
        ':contact'=>$contact, ':email'=>$email, ':gender'=>$gender, ':dob'=>$dob,
        ':pob'=>$data['birth_place'] ?? '', ':civil'=>$data['civil_status'] ?? '', ':religion'=>$religion,
        ':h_no'=>$data['house_number'] ?? '', ':st'=>$data['street'] ?? '', ':brgy'=>$data['barangay'] ?? '',
        ':muni'=>$data['municipality'] ?? '', ':prov'=>$data['province'] ?? '',
        ':edu'=>$data['educational_attainment'] ?? '', ':job'=>$data['employment_business'] ?? '', ':kind_job'=>$data['kind_of_business'] ?? '',
        ':voter'=>$is_voter, ':precinct'=>$data['precinct_no'] ?? '', ':cit'=>$data['citizenship'] ?? '',
        ':stay'=>$data['years_of_stay'] ?? null, ':res'=>$data['residence_status'] ?? '',
        ':senior'=>$is_senior, ':pwd'=>$is_pwd, ':solo'=>$is_solo,
        ':dswd_yes'=>$is_dswd, ':aics'=>$is_aics, ':akap'=>$is_akap, ':tupad'=>$is_tupad, ':dswd_oth'=>$data['dswd_other'] ?? '', ':dswd_date'=>$dswd_date,
        ':live_yes'=>$is_livelihood, ':live_spec'=>$data['livelihood_specify'] ?? '', ':live_date'=>$livelihood_date
    ]);

    $lastId = $pdo->lastInsertId();

    // ── 4. SECURE IMAGE COMPRESSION ────────────────────────────
    if (isset($_FILES['rbi_photo']) && $_FILES['rbi_photo']['error'] === 0) {
        
        if (!function_exists('imagecreatefromjpeg')) {
            throw new Exception("GD Image Library is disabled.");
        }

        $fileTmpPath = $_FILES['rbi_photo']['tmp_name'];
        $allowedMimeTypes = ['image/jpeg', 'image/png'];
        
        $imageInfo = @getimagesize($fileTmpPath);
        if ($imageInfo === false) {
            throw new Exception("Image is corrupt or not a real image.");
        }

        $mimeType = $imageInfo['mime'];
        if (!in_array($mimeType, $allowedMimeTypes)) {
            throw new Exception("Only JPG and PNG allowed.");
        }

        $dir = "../../Images/rbi_pictures/";
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        $fileName = "RBI_" . $lastId . "_" . date("Ymd") . ".jpg";
        $path = $dir . $fileName;
        $sourceImage = false;

        if ($mimeType === 'image/jpeg') {
            $sourceImage = @imagecreatefromjpeg($fileTmpPath);
        } elseif ($mimeType === 'image/png') {
            $sourceImage = @imagecreatefrompng($fileTmpPath);
            if ($sourceImage) {
                $bg = imagecreatetruecolor(imagesx($sourceImage), imagesy($sourceImage));
                imagefill($bg, 0, 0, imagecolorallocate($bg, 255, 255, 255));
                imagealphablending($bg, TRUE);
                imagecopy($bg, $sourceImage, 0, 0, 0, 0, imagesx($sourceImage), imagesy($sourceImage));
                unset($sourceImage); 
                $sourceImage = $bg;         
            }
        }

        if ($sourceImage) {
            $maxWidth = 800; 
            $originalWidth = imagesx($sourceImage);
            
            if ($originalWidth > $maxWidth) {
                $scaledImage = imagescale($sourceImage, $maxWidth);
                unset($sourceImage); 
                $sourceImage = $scaledImage;
            }

            if (imagejpeg($sourceImage, $path, 70)) {
                $pdo->prepare("UPDATE user_info SET photo_path=? WHERE rbi_id=?")
                    ->execute(["Images/rbi_pictures/" . $fileName, $lastId]);
            }
            unset($sourceImage);
        } else {
             throw new Exception("Failed to process the image data.");
        }
    }

    $pdo->commit();

    echo json_encode([
        'success'=>true,
        'ref_id'=>"RBI-".str_pad($lastId,5,'0',STR_PAD_LEFT)
    ]);

// ── 5. ERROR CATCHERS ───────────────────────────────────────
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) { 
        $pdo->rollBack(); 
    }
    
    $errorMessage = (ENVIRONMENT === 'development')
        ? 'System Error: ' . $e->getMessage()
        : 'An unexpected error occurred. Please try again later.';

    echo json_encode([
        'success' => false, 
        'message' => $errorMessage
    ]);
}
?>