/**
 * forms.js - Gestion du formulaire d'inscription
 * CORRECTION : Les fichiers sont convertis en base64 et sauvegardÃ©s dans documents[]
 * pour Ãªtre visibles dans le dashboard admin.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Forms.js chargÃ©');
    initRegistrationForm();
    populateSportsFields();
    initFileUploads();
    initDateTextInputs();
    initPasswordToggles();
    initModals();

    setTimeout(() => {
        const userType = document.getElementById('userType');
        if (userType && userType.value === 'parent') ajouterEnfant();
    }, 500);
});

/* =========================================================
   LECTURE DES FICHIERS EN BASE64
   ========================================================= */

/**
 * Convertit un objet File en { name, dataUrl, mimeType, size }
 */
function readFileAsBase64(file, options = {}) {
    return new Promise((resolve, reject) => {
        if (!file || typeof file !== 'object' || !file.name) {
            reject(new Error('Fichier invalide')); return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
            const mimeType = file.type || '';
            if (options.compressImage && mimeType.startsWith('image/')) {
                const img = new Image();
                img.onload = () => {
                    const maxSize = options.maxSize || 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > height && width > maxSize) {
                        height = Math.round(height * maxSize / width);
                        width = maxSize;
                    } else if (height > width && height > maxSize) {
                        width = Math.round(width * maxSize / height);
                        height = maxSize;
                    } else if (width > maxSize) {
                        width = height = maxSize;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const quality = typeof options.quality === 'number' ? options.quality : 0.75;
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve({
                        name: file.name,
                        dataUrl,
                        mimeType: 'image/jpeg',
                        size: formatFileSize(Math.round(dataUrl.length * 3 / 4))
                    });
                };
                img.onerror = () => reject(new Error("Impossible de charger l'image : " + file.name));
                img.src = e.target.result;
            } else {
                resolve({
                    name:     file.name,
                    dataUrl:  e.target.result,
                    mimeType: mimeType,
                    size:     formatFileSize(file.size || 0)
                });
            }
        };
        reader.onerror = () => reject(new Error('Impossible de lire : ' + file.name));
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024)        return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function sanitizeStoredUsers(users) {
    if (!Array.isArray(users)) return [];
    return users.map(user => {
        if (user && Array.isArray(user.documents)) {
            user.documents = user.documents.map(doc => {
                if (doc && typeof doc === 'object') {
                    delete doc.preview;
                    if (doc.dataUrl && typeof doc.dataUrl === 'string' && doc.dataUrl.length > 220000) {
                        delete doc.dataUrl;
                    }
                }
                return doc;
            });
        }
        if (user && user.files && typeof user.files === 'object') {
            Object.entries(user.files).forEach(([key, file]) => {
                if (file && typeof file === 'object') {
                    delete file.dataUrl;
                    delete file.preview;
                }
            });
        }
        return user;
    });
}

/**
 * Parcourt tous les inputs[type=file] visibles et retourne
 * un tableau documents[] compatible avec le dashboard admin.
 */
async function collectAllDocuments(userType) {
    // Correspondance id-input => label lisible dans le dashboard
    const fileLabels = {
        diplomeCoach:             "DiplÃ´me d'entraÃ®neur",
        certificatMedicalCoach:   'Certificat mÃ©dical',
        photoCoach:               'Photo professionnelle',
        extraitNaissanceCoach:    'Extrait de naissance',
        certificatMedicalAthlete: 'Certificat mÃ©dical',
        photoAthlete:             "Photo d'identitÃ©",
        extraitNaissanceAthlete:  'Extrait de naissance'
    };

    const documents = [];
    const today = new Date().toISOString().split('T')[0];
    const maxDataUrlBytes = 1000000;

    // â”€â”€ Fichiers simples (1 par champ) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const [inputId, label] of Object.entries(fileLabels)) {
        const input = document.getElementById(inputId);
        const fileCount = input && input.files && input.files.length ? input.files.length : 0;
        if (!input || isElementHidden(input) || !fileCount) continue;
        try {
            const file = input.files[0];
            const isProfilePhoto = inputId === 'photoCoach' || inputId === 'photoAthlete';
            const documentItem = {
                id:       Date.now() + Math.random(),
                name:     label,
                fileName: file.name,
                mimeType: file.type || '',
                size:     formatFileSize(file.size || 0),
                date:     today,
                verified: false,
                source:   'inscription',
                dataUrl:  null
            };

            const isImage = file.type.startsWith('image/');
            const shouldStoreData = isImage;
            if (shouldStoreData) {
                const fd = await readFileAsBase64(file, { compressImage: isImage, maxSize: isProfilePhoto ? 300 : 600, quality: isProfilePhoto ? 0.65 : 0.75 });
                if (fd && fd.dataUrl) {
                    documentItem.mimeType = fd.mimeType || documentItem.mimeType;
                    documentItem.size = fd.size || documentItem.size;
                    documentItem.dataUrl = fd.dataUrl;
                }
            }

            documents.push(documentItem);
        } catch (e) { console.warn('Erreur lecture', inputId, e); }
    }

    // â”€â”€ Fichiers enfants (plusieurs blocs possibles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (userType === 'parent') {
        let idx = 1;
        for (const form of document.querySelectorAll('.enfant-form')) {
            const childFields = {
                certificatMedicalEnfant: `Certificat mÃ©dical â€” Enfant ${idx}`,
                photoEnfant:             `Photo â€” Enfant ${idx}`,
                extraitNaissanceEnfant:  `Extrait de naissance â€” Enfant ${idx}`,
                permissionParentale:     `Permission parentale â€” Enfant ${idx}`
            };
            for (const [base, label] of Object.entries(childFields)) {
                const input = form.querySelector(`input[id^="${base}"], input[name^="${base}"]`);
                const fileCount = input && input.files && input.files.length ? input.files.length : 0;
                if (!input || !fileCount) continue;
                try {
                    const file = input.files[0];
                    const isChildPhoto = base === 'photoEnfant';
                    const documentItem = {
                        id:       Date.now() + Math.random(),
                        name:     label,
                        fileName: file.name,
                        mimeType: file.type || '',
                        size:     formatFileSize(file.size || 0),
                        date:     today,
                        verified: false,
                        source:   'inscription',
                        dataUrl:  null
                    };
                    const isImage = file.type.startsWith('image/');
                    const shouldStoreData = isImage;
                    if (shouldStoreData) {
                        const fd = await readFileAsBase64(file, { compressImage: isImage, maxSize: isChildPhoto ? 300 : 600, quality: 0.75 });
                        if (fd && fd.dataUrl) {
                            documentItem.dataUrl = fd.dataUrl;
                            documentItem.mimeType = fd.mimeType;
                            documentItem.size = fd.size;
                        }
                    }
                    documents.push(documentItem);
                } catch (e) { console.warn('Erreur lecture enfant', base, e); }
            }
            idx++;
        }
    }

    return documents;
}

