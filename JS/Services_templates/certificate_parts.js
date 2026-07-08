// JS/Services_templates/certificate_parts.js

// ========================================================
// ⚙️ GLOBAL CERTIFICATE CONFIGURATION
// Update these variables ONCE, and they will automatically 
// update across all your certificates!
// ========================================================
const CERT_PROVINCE = "Province of Test";
const CERT_MUNICIPALITY = "Municipality of Test";
const CERT_BARANGAY = "Barangay Test";
const CERT_PUNONG_BARANGAY = "HON. Juan A. Tamad";
const CERT_TITLE = "Barangay Captain 1";
const CERT_LOGO_PATH = "../Images/BARANGAY_ICON.png";
// ========================================================


function getCertificateHeader() {
    return `
        <div class="cert-header-wrapper">
            <!-- Top Layout: Logo on Left, Text Centered -->
            <div class="cert-header-top">
                <!-- Left Logo -->
                <div class="cert-logo-container">
                    <img src="${CERT_LOGO_PATH}" alt="Barangay Logo" onerror="this.style.display='none';">
                </div>

                <!-- Center Text Area -->
                <div class="cert-header-text">
                    <span class="cert-header-sm">Republic of the Philippines</span>
                    <span class="cert-header-sm">${CERT_PROVINCE}</span>
                    <span class="cert-header-sm">${CERT_MUNICIPALITY}</span>
                    <h3 class="cert-barangay-name">${CERT_BARANGAY}</h3>
                </div>
                
                <!-- Empty spacer div to perfectly center the text mathematically -->
                <div class="cert-logo-spacer"></div>
            </div>

            <!-- Horizontal Line Separator -->
            <hr class="cert-divider" />

            <!-- Office Title -->
            <div class="cert-office-title">
                OFFICE OF THE BARANGAY CAPTAIN
            </div>
        </div>
    `;
}

// Passed 'data' parameter to allow dynamic OR Numbers if needed
function getCertificateFooter(data = {}) {
    return `
        <div class="cert-footer-wrapper">
            <!-- Left Side: Payment / Document Details -->
            <div class="cert-footer-left">
                <div>O.R. No. <span class="footer-line-fill">${data.or_number ? data.or_number : ''}</span></div>
                <div>Date Issued: <span class="footer-line-fill">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                <div>Doc. Stamp: <span class="footer-line-fill"></span></div>
            </div>

            <!-- Right Side: Signatory -->
            <div class="cert-footer-right">
                <h4 class="cert-signatory-name">${CERT_PUNONG_BARANGAY}</h4>
                <span class="cert-signatory-title">${CERT_TITLE}</span>
            </div>
        </div>
    `;
}