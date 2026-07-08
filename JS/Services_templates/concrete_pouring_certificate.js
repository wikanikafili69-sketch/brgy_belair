// JS/Services_templates/concrete_pouring_certificate.js

function getConcretePouringHTML(data, dateStr) {
    // Safely extract the record ID for dynamic targeting
    let recordId = data.id || data.request_id || data.concrete_id;
    if (!recordId) {
        for (let key in data) {
            if (key.toLowerCase().endsWith('id') && key !== 'queue_number') { recordId = data[key]; break; }
        }
    }

    // Map data fields (Handles differences between frontend cart and backend database)
    const companyName = data.company_name || data.requestor_name || '';
    const purpose = data.purpose || '';
    const location = data.location || '';
    const dateRange = data.date_from_to || data.date_range || '';
    const timeFrom = data.time_from || '';
    const timeTo = data.time_to || '';
    const vehicles = data.vehicles || '';
    const phone = data.contact_number || data.phone || '';

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
    
    // BOX STYLE: Forces the underline to align perfectly with the surrounding text baseline
    const boxStyleBase = `display: inline-block; vertical-align: bottom; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;`;
    
    // Dynamically calculate font sizes and max-widths based on length (NO ELLIPSIS)
    const companyBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const companyTextStyle = `white-space: normal; word-break: break-word; font-size: ${companyName.length > 25 ? '0.75rem' : '1.15rem'};`;

    const locationBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const locationTextStyle = `white-space: normal; word-break: break-word; font-size: ${location.length > 30 ? '0.75rem' : '1.15rem'};`;

    const dateBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 250px;`;
    const dateTextStyle = `white-space: normal; word-break: break-word; font-size: ${dateRange.length > 20 ? '0.75rem' : '1.15rem'};`;

    const timeFromBoxStyle = `${boxStyleBase} min-width: 80px; max-width: 120px;`;
    const timeToBoxStyle = `${boxStyleBase} min-width: 80px; max-width: 120px;`;
    const timeTextStyle = `white-space: normal; font-size: 1.15rem;`;

    const vehicleBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 300px;`;
    const vehicleTextStyle = `white-space: normal; word-break: break-word; font-size: ${vehicles.length > 25 ? '0.75rem' : '1.15rem'};`;


    // --- 1. THE CLEAN EDIT FORM ---
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-truck-monster" style="color: var(--blue); margin-right: 6px;"></i> Edit Concrete Pouring Details
            </h4>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Requestor Information</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">COMPANY NAME <span style="color: red;">*</span></label>
                    <input type="text" name="company_name" class="edit-input" data-required="true" value="${companyName}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">PURPOSE <span style="color: red;">*</span></label>
                    <input type="text" name="purpose" class="edit-input" data-required="true" value="${purpose}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">LOCATION <span style="color: red;">*</span></label>
                    <input type="text" name="location" class="edit-input" data-required="true" value="${location}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Schedule & Logistics</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">DATE (FROM - TO) <span style="color: red;">*</span></label>
                    <input type="text" name="date_from_to" id="edit_date_range_${recordId}" class="edit-input" data-required="true" value="${dateRange}" placeholder="Select Start & End Date" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; cursor: pointer;">
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">TIME FROM <span style="color: red;">*</span></label>
                        <input type="time" name="time_from" class="edit-input" data-required="true" value="${timeFrom}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    </div>
                    <span style="font-size: 0.85rem; font-weight: 700; color: #475569; margin-top: 20px;">to</span>
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">TIME TO <span style="color: red;">*</span></label>
                        <input type="time" name="time_to" class="edit-input" data-required="true" value="${timeTo}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">VEHICLE(S) <span style="color: red;">*</span></label>
                    <input type="text" name="vehicles" class="edit-input" data-required="true" value="${vehicles}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="contact_number" class="edit-input" data-required="true" maxlength="11" value="${phone}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>
        </div>
    `;

    // --- 2. THE PRINTABLE CERTIFICATE ---
    const certificatePaper = `
    <div class="certificate-paper with-watermark">
        
        ${typeof window.getCertificateHeader === 'function' ? window.getCertificateHeader() : ''}

        <div class="cert-title" style="margin-bottom: 15px;">
            CONCRETE POURING CLEARANCE
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
                is hereby granted clearance to conduct concrete pouring activities located at 
                <span style="${locationBoxStyle}">
                    <strong id="lbl_location_${recordId}" style="${locationTextStyle} text-transform: uppercase;">${location}</strong>
                </span>.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                The authorized schedule for this activity is from 
                <span style="${dateBoxStyle}">
                    <strong id="lbl_date_from_to_${recordId}" style="${dateTextStyle} text-transform: uppercase;">${dateRange}</strong>
                </span>, 
                between the hours of 
                <span style="${timeFromBoxStyle}">
                    <strong id="lbl_time_from_${recordId}" style="${timeTextStyle}">${timeFrom}</strong>
                </span> 
                to 
                <span style="${timeToBoxStyle}">
                    <strong id="lbl_time_to_${recordId}" style="${timeTextStyle}">${timeTo}</strong>
                </span>. 
                The vehicles/equipment permitted on site are: 
                <span style="${vehicleBoxStyle}">
                    <strong id="lbl_vehicles_${recordId}" style="${vehicleTextStyle} text-transform: uppercase;">${vehicles}</strong>
                </span>.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                The applicant is advised to strictly observe safety protocols and ensure minimal disruption to the community during the execution of this activity.
            </p>
            
            <p style="text-indent: 50px; margin-bottom: 20px; line-height: 2.2;">
                ISSUED this 
                <span style="display: inline-block; vertical-align: bottom; min-width: 150px; max-width: 250px; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;">
                    <strong>${formattedDate}</strong>
                </span> 
                at ${brgyName}, ${munName}, ${provName}.
            </p>
        </div>
        
        ${typeof window.getCertificateFooter === 'function' ? window.getCertificateFooter() : ''}

    </div>`;

    // --- 3. INIT FLATPICKR AFTER RENDER ---
    setTimeout(() => {
        const dateInput = document.getElementById(`edit_date_range_${recordId}`);
        
        if (dateInput && window.flatpickr) {
            
            // Explicitly force clickability in case the modal's z-index or pointer-events are interfering
            dateInput.addEventListener('mousedown', function(e) {
                e.stopPropagation(); // Stop the modal from stealing focus
            });

            window.flatpickr(dateInput, {
                mode: "range",
                dateFormat: "F j, Y",
                locale: {
                    rangeSeparator: " TO "
                },
                appendTo: document.body, 
                onOpen: function(selectedDates, dateStr, instance) {
                    // Force the calendar to the absolute top layer
                    if (instance.calendarContainer) {
                        instance.calendarContainer.style.setProperty('z-index', '999999999', 'important');
                        instance.calendarContainer.style.setProperty('pointer-events', 'auto', 'important');
                    }
                }
            });
        } else {
             console.error("Flatpickr script is missing from the head/body of the page!");
        }
    }, 250);

    return editForm + certificatePaper;
}