/* =========================================================
   FORMULAIRE D'INSCRIPTION
   ========================================================= */

function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) { console.error('Formulaire non trouvÃ©'); return; }

    setMaxDateForBirthFields();

    // Cartes de type
    const cards  = document.querySelectorAll('.user-type-card');
    const select = document.getElementById('userType');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.dataset.type;
            if (select) select.value = type;
            cards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            showRoleFields(type);
            if (type === 'parent') {
                const c = document.getElementById('enfantsContainer');
                if (c && !c.children.length) ajouterEnfant();
            }
        });
    });
    select?.addEventListener('change', function() {
        cards.forEach(c => c.classList.toggle('selected', c.dataset.type === this.value));
        showRoleFields(this.value);
    });

    // Suivant
    form.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const cur  = btn.closest('.form-step');
            const next = document.getElementById(btn.dataset.next);
            if (cur && next && validateStep(cur)) {
                cur.classList.remove('active');
                next.classList.add('active');
                if (btn.dataset.next === 'stepSpecific') setTimeout(setMaxDateForBirthFields, 100);
                scrollToElement(next);
            }
        });
    });

    // PrÃ©cÃ©dent
    form.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const cur  = btn.closest('.form-step');
            const prev = document.getElementById(btn.dataset.prev);
            if (cur && prev) {
                cur.classList.remove('active');
                prev.classList.add('active');
                scrollToElement(prev);
            }
        });
    });

    setupMaladieToggle('hasMaladieCoach',   'nomMaladieCoach');
    setupMaladieToggle('hasMaladieAthlete', 'nomMaladieAthlete');
    document.getElementById('ajouterEnfant')?.addEventListener('click', ajouterEnfant);

    // â”€â”€ SOUMISSION ASYNC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const currentStep = document.querySelector('.form-step.active');
        if (!validateStep(currentStep)) {
            showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
            return;
        }

        const userType = document.getElementById('userType')?.value;

        if (userType === 'parent' && !document.querySelectorAll('.enfant-form').length) {
            showNotification('Veuillez ajouter au moins un enfant', 'error');
            return;
        }

        // Bloquer le bouton
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        }

        try {
            // 1. DonnÃ©es texte
            const userData = {};
            for (const [key, value] of new FormData(form).entries()) {
                if (value instanceof File) continue; // fichiers gÃ©rÃ©s sÃ©parÃ©ment
                if (key.endsWith('[]')) {
                    const k = key.slice(0, -2);
                    userData[k] = userData[k] || [];
                    userData[k].push(value);
                } else {
                    userData[key] = value;
                }
            }

            // 2. MÃ©tadonnÃ©es
            userData.id               = Date.now();
            userData.role             = userType;
            userData.userType         = userType;
            userData.dateNaissance    = normalizeStorageDate(userData.dateNaissance);
            userData.status           = userType === 'admin' ? 'active' : 'pending';
            userData.registrationDate = new Date().toISOString();
            userData.createdAt        = new Date().toISOString();
            userData.lastLogin        = null;

            // 3. Infos par rÃ´le
            if (userType === 'coach') {
                userData.sport      = document.getElementById('sportCoach')?.value;
                userData.specialite = userData.sport;
                userData.ccp        = document.getElementById('ccpCoach')?.value;
                userData.hasMaladie = document.getElementById('hasMaladieCoach')?.checked || false;
                if (userData.hasMaladie)
                    userData.nomMaladie = document.getElementById('nomMaladieCoach')?.value;
            }
            if (userType === 'athlete') {
                userData.sport      = document.getElementById('sportAthlete')?.value;
                userData.niveau     = document.getElementById('niveauAthlete')?.value;
                userData.hasMaladie = document.getElementById('hasMaladieAthlete')?.checked || false;
                if (userData.hasMaladie)
                    userData.nomMaladie = document.getElementById('nomMaladieAthlete')?.value;
            }
            if (userType === 'admin') {
                userData.adminFunction = document.getElementById('adminFunction')?.value;
                userData.codeOption    = document.getElementById('codeOptionAdmin')?.value;
            }
            if (userType === 'parent') {
                userData.enfants = getEnfantsData();
            }

            // 4. â˜… CONVERSION DES FICHIERS EN BASE64 â˜…
            showNotification('Lecture des fichiers en coursâ€¦', 'info');
            const documents = await collectAllDocuments(userType);
            const profileDoc = Array.isArray(documents)
                ? documents.find(d => /photo/i.test(d.name) && d.dataUrl && d.dataUrl.startsWith('data:image'))
                : null;
            if (profileDoc && profileDoc.dataUrl) {
                userData.profilePicture = profileDoc.dataUrl;
            }
            userData.documents = Array.isArray(documents) ? documents : [];
            console.log(`âœ… ${userData.documents.length} document(s) enregistrÃ©(s) avec contenu pour tÃ©lÃ©chargement`);

            // 5. Nettoyer le stockage ancien avant nouvelle sauvegarde
            let users = sanitizeStoredUsers(JSON.parse(localStorage.getItem('users') || '[]'));
            try {
                localStorage.setItem('users', JSON.stringify(users));
            } catch (cleanError) {
                console.warn('Impossible de nettoyer le stockage avant enregistrement :', cleanError);
                try {
                    localStorage.removeItem('users');
                    localStorage.setItem('users', JSON.stringify(users));
                    console.info('Ancien stockage des utilisateurs supprimÃ©, nouvelle valeur Ã©crite.');
                } catch (resetError) {
                    console.error('RÃ©initialisation du stockage des utilisateurs impossible :', resetError);
                }
            }
            if (users.find(u => u.email === userData.email)) {
                showNotification('Cet email est dÃ©jÃ  utilisÃ©.', 'error');
                submitBtn && (submitBtn.disabled = false, submitBtn.innerHTML = "S'inscrire");
                return;
            }

            // 6. Sauvegarde localStorage
            users.push(userData);
            try {
                localStorage.setItem('users', JSON.stringify(users));
            } catch (storageError) {
                console.error('Erreur stockage localStorage:', storageError);
                try {
                    localStorage.removeItem('users');
                    localStorage.setItem('users', JSON.stringify(users));
                    console.info('Ancienne clÃ© users rÃ©initialisÃ©e puis rÃ©Ã©crite.');
                } catch (retryError) {
                    console.error('Nouvelle tentative Ã©chouÃ©e:', retryError);
                    showNotification('Espace de stockage local plein. RÃ©duisez la taille des fichiers ou utilisez un autre navigateur.', 'error');
                    submitBtn && (submitBtn.disabled = false, submitBtn.innerHTML = "S'inscrire");
                    return;
                }
            }

            // 7. Session
            localStorage.setItem('currentSession', JSON.stringify({
                id: userData.id, nom: userData.nom, prenom: userData.prenom,
                email: userData.email, role: userData.role, userType: userData.userType,
                sport: userData.sport || null, niveau: userData.niveau || null,
                profilePicture: userData.profilePicture || null
            }));

            // 8. SuccÃ¨s
            const docsMsg = documents.length ? ` (${documents.length} document(s) enregistrÃ©(s))` : '';
            showNotification(`Inscription rÃ©ussie en tant que ${getRoleLabel(userType)}${docsMsg} ! Redirectionâ€¦`, 'success');
            setTimeout(() => redirectToUserSpace(userType), 2500);

        } catch (err) {
            console.error('Erreur inscription :', err?.message || err, err?.stack || '');
            showNotification(`Erreur lors du traitement des fichiers. ${err?.message || 'RÃ©essayez.'}`, 'error');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = "S'inscrire"; }
        }
    });
}

