// JS/Services_templates/other_services_certificate.js

function getOtherServicesHTML(data, dateStr) {
    let recordId = data.id || data.request_id || data.queue_number;
    if (!recordId) {
        for (let key in data) {
            if (key.toLowerCase().endsWith('id') && key !== 'queue_number') { recordId = data[key]; break; }
        }
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
    // 🧠 MAXIMUM WIDTH & 3-LINE STACKING LOGIC
    // =====================================================================
    const fullName = data.full_name || data.fullname || data.resident_name || '';
    const address = data.address || brgyName;

    // BOX STYLE: Sets a max-width for the underline so it never breaks the justified spacing
    const boxStyle = `display: inline-block; min-width: 250px; max-width: 350px; border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; padding: 0 5px; margin: 0 4px;`;
    
    // TEXT STYLE: Shrinks font, slices fake words, and forces max 3 lines stacked on top of each other!
    const nameTextStyle = `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-wrap: break-word; white-space: normal; line-height: 1.1; font-size: ${fullName.length > 25 ? '0.75rem' : '1.15rem'};`;
    const addressTextStyle = `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-wrap: break-word; white-space: normal; line-height: 1.1; font-size: ${address.length > 35 ? '0.75rem' : '1.15rem'};`;


    // --- 1. THE EDIT FORM (Untouched) ---
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-file-circle-check" style="color: var(--blue); margin-right: 6px;"></i> Edit Other Certificate Details
            </h4>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Personal Information</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">FULL NAME <span style="color: red;">*</span></label>
                    <input type="text" name="full_name" class="edit-input" data-required="true" value="${data.full_name || data.fullname || data.resident_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="contact_number" class="edit-input" data-required="true" maxlength="11" value="${data.contact_number || data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">ADDRESS <span style="color: red;">*</span></label>
                    <input type="text" name="address" class="edit-input" data-required="true" value="${data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">BIRTHDATE <span style="color: red;">*</span></label>
                    <input type="date" name="birthdate" class="edit-input" data-required="true" value="${data.birthdate || data.birth_date || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Document Details</div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CERTIFICATE TYPE / TITLE <span style="color: red;">*</span></label>
                    <input type="text" name="certificate_type" class="edit-input" data-required="true" value="${data.certificate_type || 'BARANGAY CERTIFICATION'}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

        </div>
    `;

    // --- 2. THE NEW PRINTABLE CERTIFICATE ---
    const certificatePaper = `
    <div class="certificate-paper with-watermark">
        
        <!-- Calling the updated Header -->
        ${typeof getCertificateHeader === 'function' ? getCertificateHeader() : ''}

        <div class="cert-title" id="lbl_certificate_type_${recordId}" style="margin-bottom: 15px; text-transform: uppercase;">
            ${data.certificate_type || 'BARANGAY CERTIFICATION'}
        </div>
        
        <div class="cert-greeting" style="margin-bottom: 10px;">
            TO WHOM IT MAY CONCERN:
        </div>
        
        <!-- Updated Body: Fixes Justification Gaps and Implements 3-Line Subscript Stacking! -->
        <div class="cert-body">
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2;">
                This is to certify that 
                <span style="${boxStyle}">
                    <strong id="lbl_full_name_${recordId}" style="${nameTextStyle} text-transform: uppercase;">${fullName}</strong>
                </span>, 
                of legal age, is a bona fide resident of 
                <span style="${boxStyle}">
                    <strong id="lbl_address_${recordId}" style="${addressTextStyle} text-transform: uppercase;">${address}</strong>
                </span>.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2;">
                This certification is being issued upon the request of the above-named person for whatever legal intent it may serve.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 20px; line-height: 2;">
                ISSUED this 
                <span style="display: inline-block; min-width: 150px; max-width: 250px; border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; padding: 0 5px; margin: 0 4px;">
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