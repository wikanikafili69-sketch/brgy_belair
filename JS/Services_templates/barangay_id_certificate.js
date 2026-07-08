// JS/Services_templates/barangay_id_certificate.js

function getBarangayIdHTML(data, dateStr) {
    let recordId = data.id || data.request_id || data.barangay_id;
    if (!recordId) {
        for (let key in data) {
            if (key.toLowerCase().endsWith('id') && key !== 'queue_number') { recordId = data[key]; break; }
        }
    }

    let photoSrc = data.photo_path ? '../' + data.photo_path : (data.photo || '');
    const photoDisplay = photoSrc ? 'block' : 'none';

    // Safely grab globals
    const brgyName = typeof CERT_BARANGAY !== 'undefined' ? CERT_BARANGAY : 'Barangay TEST';
    const munName = typeof CERT_MUNICIPALITY !== 'undefined' ? CERT_MUNICIPALITY : 'Municipality of Cataingan';
    const provName = typeof CERT_PROVINCE !== 'undefined' ? CERT_PROVINCE : 'Province of Masbate';
    const logoPath = typeof CERT_LOGO_PATH !== 'undefined' ? CERT_LOGO_PATH : '../Images/BARANGAY_ICON.png';

    // =====================================================================
    // 🧠 SMART SHRINKING FOR STRICT ID CARD DIMENSIONS
    // =====================================================================
    const fullName = data.full_name || data.fullname || '';
    const address = data.address || '';
    const emergencyName = data.emergency_contact_name || data.emergency_name || '';

    // ID Cards have very tight spaces. We dynamically shrink the font and force wrapping
    // so long names/addresses don't push the ID card out of its 3.375in x 2.125in boundaries!
    const nameTextStyle = `color: #0f172a; text-transform: uppercase; word-break: break-word; line-height: 1.1; display: block; font-size: ${fullName.length > 20 ? '0.5rem' : '0.65rem'};`;
    
    const addressTextStyle = `color: #0f172a; text-transform: uppercase; word-break: break-word; line-height: 1.1; display: block; font-size: ${address.length > 30 ? '0.38rem' : '0.5rem'};`;
    
    const emergencyNameStyle = `text-transform: uppercase; word-break: break-word; font-size: ${emergencyName.length > 25 ? '0.38rem' : 'inherit'};`;

   // --- 1. THE CLEAN EDIT FORM (Untouched) ---
    const editForm = `
        <div id="editFormPanel_${recordId}" class="edit-form-panel no-print hidden" style="background: #ffffff; padding: 20px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 20px; text-align: left;">
            
            <h4 style="margin: 0 0 16px 0; font-size: 1rem; color: var(--navy); border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                <i class="fa-solid fa-id-card" style="color: var(--blue); margin-right: 6px;"></i> Edit Barangay ID Details
            </h4>

            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px; padding: 15px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
                <div style="width: 100px; height: 100px; border-radius: 8px; background: #e2e8f0; overflow: hidden; border: 2px solid #cbd5e1; flex-shrink: 0;">
                    <img id="staff_photo_preview_${recordId}" src="${photoSrc}" style="width: 100%; height: 100%; object-fit: cover; display: ${photoDisplay};">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 8px;">RESIDENT PHOTO</label>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <button type="button" onclick="window.openStaffCamera(${recordId})" style="background: #2c57e5; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; height: 36px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fa-solid fa-camera"></i> Take Photo
                            </button>
                            <label style="background: #ffffff; color: var(--text-dark); border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin: 0; height: 36px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fa-solid fa-upload"></i> Upload
                                <input type="file" accept="image/*" style="display: none;" onchange="window.handleStaffPhotoUpload(this, ${recordId})">
                            </label>
                        </div>
                        <div style="font-size: 11px; color: #ef4444; font-weight: 600;">
                            ⚠️ Max file size: 10MB only
                        </div>
                    </div>
                    <input type="hidden" name="new_photo_base64" id="new_photo_base64_${recordId}" class="edit-input">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Personal Information</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">FULL NAME <span style="color: red;">*</span></label>
                    <input type="text" name="full_name" class="edit-input" data-required="true" value="${data.full_name || data.fullname || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">BIRTHDATE <span style="color: red;">*</span></label>
                    <input type="date" name="birth_date" class="edit-input" data-required="true" value="${data.birth_date || data.birthdate || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">ADDRESS <span style="color: red;">*</span></label>
                    <input type="text" name="address" class="edit-input" data-required="true" value="${data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="contact_number" class="edit-input" data-required="true" maxlength="11" value="${data.contact_number || data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">EMAIL ADDRESS</label>
                    <input type="email" name="email" class="edit-input" value="${data.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">Emergency Contact</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NAME <span style="color: red;">*</span></label>
                    <input type="text" name="emergency_contact_name" class="edit-input" data-required="true" value="${data.emergency_contact_name || data.emergency_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-mid); display: block; margin-bottom: 4px;">CONTACT NUMBER <span style="color: red;">*</span></label>
                    <input type="tel" name="emergency_contact_number" class="edit-input" data-required="true" maxlength="11" value="${data.emergency_contact_number || data.emergency_number || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                </div>
            </div>
        </div>
    `;

    // --- 2. THE PRINTABLE ID CARD (WITH WATERMARK, LOGO & SMART SHRINKING) ---
    const certificatePaper = `
        <div class="certificate-paper" style="display: flex; flex-direction: column; gap: 20px; justify-content: center; align-items: center; padding: 40px 20px; background: #f1f5f9; font-family: Arial, sans-serif; min-height: auto; width: 100%;">
            
            <!-- FRONT OF ID CARD -->
            <div style="position: relative; width: 3.375in; height: 2.125in; border: 2px solid #cbd5e1; border-radius: 8px; padding: 10px; box-sizing: border-box; background: #fff; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); flex-shrink: 0;">
                
                <!-- Background Watermark -->
                <img src="${logoPath}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); height: 80%; opacity: 0.1; z-index: 0; pointer-events: none;" onerror="this.style.display='none';">

                <!-- Ensure Content stays above the watermark -->
                <div style="position: relative; z-index: 1;">
                    <!-- Header with Official Logo -->
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; border-bottom: 2px solid #2c57e5; padding-bottom: 4px;">
                        <img src="${logoPath}" style="width: 28px; height: 28px; object-fit: contain;" onerror="this.style.display='none';">
                        <div style="text-align: center; font-size: 0.45rem; font-weight: bold; line-height: 1.2;">
                            REPUBLIC OF THE PHILIPPINES<br>
                            <span style="text-transform: uppercase;">${brgyName}, ${munName}</span><br>
                            <span style="color: #2c57e5; font-size: 0.6rem;">BARANGAY RESIDENT ID</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <div style="width: 0.9in; height: 0.9in; border: 1px solid #94a3b8; background: #e2e8f0; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                            <img id="paper_photo_${recordId}" src="${photoSrc}" style="width: 100%; height: 100%; object-fit: cover; display: ${photoDisplay};">
                        </div>
                        
                        <div style="font-size: 0.5rem; line-height: 1.3; flex: 1;">
                            <div style="margin-bottom: 4px;">
                                <span style="color: #64748b; font-size: 0.38rem;">NAME</span><br>
                                <strong id="lbl_full_name_${recordId}" style="${nameTextStyle}">${fullName}</strong>
                            </div>
                            <div style="margin-bottom: 4px;">
                                <span style="color: #64748b; font-size: 0.38rem;">ADDRESS</span><br>
                                <strong id="lbl_address_${recordId}" style="${addressTextStyle}">${address}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <div>
                                    <span style="color: #64748b; font-size: 0.38rem;">BIRTHDATE</span><br>
                                    <strong id="lbl_birth_date_${recordId}" style="color: #0f172a; text-transform: uppercase;">${data.birth_date || data.birthdate || ''}</strong>
                                </div>
                                <div style="text-align: right;">
                                    <span style="color: #64748b; font-size: 0.38rem;">ID NO.</span><br>
                                    <strong style="color: #ef4444;">${data.queue_number || ''}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BACK OF ID CARD -->
            <div style="position: relative; width: 3.375in; height: 2.125in; border: 2px solid #cbd5e1; border-radius: 8px; padding: 10px; box-sizing: border-box; background: #fff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px rgba(0,0,0,0.05); flex-shrink: 0; overflow: hidden;">
                
                <!-- Background Watermark -->
                <img src="${logoPath}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); height: 80%; opacity: 0.08; z-index: 0; pointer-events: none;" onerror="this.style.display='none';">
                
                <!-- Ensure Content stays above the watermark -->
                <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="text-align: center; font-size: 0.45rem; line-height: 1.3;">
                        <strong style="font-size: 0.5rem; color: #ef4444; text-decoration: underline;">IN CASE OF EMERGENCY, NOTIFY:</strong>
                        <div style="margin-top: 4px;">
                            <strong>Name:</strong> <span id="lbl_emergency_contact_name_${recordId}" style="${emergencyNameStyle}">${emergencyName}</span><br>
                            <strong>Contact No:</strong> <span id="lbl_emergency_contact_number_${recordId}">${data.emergency_contact_number || data.emergency_number || ''}</span>
                        </div>
                    </div>

                    <div style="font-size: 0.38rem; text-align: center; color: #475569; margin: 4px 0; line-height: 1.2;">
                        This card is non-transferable and serves as proof of residency. Must be surrendered upon moving out of the barangay. If found, please return to <span style="font-weight: bold;">${brgyName}</span> Hall.
                    </div>
                </div>
            </div>
        </div>
    `;

    return editForm + certificatePaper;
}