/* =========================================================
   DATES
   ========================================================= */

function setMaxDateForBirthFields() {
    const t = new Date();
    const y = t.getFullYear(), m = String(t.getMonth()+1).padStart(2,'0'), d = String(t.getDate()).padStart(2,'0');
    const adultMax = `${y-18}-${m}-${d}`, adultMin = `${y-100}-${m}-${d}`;
    const childMax = `${y-3}-${m}-${d}`,  childMin  = `${y-18}-${m}-${d}`;

    const dn = document.getElementById('dateNaissance');
    if (dn) {
        dn.dataset.maxDate = adultMax;
        dn.dataset.minDate = adultMin;
        const info = document.getElementById('dateNaissanceInfo');
        if (info) info.innerHTML = `<i class="fas fa-info-circle"></i> Âge minimum requis : 18 ans`;
    }
    document.querySelectorAll('[id^="dateNaissanceEnfant"]').forEach(f => {
        f.dataset.maxDate = childMax;
        f.dataset.minDate = childMin;
        let msg = f.closest('.form-group')?.querySelector('.date-info-child');
        if (!msg) {
            msg = document.createElement('small');
            msg.className = 'date-info-child';
            msg.style.cssText = 'display:block;color:#6c757d;font-size:.85rem;margin-top:5px;';
            f.closest('.form-group')?.appendChild(msg);
        }
        msg.innerHTML = `<i class="fas fa-info-circle"></i> Ã‚ge requis : 3 Ã  18 ans (${y-18}â€“${y-3})`;
    });
}

