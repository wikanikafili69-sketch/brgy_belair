// JS/Services_templates/business_certificate.js

// Ensure your toggle function is defined
window.toggleEditBizKind = function(radio) {
    const container = radio.closest('.edit-form-panel');
    const kindField = container.querySelector('.edit-biz-kind-field');
    const kindInput = kindField.querySelector('input');
    const isSmall = radio.value.includes('SMALL BUSINESS');

    if (isSmall) {
        kindField.style.display = 'block';
        kindInput.setAttribute('data-required', 'true');
    } else {
        kindField.style.display = 'none';
        kindInput.removeAttribute('data-required');
    }
};

function getBusinessClearanceHTML(data, dateStr) {
    // --- 1. SAFELY HUNT DOWN THE PRIMARY KEY ID ---
    let recordId = data.id || data.request_id || data.business_id;
    if (!recordId) {
        for (let key in data) {
            if (key.toLowerCase().endsWith('id') && key !== 'queue_number' && key !== 'barangay_id') {
                recordId = data[key];
                break;
            }
        }
    }

    // Determine which radio should be checked
    const isPermit = data.clearance_type === 'BUSINESS PERMIT' ? 'checked' : '';
    const isSmall = data.clearance_type === 'SMALL BUSINESS CLEARANCE' ? 'checked' : '';
    const isSmallDti = data.clearance_type === 'SMALL BUSINESS CLEARANCE (DTI)' ? 'checked' : '';
    
    // Determine if "Kind of Business" should be visible
    const isSmallBiz = (data.clearance_type === 'SMALL BUSINESS CLEARANCE' || data.clearance_type === 'SMALL BUSINESS CLEARANCE (DTI)');
    const kindDisplay = isSmallBiz ? 'block' : 'none';

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
    const businessName = data.business_name || 'N/A';
    const ownerName = data.full_name || '';
    const businessAddress = data.business_address || '';
    const kindOfBusiness = data.kind_of_business || 'General Business';
    const businessCategory = data.business_category || 'New';
    const clearanceType = data.clearance_type || 'Business Permit';

    // BOX STYLE: Forces the underline to align perfectly with the surrounding text baseline
    const boxStyleBase = `display: inline-block; vertical-align: bottom; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;`;
    
    // Dynamically calculate font sizes and max-widths based on length (NO ELLIPSIS)
    const bizNameBoxStyle = `${boxStyleBase} min-width: 250px; max-width: 350px;`;
    const bizNameTextStyle = `white-space: normal; word-break: break-word; font-size: ${businessName.length > 25 ? '0.75rem' : '1.15rem'};`;

    const ownerBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const ownerTextStyle = `white-space: normal; word-break: break-word; font-size: ${ownerName.length > 25 ? '0.75rem' : '1.15rem'};`;

    const addressBoxStyle = `${boxStyleBase} min-width: 200px; max-width: 300px;`;
    const addressTextStyle = `white-space: normal; word-break: break-word; font-size: ${businessAddress.length > 35 ? '0.75rem' : '1.15rem'};`;

    const kindBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 250px;`;
    const kindTextStyle = `white-space: normal; word-break: break-word; font-size: ${kindOfBusiness.length > 20 ? '0.75rem' : '1.15rem'};`;

    const typeBoxStyle = `${boxStyleBase} min-width: 150px; max-width: 250px;`;
    const typeTextStyle = `white-space: normal; word-break: break-word; font-size: ${clearanceType.length > 20 ? '0.75rem' : '1.15rem'};`;


    // 1. Build the Clean Edit Form (Untouched)
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-pen-to-square" style="color: var(--blue); margin-right: 6px;"></i> Edit Clearance Details
            </h4>

            <div style="margin-bottom: 16px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 8px;">CLEARANCE TYPE <span style="color: red;">*</span></label>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <label style="font-size: 0.85rem; cursor: pointer;"><input type="radio" name="clearance_type" value="BUSINESS PERMIT" class="edit-input" onchange="window.toggleEditBizKind(this)" ${isPermit}> Business Permit</label>
                    <label style="font-size: 0.85rem; cursor: pointer;"><input type="radio" name="clearance_type" value="SMALL BUSINESS CLEARANCE" class="edit-input" onchange="window.toggleEditBizKind(this)" ${isSmall}> Small Business</label>
                    <label style="font-size: 0.85rem; cursor: pointer;"><input type="radio" name="clearance_type" value="SMALL BUSINESS CLEARANCE (DTI)" class="edit-input" onchange="window.toggleEditBizKind(this)" ${isSmallDti}> Small Business (DTI)</label>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CATEGORY <span style="color: red;">*</span></label>
                    <select name="business_category" class="edit-input" data-required="true" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        <option value="New" ${data.business_category === 'New' ? 'selected' : ''}>New</option>
                        <option value="Renewal" ${data.business_category === 'Renewal' ? 'selected' : ''}>Renewal</option>
                        <option value="Amendment" ${data.business_category === 'Amendment' ? 'selected' : ''}>Amendment</option>
                        <option value="Closure" ${data.business_category === 'Closure' ? 'selected' : ''}>Closure</option>
                    </select>
                </div>
                <div class="edit-biz-kind-field" style="display: ${kindDisplay};">
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">KIND OF BUSINESS <span style="color: red;">*</span></label>
                    <input type="text" name="kind_of_business" class="edit-input" value="${data.kind_of_business || ''}" ${isSmallBiz ? 'data-required="true"' : ''} style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">OWNER NAME <span style="color: red;">*</span></label>
                    <input type="text" name="full_name" class="edit-input" data-required="true" value="${data.full_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">BUSINESS NAME <span style="color: red;">*</span></label>
                    <input type="text" name="business_name" class="edit-input" data-required="true" value="${data.business_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">ADDRESS <span style="color: red;">*</span></label>
                    <input type="text" name="business_address" class="edit-input" data-required="true" value="${data.business_address || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="text" name="contact_number" class="edit-input" data-required="true" value="${data.contact_number || ''}" maxlength="11" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

        </div>
    `;

    // 2. The Printable Certificate Paper
    const certificatePaper = `
        <div class="certificate-paper with-watermark" id="paperView_${recordId}">
            
            <!-- Shared Header -->
            ${typeof getCertificateHeader === 'function' ? getCertificateHeader() : ''}

            <div class="cert-title" style="margin-bottom: 15px;">
                BUSINESS CLEARANCE
            </div>
            
            <div class="cert-greeting" style="margin-bottom: 10px;">
                TO WHOM IT MAY CONCERN:
            </div>
            
            <!-- Updated Body: Perfect Alignment & Smart Shrinking WITHOUT Ellipses -->
            <div class="cert-body">
                <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                    This is to certify that the business establishment named 
                    <span style="${bizNameBoxStyle}">
                        <strong id="lbl_business_name_${recordId}" style="${bizNameTextStyle} text-transform: uppercase;">${businessName}</strong>
                    </span>, 
                    owned and operated by 
                    <span style="${ownerBoxStyle}">
                        <strong id="lbl_full_name_${recordId}" style="${ownerTextStyle} text-transform: uppercase;">${ownerName}</strong>
                    </span>, 
                    and located at 
                    <span style="${addressBoxStyle}">
                        <strong id="lbl_business_address_${recordId}" style="${addressTextStyle} text-transform: uppercase;">${businessAddress}</strong>
                    </span>, 
                    is a registered and compliant business within the territorial jurisdiction of ${brgyName}.
                </p>
                
                <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                    The aforementioned business is classified as a 
                    <span style="${kindBoxStyle}">
                        <strong id="lbl_kind_of_business_${recordId}" style="${kindTextStyle} text-transform: uppercase;">${kindOfBusiness}</strong>
                    </span> 
                    (<span id="lbl_business_category_${recordId}">${businessCategory}</span>).
                </p>
                
                <p style="text-indent: 50px; margin-bottom: 15px; line-height: 2.2;">
                    This clearance is hereby issued upon the request of the interested party for 
                    <span style="${typeBoxStyle}">
                        <strong id="lbl_clearance_type_${recordId}" style="${typeTextStyle} text-transform: uppercase;">${clearanceType}</strong>
                    </span> 
                    purposes and for whatever legal intents it may serve.
                </p>
                
                <p style="text-indent: 50px; margin-bottom: 20px; line-height: 2.2;">
                    ISSUED this 
                    <span style="display: inline-block; vertical-align: bottom; min-width: 150px; max-width: 250px; border-bottom: 1px solid #000; text-align: center; padding: 0 8px; margin: 0 4px; line-height: 1.1;">
                        <strong>${formattedDate}</strong>
                    </span> 
                    at ${brgyName}, ${munName}, ${provName}.
                </p>
            </div>

            <!-- Shared Footer -->
            ${typeof getCertificateFooter === 'function' ? getCertificateFooter(data) : ''}
            
        </div>
    `;

    return editForm + certificatePaper;
}