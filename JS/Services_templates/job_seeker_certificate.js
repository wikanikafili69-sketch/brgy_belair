// JS/Services_templates/first_time_job_seeker.js

function getFirstTimeJobSeekerHTML(data, dateStr) {
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
    // 🧠 SMART SHRINKING & PERFECT ALIGNMENT LOGIC
    // =====================================================================
    const fullName = data.full_name || data.fullname || '';
    const address = data.home_address || data.address || '';
    const residencyDuration = data.residency_duration || data.years_months || '';

    // BOX STYLE: Forces the underline to align perfectly with the surrounding text baseline
    const boxStyleBase = `display: inline-block; vertical-align: bottom; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;`;
    
    // Dynamically calculate font sizes and max-widths based on length (NO ELLIPSIS)
    const nameBoxStyle = `${boxStyleBase} min-width: 250px; max-width: 350px;`;
    const nameTextStyle = `white-space: normal; word-break: break-word; font-size: ${fullName.length > 28 ? '0.75rem' : '1.15rem'};`;

    const addressBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const addressTextStyle = `white-space: normal; word-break: break-word; font-size: ${address.length > 35 ? '0.75rem' : '1.15rem'};`;

    const durationBoxStyle = `${boxStyleBase} min-width: 100px; max-width: 200px;`;
    const durationTextStyle = `white-space: normal; word-break: break-word; font-size: ${residencyDuration.length > 20 ? '0.75rem' : '1.15rem'};`;


    // --- 1. THE EDIT FORM (Untouched) ---
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-briefcase" style="color: var(--blue); margin-right: 6px;"></i> Edit Job Seeker Details
            </h4>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Personal Information</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">FULL NAME <span style="color: red;">*</span></label>
                    <input type="text" name="full_name" class="edit-input" data-required="true" value="${data.full_name || data.fullname || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="contact_number" class="edit-input" data-required="true" maxlength="11" value="${data.contact_number || data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">HOME ADDRESS <span style="color: red;">*</span></label>
                    <input type="text" name="home_address" class="edit-input" data-required="true" value="${data.home_address || data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Residency Details</div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">RESIDENCY DURATION (Years/Months) <span style="color: red;">*</span></label>
                    <input type="text" name="residency_duration" class="edit-input" data-required="true" value="${data.residency_duration || data.years_months || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>
        </div>
    `;

    // --- 2. THE PRINTABLE CERTIFICATE ---
    const certificatePaper = `
    <div class="certificate-paper with-watermark">

        <!-- Calling the updated Header -->
        ${typeof getCertificateHeader === 'function' ? getCertificateHeader() : ''}

        <div class="cert-title" style="margin-bottom: 15px;">
            FIRST TIME JOB SEEKER CERTIFICATE
        </div>
        
        <div class="cert-greeting" style="margin-bottom: 10px;">
            TO WHOM IT MAY CONCERN:
        </div>
        
        <!-- Updated Body: Perfect Alignment & Smart Shrinking WITHOUT Ellipses -->
        <div class="cert-body">
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                This is to certify that 
                <span style="${nameBoxStyle}">
                    <strong id="lbl_full_name_${recordId}" style="${nameTextStyle} text-transform: uppercase;">${fullName}</strong>
                </span>, 
                a resident of 
                <span style="${addressBoxStyle}">
                    <strong id="lbl_home_address_${recordId}" style="${addressTextStyle} text-transform: uppercase;">${address}</strong>
                </span> 
                for 
                <span style="${durationBoxStyle}">
                    <strong id="lbl_residency_duration_${recordId}" style="${durationTextStyle} text-transform: uppercase;">${residencyDuration}</strong>
                </span>, 
                is a qualified First Time Job Seeker in accordance with Republic Act No. 11261.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                It is further certified that the above-named individual is actively seeking employment and requires this certification to avail of the benefits and exemptions provided under the First Time Jobseekers Assistance Act.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                This certification is issued upon the request of the interested party for employment applications and other related legal intents.
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