function validateBirthDate(dateString, isChild = false) {
    if (!dateString) return false;
    try {
        const birth = window.ManarDate?.parse(dateString);
        if (!birth || isNaN(birth.getTime())) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        if (birth > today) return false;
        let age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() ||
           (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
        return isChild ? (age >= 3 && age <= 18) : (age >= 18);
    } catch { return false; }
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateField(field) {
    if (!field || isElementHidden(field)) return true;
    clearFieldError(field);
    const val = (field.value || '').trim();

    if (field.required) {
        if (field.type === 'file' && !field.files?.length) {
            showFieldError(field, 'Ce fichier est obligatoire'); return false;
        } else if (field.type !== 'file' && !val) {
            showFieldError(field, 'Ce champ est obligatoire'); return false;
        }
    }
    if (!val && !field.required) return true;

    if (field.type === 'email' && !validateEmail(val))   { showFieldError(field, 'Email invalide'); return false; }
    if (field.type === 'tel'   && !validatePhone(val))   { showFieldError(field, 'NumÃ©ro invalide (ex: 0550123456)'); return false; }
    const isDateField = field.dataset.dateFormat === 'dd/mm/yyyy';
    if (isDateField) {
        if (!validateDate(val)) { showFieldError(field, 'Date invalide'); return false; }
        if (field.name?.includes('dateNaissance')) {
            const isChild = field.name.includes('Enfant');
            if (!validateBirthDate(val, isChild)) {
                showFieldError(field, isChild ? 'L\'enfant doit avoir entre 3 et 18 ans' : 'Vous devez avoir au moins 18 ans');
                return false;
            }
        }
    }
    if (field.type === 'password' && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val))     { showFieldError(field, 'Au moins 8 caractères, une majuscule, une minuscule et un chiffre.'); return false; }
    if (field.id === 'confirmPassword') {
        if (val !== (document.getElementById('password')?.value || '')) {
            showFieldError(field, 'Les mots de passe ne correspondent pas'); return false;
        }
    }
    if ((field.name === 'codeOptionAdmin' || field.name === 'codeOptionCoach') && !validateCodeOption(field.name, val)) {
        showFieldError(field, field.name === 'codeOptionAdmin'
            ? 'Code d’accès administrateur invalide pour le rôle sélectionné.'
            : 'Code d’option invalide.');
        return false;
    }
    if (field.name === 'ccpCoach' && !validateCCP(val)) {
        showFieldError(field, 'Format CCP invalide (000-000-000-000)'); return false;
    }
    return true;
}

function validateStep(step) {
    if (!step) return false;
    let ok = true, first = null;
    step.querySelectorAll('input[required], select[required], textarea[required]').forEach(f => {
        if (!isElementHidden(f) && !validateField(f)) { ok = false; if (!first) first = f; }
    });
    if (!ok && first) { scrollToElement(first); showNotification('Veuillez remplir tous les champs obligatoires', 'error'); }
    return ok;
}

function isElementHidden(el) {
    if (!el) return true;
    let node = el;
    while (node) {
        const s = window.getComputedStyle(node);
        if (s.display === 'none' || s.visibility === 'hidden') return true;
        node = node.parentElement;
    }
    return false;
}

function showFieldError(field, msg) {
    field.classList.add('error');
    field.style.borderColor = '#dc3545'; field.style.backgroundColor = '#fff8f8';
    field.parentElement.querySelector('.field-error')?.remove();
    const err = document.createElement('div');
    err.className = 'field-error';
    err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    field.parentElement.appendChild(err);
}

function clearFieldError(field) {
    field.classList.remove('error');
    field.style.borderColor = field.style.backgroundColor = '';
    field.parentElement.querySelector('.field-error')?.remove();
}

/* =========================================================
   RÃ”LE / CHAMPS SPÃ‰CIFIQUES
   ========================================================= */

function showRoleFields(role) {
    document.querySelectorAll('.role-fields').forEach(f => {
        f.style.display = 'none';
        f.querySelectorAll('[required]').forEach(i => i.required = false);
    });
    if (!role) return;
    const sp = document.getElementById(role + 'Fields');
    if (sp) {
        sp.style.display = 'block';
        sp.querySelectorAll('[required]').forEach(i => i.required = true);
        if (role === 'parent') setTimeout(setMaxDateForBirthFields, 100);
    }
}

function getSportsList() {
    const storedSports = JSON.parse(localStorage.getItem('sportsData') || '[]');
    const sports = Array.isArray(storedSports) && storedSports.length
        ? storedSports.map((sport) => String(sport.name || '').trim()).filter(Boolean)
        : ['Football', 'Basketball', 'Volleyball', 'Handball', 'Natation', 'Athlétisme', 'Judo', 'Karaté', 'Tennis', 'Gymnastique'];

    return [...new Set(sports)];
}

function renderSportsOptions(selectedValue = '') {
    return getSportsList().map((sport) => {
        const selected = sport === selectedValue ? ' selected' : '';
        return `<option value="${sport}"${selected}>${sport}</option>`;
    }).join('');
}

function populateSportsFields() {
    const targets = ['sportCoach', 'sportAthlete'];
    targets.forEach((id) => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = `<option value="">Sélectionnez un sport</option>${renderSportsOptions(currentValue)}`;
        if (currentValue) select.value = currentValue;
    });
}

