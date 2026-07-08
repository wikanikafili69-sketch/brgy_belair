// JS/Services_templates/delivery_parking.js

function getDeliveryParkingHTML(data, dateStr) {
    let recordId = data.id || data.request_id || data.clearance_id || data.queue_number;
    if (!recordId) {
        for (let key in data) {
            if (key.toLowerCase().endsWith('id') && key !== 'queue_number') { recordId = data[key]; break; }
        }
    }

    // --- SMART PURPOSE LOGIC ---
    // Check if the current purpose is one of the predefined ones, or if it's a custom "Other" value
    const definedPurposes = ["Goods Delivery", "Furniture Moving", "Construction Materials", "Appliance Delivery", "Commercial Supply", "Other", ""];
    let isOther = data.purpose === 'Other' || (data.purpose && !definedPurposes.includes(data.purpose));
    let displayPurpose = isOther ? 'Other' : (data.purpose || '');
    
    // Grab the custom text if it exists
    let otherValue = data.other_purpose_details || data.other_purpose || '';
    if (isOther && data.purpose !== 'Other' && !otherValue) {
        otherValue = data.purpose; // Fallback in case the old DB just saved the custom text directly into `purpose`
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
    const companyName = data.company_name || '';
    const location = data.location || '';
    const dateRange = data.date_from_to || data.date_range || '';
    const timeFrom = data.time_from || '';
    const timeTo = data.time_to || '';
    const vehiclePlates = data.vehicle_plate_number || data.vehicles || '';
    const fullPurpose = (data.purpose || '') + ' ' + otherValue;

    // BOX STYLE: Forces the underline to align perfectly with the surrounding text baseline
    const boxStyleBase = `display: inline-block; vertical-align: bottom; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;`;
    
    // Dynamically calculate font sizes and max-widths based on length (NO ELLIPSIS)
    const companyBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const companyTextStyle = `white-space: normal; word-break: break-word; font-size: ${companyName.length > 25 ? '0.75rem' : '1.15rem'};`;

    const locationBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 250px;`;
    const locationTextStyle = `white-space: normal; word-break: break-word; font-size: ${location.length > 20 ? '0.75rem' : '1.15rem'};`;

    const dateBoxStyle = `${boxStyleBase} min-width: 120px; max-width: 200px;`;
    const dateTextStyle = `white-space: normal; word-break: break-word; font-size: ${dateRange.length > 18 ? '0.75rem' : '1.15rem'};`;
    
    const timeFromBoxStyle = `${boxStyleBase} min-width: 80px; max-width: 120px;`;
    const timeToBoxStyle = `${boxStyleBase} min-width: 80px; max-width: 120px;`;
    const timeTextStyle = `white-space: normal; font-size: 1.15rem;`;

    const vehicleBoxStyle = `${boxStyleBase} min-width: 120px; max-width: 200px;`;
    const vehicleTextStyle = `white-space: normal; word-break: break-word; font-size: ${vehiclePlates.length > 15 ? '0.75rem' : '1.15rem'};`;

    const purposeBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 280px;`;
    const purposeTextStyle = `white-space: normal; word-break: break-word; font-size: ${fullPurpose.length > 30 ? '0.75rem' : '1.15rem'};`;

    // --- 1. THE EDIT FORM (Untouched) ---
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-truck" style="color: var(--blue); margin-right: 6px;"></i> Edit Delivery / Parking Details
            </h4>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Company & Location</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">COMPANY NAME <span style="color: red;">*</span></label>
                    <input type="text" name="company_name" class="edit-input" data-required="true" value="${data.company_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="contact_number" class="edit-input" data-required="true" maxlength="11" value="${data.contact_number || data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">DELIVERY/PARKING LOCATION <span style="color: red;">*</span></label>
                    <input type="text" name="location" class="edit-input" data-required="true" value="${data.location || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Schedule & Vehicles</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">DATE (FROM - TO) <span style="color: red;">*</span></label>
                    <input type="text" name="date_from_to" class="edit-input" data-required="true" value="${data.date_from_to || data.date_range || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;" readonly onfocus="if(!this._flatpickr) { flatpickr(this, {mode: 'range', dateFormat: 'F j, Y', locale: { rangeSeparator: ' TO ' }}); this._flatpickr.open(); }">
                </div>
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">TIME FROM <span style="color: red;">*</span></label>
                        <input type="time" name="time_from" class="edit-input" data-required="true" value="${data.time_from || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">TIME TO <span style="color: red;">*</span></label>
                        <input type="time" name="time_to" class="edit-input" data-required="true" value="${data.time_to || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">VEHICLE / PLATE NO. <span style="color: red;">*</span></label>
                    <input type="text" name="vehicle_plate_number" class="edit-input" data-required="true" value="${data.vehicle_plate_number || data.vehicles || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">PURPOSE <span style="color: red;">*</span></label>
                    <select name="purpose" class="edit-input" data-required="true" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;" onchange="let w = document.getElementById('wrap_other_purpose_${recordId}'); let i = document.getElementById('input_other_purpose_${recordId}'); if(this.value === 'Other') { w.style.display = 'block'; } else { w.style.display = 'none'; i.value = ''; }">
                        <option value="">— Select —</option>
                        <option value="Goods Delivery" ${displayPurpose === 'Goods Delivery' ? 'selected' : ''}>Goods Delivery</option>
                        <option value="Furniture Moving" ${displayPurpose === 'Furniture Moving' ? 'selected' : ''}>Furniture Moving</option>
                        <option value="Construction Materials" ${displayPurpose === 'Construction Materials' ? 'selected' : ''}>Construction Materials</option>
                        <option value="Appliance Delivery" ${displayPurpose === 'Appliance Delivery' ? 'selected' : ''}>Appliance Delivery</option>
                        <option value="Commercial Supply" ${displayPurpose === 'Commercial Supply' ? 'selected' : ''}>Commercial Supply</option>
                        <option value="Other" ${displayPurpose === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>

            <div id="wrap_other_purpose_${recordId}" style="display: ${displayPurpose === 'Other' ? 'block' : 'none'}; margin-bottom: 16px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">SPECIFY THE PURPOSE <span style="color: red;">*</span></label>
                <input type="text" name="other_purpose_details" id="input_other_purpose_${recordId}" class="edit-input" value="${otherValue}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;" placeholder="Please specify your purpose">
            </div>

        </div>
    `;

    // --- 2. THE NEW PRINTABLE CERTIFICATE ---
    const certificatePaper = `
    <div class="certificate-paper with-watermark">

        <!-- Calling the updated Header -->
        ${typeof getCertificateHeader === 'function' ? getCertificateHeader() : ''}

        <div class="cert-title" style="margin-bottom: 15px;">
            DELIVERY / PARKING CLEARANCE
        </div>
        
        <div class="cert-greeting" style="margin-bottom: 10px;">
            TO WHOM IT MAY CONCERN:
        </div>
        
        <!-- Updated Body: Perfect Alignment & Smart Shrinking WITHOUT Ellipses -->
        <div class="cert-body">
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                This is to certify that 
                <span style="${companyBoxStyle}">
                    <strong id="lbl_company_name_${recordId}" style="${companyTextStyle} text-transform: uppercase;">${companyName}</strong>
                </span> 
                is hereby granted clearance for delivery and temporary parking operations located at 
                <span style="${locationBoxStyle}">
                    <strong id="lbl_location_${recordId}" style="${locationTextStyle} text-transform: uppercase;">${location}</strong>
                </span>.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                The authorized schedule for this activity is from 
                <span style="${dateBoxStyle}">
                    <strong id="lbl_date_from_to_${recordId}" style="${dateTextStyle}">${dateRange}</strong>
                </span>, 
                between 
                <span style="${timeFromBoxStyle}">
                    <strong id="lbl_time_from_${recordId}" style="${timeTextStyle}">${timeFrom}</strong>
                </span> 
                to 
                <span style="${timeToBoxStyle}">
                    <strong id="lbl_time_to_${recordId}" style="${timeTextStyle}">${timeTo}</strong>
                </span>, 
                for the registered vehicle(s) with plate number(s): 
                <span style="${vehicleBoxStyle}">
                    <strong id="lbl_vehicle_plate_number_${recordId}" style="${vehicleTextStyle} text-transform: uppercase;">${vehiclePlates}</strong>
                </span>.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                This clearance is issued for 
                <span style="${purposeBoxStyle}">
                    <strong id="lbl_purpose_${recordId}" style="${purposeTextStyle} text-transform: uppercase;">${fullPurpose.trim()}</strong>
                </span>. 
                The applicant must ensure that traffic flow is not unduly hampered during the operation.
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