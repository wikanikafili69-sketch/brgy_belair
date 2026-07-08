// JS/Services_templates/legal_guardian_certificate.js

function getLegalGuardianHTML(data, dateStr) {
    let recordId = data.id || data.request_id || data.queue_number;
    if (!recordId) {
        for (let key in data) {
            if (key.toLowerCase().endsWith('id') && key !== 'queue_number') { recordId = data[key]; break; }
        }
    }

    // --- SMART PURPOSE LOGIC ---
    const definedPurposes = ["School Enrollment", "Medical Consent", "Travel Authorization", "Financial Transactions", "Legal Proceedings", "Other", ""];
    let isOther = data.purpose === 'Other' || (data.purpose && !definedPurposes.includes(data.purpose));
    let displayPurpose = isOther ? 'Other' : (data.purpose || '');
    
    let otherValue = data.other_purpose_details || data.other_purpose || '';
    if (isOther && data.purpose !== 'Other' && !otherValue) {
        otherValue = data.purpose;
    }

    // Safely grab globals
    const brgyName = typeof CERT_BARANGAY !== 'undefined' ? CERT_BARANGAY : 'Barangay TEST';
    const munName = typeof CERT_MUNICIPALITY !== 'undefined' ? CERT_MUNICIPALITY : 'Municipality of Cataingan';
    const provName = typeof CERT_PROVINCE !== 'undefined' ? CERT_PROVINCE : 'Province of Masbate';

    // Format the date using Manila Time
    let formattedDate = dateStr;
    try {
        const d = new Date();
        const dayStr = d.toLocaleString('en-US', { timeZone: 'Asia/Manila', day: 'numeric' });
        const month = d.toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'long' });
        const year = d.toLocaleString('en-US', { timeZone: 'Asia/Manila', year: 'numeric' });
        
        const day = parseInt(dayStr, 10);
        const suffix = (day % 10 == 1 && day != 11) ? 'st' : (day % 10 == 2 && day != 12) ? 'nd' : (day % 10 == 3 && day != 13) ? 'rd' : 'th';
        formattedDate = `${day}<sup>${suffix}</sup> day of ${month}, ${year}`;
    } catch(e) {
        // Fallback
    }

    // =====================================================================
    // 🧠 SMART SHRINKING & PERFECT ALIGNMENT LOGIC
    // =====================================================================
    const minorName = data.full_name || data.fullname || '';
    const guardianName = data.legal_guardian_name || data.guardian || '';
    const address = data.home_address || data.address || brgyName;
    const fullPurpose = (data.purpose || '') + ' ' + otherValue;

    // BOX STYLE: Forces the underline to align perfectly with the surrounding text baseline
    const boxStyleBase = `display: inline-block; vertical-align: bottom; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;`;
    
    // Dynamically calculate font sizes and max-widths based on length (NO ELLIPSIS)
    const guardianBoxStyle = `${boxStyleBase} min-width: 250px; max-width: 350px;`;
    const guardianTextStyle = `white-space: normal; word-break: break-word; font-size: ${guardianName.length > 28 ? '0.75rem' : '1.15rem'};`;

    const minorBoxStyle = `${boxStyleBase} min-width: 250px; max-width: 350px;`;
    const minorTextStyle = `white-space: normal; word-break: break-word; font-size: ${minorName.length > 28 ? '0.75rem' : '1.15rem'};`;

    const addressBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const addressTextStyle = `white-space: normal; word-break: break-word; font-size: ${address.length > 35 ? '0.75rem' : '1.15rem'};`;

    const purposeBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 280px;`;
    const purposeTextStyle = `white-space: normal; word-break: break-word; font-size: ${fullPurpose.length > 30 ? '0.75rem' : '1.15rem'};`;


    // --- 1. THE EDIT FORM (Untouched) ---
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-users" style="color: var(--blue); margin-right: 6px;"></i> Edit Legal Guardian Details
            </h4>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Personal Information</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">MINOR'S FULL NAME <span style="color: red;">*</span></label>
                    <input type="text" name="full_name" class="edit-input" data-required="true" value="${data.full_name || data.fullname || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">LEGAL GUARDIAN NAME <span style="color: red;">*</span></label>
                    <input type="text" name="legal_guardian_name" class="edit-input" data-required="true" value="${data.legal_guardian_name || data.guardian || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">HOME ADDRESS <span style="color: red;">*</span></label>
                    <input type="text" name="home_address" class="edit-input" data-required="true" value="${data.home_address || data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="contact_number" class="edit-input" data-required="true" maxlength="11" value="${data.contact_number || data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Request Details</div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">PURPOSE <span style="color: red;">*</span></label>
                    <select name="purpose" class="edit-input" data-required="true" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;" onchange="let w = document.getElementById('wrap_other_purpose_${recordId}'); let i = document.getElementById('input_other_purpose_${recordId}'); if(this.value === 'Other') { w.style.display = 'block'; } else { w.style.display = 'none'; i.value = ''; }">
                        <option value="">— Select —</option>
                        <option value="School Enrollment" ${displayPurpose === 'School Enrollment' ? 'selected' : ''}>School Enrollment</option>
                        <option value="Medical Consent" ${displayPurpose === 'Medical Consent' ? 'selected' : ''}>Medical Consent</option>
                        <option value="Travel Authorization" ${displayPurpose === 'Travel Authorization' ? 'selected' : ''}>Travel Authorization</option>
                        <option value="Financial Transactions" ${displayPurpose === 'Financial Transactions' ? 'selected' : ''}>Financial Transactions</option>
                        <option value="Legal Proceedings" ${displayPurpose === 'Legal Proceedings' ? 'selected' : ''}>Legal Proceedings</option>
                        <option value="Other" ${displayPurpose === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>

            <div id="wrap_other_purpose_${recordId}" style="display: ${displayPurpose === 'Other' ? 'block' : 'none'}; margin-bottom: 16px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">SPECIFY THE PURPOSE <span style="color: red;">*</span></label>
                <input type="text" name="other_purpose_details" id="input_other_purpose_${recordId}" class="edit-input" value="${otherValue}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;" placeholder="ENTER PURPOSE">
            </div>

        </div>
    `;

    // --- 2. THE NEW PRINTABLE CERTIFICATE ---
    const certificatePaper = `
    <div class="certificate-paper with-watermark">

        <!-- Calling the updated Header -->
        ${typeof getCertificateHeader === 'function' ? getCertificateHeader() : ''}

        <div class="cert-title" style="margin-bottom: 15px;">
            CERTIFICATE OF LEGAL GUARDIANSHIP
        </div>
        
        <div class="cert-greeting" style="margin-bottom: 10px;">
            TO WHOM IT MAY CONCERN:
        </div>
        
        <!-- Updated Body: Perfect Alignment & Smart Shrinking WITHOUT Ellipses -->
        <div class="cert-body">
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                This is to certify that 
                <span style="${guardianBoxStyle}">
                    <strong id="lbl_legal_guardian_name_${recordId}" style="${guardianTextStyle} text-transform: uppercase;">${guardianName}</strong>
                </span>, 
                of legal age, is a bona fide resident of 
                <span style="${addressBoxStyle}">
                    <strong id="lbl_home_address_${recordId}" style="${addressTextStyle} text-transform: uppercase;">${address}</strong>
                </span>, 
                and is personally known to me to be of good moral character.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                It is further certified that the aforementioned individual is the recognized legal guardian of the minor, 
                <span style="${minorBoxStyle}">
                    <strong id="lbl_full_name_${recordId}" style="${minorTextStyle} text-transform: uppercase;">${minorName}</strong>
                </span>.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                This certification is issued upon request for the purpose of 
                <span style="${purposeBoxStyle}">
                    <strong id="lbl_purpose_${recordId}" style="${purposeTextStyle} text-transform: uppercase;">${fullPurpose.trim()}</strong>
                </span> 
                and for any other legal intents it may serve.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 20px; line-height: 2.2;">
                ISSUED this 
                <span style="display: inline-block; vertical-align: bottom; min-width: 150px; max-width: 250px; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;">
                    <strong>${formattedDate}</strong>
                </span> 
                at ${brgyName}, ${munName}, ${provName}.
            </p>
        </div>

        <!-- Calling the updated Footer, passing the data object -->
        ${typeof getCertificateFooter === 'function' ? getCertificateFooter(data) : ''}

    </div>`;

    return editForm + certificatePaper;
}