function setupMaladieToggle(cbId, inputId) {
    const cb = document.getElementById(cbId), ip = document.getElementById(inputId);
    if (cb && ip) cb.addEventListener('change', function() {
        ip.style.display = this.checked ? 'block' : 'none';
        ip.required = this.checked;
        if (!this.checked) ip.value = '';
    });
}

/* =========================================================
   ENFANTS (parent)
   ========================================================= */

function getEnfantsData() {
    return Array.from(document.querySelectorAll('.enfant-form')).map((form, i) => ({
        id:            Date.now() + i,
        nom:           form.querySelector('[name="nomEnfant[]"]')?.value           || '',
        prenom:        form.querySelector('[name="prenomEnfant[]"]')?.value        || '',
        dateNaissance: normalizeStorageDate(form.querySelector('[name="dateNaissanceEnfant[]"]')?.value || ''),
        sexe:          form.querySelector('[name="sexeEnfant[]"]')?.value          || '',
        sport:         form.querySelector('[name="sportEnfant[]"]')?.value         || '',
        niveau:        'debutant',
        hasMaladie:    form.querySelector('[name="hasMaladieEnfant[]"]')?.checked  || false,
        nomMaladie:    form.querySelector('[name="nomMaladieEnfant[]"]')?.value     || ''
    }));
}

function ajouterEnfant() {
    const container = document.getElementById('enfantsContainer');
    if (!container) return;
    const n = container.children.length + 1;
    const t = new Date(), y = t.getFullYear(), m = String(t.getMonth()+1).padStart(2,'0'), d = String(t.getDate()).padStart(2,'0');

    container.insertAdjacentHTML('beforeend', `
        <div class="enfant-form" id="enfant-form-${n}">
            <button type="button" class="btn-remove-enfant" onclick="this.closest('.enfant-form').remove()">
                <i class="fas fa-times-circle"></i>
            </button>
            <h5><i class="fas fa-child"></i> Enfant ${n}</h5>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Nom *</label>
                    <input type="text" name="nomEnfant[]" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">PrÃ©nom *</label>
                    <input type="text" name="prenomEnfant[]" class="form-control" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Date de naissance *</label>
                    <input type="text" id="dateNaissanceEnfant${n}" name="dateNaissanceEnfant[]"
                           class="form-control" placeholder="dd/mm/yyyy" inputmode="numeric" maxlength="10"
                           data-date-format="dd/mm/yyyy" required data-max-date="${y-3}-${m}-${d}" data-min-date="${y-18}-${m}-${d}">
                    <small class="date-info-child"><i class="fas fa-info-circle"></i> Ã‚ge requis : 3 Ã  18 ans (${y-18}â€“${y-3})</small>
                </div>
                <div class="form-group">
                    <label class="form-label">Sexe *</label>
                    <select name="sexeEnfant[]" class="form-select" required>
                        <option value="">SÃ©lectionnez</option>
                        <option value="M">GarÃ§on</option>
                        <option value="F">Fille</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Sport *</label>
                <select name="sportEnfant[]" class="form-select" required>
                    <option value="">SÃ©lectionnez un sport</option>
                    ${renderSportsOptions()}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Certificat mÃ©dical *</label>
                <input type="file" id="certificatMedicalEnfant${n}" name="certificatMedicalEnfant[]"
                       class="form-control" accept=".pdf,.jpg,.png" required>
            </div>
            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="hasMaladieEnfant${n}" name="hasMaladieEnfant[]">
                    <label for="hasMaladieEnfant${n}">L'enfant a une maladie chronique</label>
                </div>
                <input type="text" id="nomMaladieEnfant${n}" name="nomMaladieEnfant[]"
                       class="form-control" placeholder="Nom de la maladie" style="display:none;margin-top:10px;">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Photo *</label>
                    <input type="file" id="photoEnfant${n}" name="photoEnfant[]"
                           class="form-control" accept=".jpg,.jpeg,.png" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Extrait de naissance *</label>
                    <input type="file" id="extraitNaissanceEnfant${n}" name="extraitNaissanceEnfant[]"
                           class="form-control" accept=".pdf,.jpg,.png" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Permission parentale signÃ©e *</label>
                <input type="file" id="permissionParentale${n}" name="permissionParentale[]"
                       class="form-control" accept=".pdf,.jpg,.png" required>
            </div>
        </div>`);

    setupMaladieToggle(`hasMaladieEnfant${n}`, `nomMaladieEnfant${n}`);
    addFileNamePreviews(document.getElementById(`enfant-form-${n}`));
    initDateTextInputs(document.getElementById(`enfant-form-${n}`));
    setTimeout(() => document.getElementById(`enfant-form-${n}`)?.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
}

/* =========================================================
   PRÃ‰VISUALISATION NOM DE FICHIER
   ========================================================= */

function addFileNamePreviews(container = document) {
    container.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            this.parentElement.querySelector('.file-name')?.remove();
            if (this.files[0]) {
                const span = document.createElement('span');
                span.className = 'file-name';
                span.style.cssText = 'display:block;font-size:.85rem;color:#28a745;margin-top:5px;';
                span.innerHTML = `<i class="fas fa-check-circle"></i> ${this.files[0].name} (${formatFileSize(this.files[0].size)})`;
                this.parentElement.appendChild(span);
            }
        });
    });
}

function initFileUploads()     { addFileNamePreviews(document); }

function initDateTextInputs(container = document) {
    container.querySelectorAll('[data-date-format="dd/mm/yyyy"]').forEach(input => {
        if (input.dataset.dateBound === 'true') return;
        input.dataset.dateBound = 'true';
        if (input.value) {
            const normalized = formatDateForInput(input.value);
            if (normalized) input.value = normalized;
        }
        input.addEventListener('blur', function() {
            const normalized = formatDateForInput(this.value);
            if (normalized || !this.value.trim()) this.value = normalized;
        });
    });
}

/* =========================================================
   PASSWORD TOGGLE / MODALS
   ========================================================= */

function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.getElementById(this.dataset.target); if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
            this.querySelector('i')?.classList.toggle('fa-eye');
            this.querySelector('i')?.classList.toggle('fa-eye-slash');
        });
    });
}

function initModals() {
    document.querySelectorAll('[data-modal]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = 'modal' + link.dataset.modal.charAt(0).toUpperCase() + link.dataset.modal.slice(1);
            const modal = document.getElementById(id);
            if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
        });
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none'; document.body.style.overflow = 'auto';
        });
    });
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) { e.target.style.display = 'none'; document.body.style.overflow = 'auto'; }
    });
}

/* =========================================================
   VALIDATORS SIMPLES
   ========================================================= */

function validateEmail(email)  { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePhone(phone)  { return /^(\+213|0)[5-7][0-9]{8}$/.test(phone.replace(/[\s\-()]/g,'')); }
function validateDate(date)    { return !!window.ManarDate?.parse(date); }
function validateCodeOption(fieldName, code) {
    const trimmedCode = String(code || '').trim();
    if (fieldName === 'codeOptionCoach') {
        return /^[A-Z]{3}\d{3}$/.test(trimmedCode);
    }

    const selectedRole = document.getElementById('adminFunction')?.value || '';
    const adminCodes = {
        principal: 'P#gA.2',
        'statistiques-finance': '56S@m',
        evenements: 'V*192.m',
        utilisateurs: 'U.s3er#'
    };

    return !!selectedRole && adminCodes[selectedRole] === trimmedCode;
}
function validateCCP(ccp)      { return /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(ccp); }

function formatDateForInput(value) {
    return window.ManarDate?.toInputValue(value) || '';
}

function normalizeStorageDate(value) {
    return window.ManarDate?.toStorage(value) || '';
}

/* =========================================================
   REDIRECTION / NOTIFICATIONS
   ========================================================= */

function getRoleLabel(role) {
    return { admin:'Administrateur', coach:'Coach Sportif', athlete:'AthlÃ¨te', parent:'Parent' }[role] || 'Membre';
}

function redirectToUserSpace(role) {
    const routes = { admin:'/admin/dashboard.html', coach:'/pages/espace-coach.html', athlete:'/pages/espace-athlete.html', parent:'/pages/espace-parent.html' };
    window.location.href = routes[role] || '/index.html';
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;';
        document.body.appendChild(container);
    }
    const icons  = { success:'fa-check-circle', error:'fa-exclamation-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
    const colors = { success:{bg:'#d4edda',color:'#155724',border:'#c3e6cb'}, error:{bg:'#f8d7da',color:'#721c24',border:'#f5c6cb'}, warning:{bg:'#fff3cd',color:'#856404',border:'#ffeeba'}, info:{bg:'#d1ecf1',color:'#0c5460',border:'#bee5eb'} };
    const c = colors[type] || colors.info;
    const n = document.createElement('div');
    n.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><i class="fas ${icons[type]}"></i><span>${message}</span></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:18px;">&times;</button>`;
    n.style.cssText = `padding:14px 18px;margin-bottom:10px;border-radius:8px;font-size:14px;display:flex;align-items:center;justify-content:space-between;background:${c.bg};color:${c.color};border:1px solid ${c.border};animation:slideIn .3s ease;`;
    container.appendChild(n);
    setTimeout(() => n.remove(), 5000);
    if (!document.getElementById('notif-anim')) {
        const s = document.createElement('style'); s.id = 'notif-anim';
        s.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
        document.head.appendChild(s);
    }
}

function scrollToElement(el) { el?.scrollIntoView({ behavior:'smooth', block:'center' }); }

// Exports globaux
window.showNotification    = showNotification;
window.ajouterEnfant       = ajouterEnfant;
window.validateBirthDate   = validateBirthDate;
window.redirectToUserSpace = redirectToUserSpace;
window.getRoleLabel        = getRoleLabel;

