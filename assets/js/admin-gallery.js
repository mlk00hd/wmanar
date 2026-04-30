// Extensions galerie pour le dashboard admin

(function () {
    const STORAGE = {
        photos: 'galleryPhotos',
        videos: 'galleryVideos',
        albums: 'galleryAlbums',
        recent: 'galleryRecent',
        legacy: 'gallery'
    };

    const CATEGORY_OPTIONS = [
        { value: 'competitions', label: 'Compétition' },
        { value: 'evenements', label: 'Événement' },
        { value: 'entrainements', label: 'Entraînement' }
    ];

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
            return;
        }
        fn();
    }

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getSportsList() {
        const sports = readJson('sportsData', [])
            .map((sport) => String(sport.name || '').trim())
            .filter(Boolean);
        return [...new Set(sports)];
    }

    function categoryLabel(value) {
        return CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
    }

    function categoryOptionsHtml(selectedValue = '') {
        return CATEGORY_OPTIONS.map((option) => {
            const selected = option.value === selectedValue ? ' selected' : '';
            return `<option value="${option.value}"${selected}>${option.label}</option>`;
        }).join('');
    }

    function sportOptionsHtml(selectedValue = '') {
        return getSportsList().map((sport) => {
            const selected = sport === selectedValue ? ' selected' : '';
            return `<option value="${sport}"${selected}>${sport}</option>`;
        }).join('');
    }

    function normalizePhoto(item) {
        return {
            id: Number(item?.id) || Date.now(),
            type: 'photo',
            title: item?.title || 'Photo',
            description: item?.description || '',
            category: CATEGORY_OPTIONS.some((option) => option.value === item?.category) ? item.category : 'evenements',
            sport: item?.sport || '',
            author: item?.author || 'Administration',
            photographer: item?.photographer || '',
            acceptedFormats: item?.acceptedFormats || 'JPG, PNG, WEBP',
            date: item?.date || new Date().toISOString().split('T')[0],
            dataUrl: item?.dataUrl || item?.image || ''
        };
    }

    function normalizeVideo(item) {
        return {
            id: Number(item?.id) || Date.now(),
            type: 'video',
            title: item?.title || 'Vidéo',
            description: item?.description || '',
            category: CATEGORY_OPTIONS.some((option) => option.value === item?.category) ? item.category : 'evenements',
            sport: item?.sport || '',
            author: item?.author || 'Administration',
            photographer: item?.photographer || '',
            acceptedFormats: item?.acceptedFormats || 'MP4, WebM, MOV',
            date: item?.date || new Date().toISOString().split('T')[0],
            dataUrl: item?.dataUrl || item?.url || '',
            thumbnail: item?.thumbnail || '../assets/images/default-video.jpg'
        };
    }

    function normalizeAlbum(item) {
        return {
            id: Number(item?.id) || Date.now(),
            type: 'album',
            title: item?.title || 'Album',
            description: item?.description || '',
            category: CATEGORY_OPTIONS.some((option) => option.value === item?.category) ? item.category : 'evenements',
            sport: item?.sport || '',
            author: item?.author || 'Administration',
            photographer: item?.photographer || '',
            acceptedFormats: item?.acceptedFormats || 'JPG, PNG, WEBP, MP4',
            date: item?.date || new Date().toISOString().split('T')[0],
            coverDataUrl: item?.coverDataUrl || item?.cover || '',
            items: Array.isArray(item?.items) ? item.items : []
        };
    }

    function previewMarkup(item) {
        const source = item.type === 'album' ? item.coverDataUrl : item.type === 'video' ? item.thumbnail : item.dataUrl;
        return source ? `<img class="gallery-real-img" src="${source}" alt="${item.title}" loading="lazy">` : '';
    }

    function dropZoneMarkup(id, label, accept, hint) {
        return `
            <div class="form-group">
                <label class="form-label">${label}</label>
                <div class="upload-zone gallery-drop-zone" data-input="${id}">
                    <input type="file" id="${id}" accept="${accept}">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <strong>Glisser-déposer ou cliquer pour choisir</strong>
                    <small>${hint}</small>
                    <div class="gallery-file-info" id="${id}Info" style="margin-top:10px;color:var(--gray-600)"></div>
                </div>
            </div>
        `;
    }

    ready(() => {
        const app = window.app;
        if (!app) return;

        app.gallery = readJson(STORAGE.photos, app.gallery || []).map(normalizePhoto);
        app.galleryVideos = readJson(STORAGE.videos, []).map(normalizeVideo);
        app.galleryAlbums = readJson(STORAGE.albums, []).map(normalizeAlbum);
        app.galleryRecent = readJson(STORAGE.recent, []);

        app.syncGalleryStorage = function syncGalleryStorage() {
            this.gallery = this.gallery.map(normalizePhoto);
            this.galleryVideos = this.galleryVideos.map(normalizeVideo);
            this.galleryAlbums = this.galleryAlbums.map(normalizeAlbum);
            this.galleryRecent = this.galleryRecent.filter((item) => (
                (item.type === 'photo' && this.gallery.some((entry) => Number(entry.id) === Number(item.id))) ||
                (item.type === 'video' && this.galleryVideos.some((entry) => Number(entry.id) === Number(item.id))) ||
                (item.type === 'album' && this.galleryAlbums.some((entry) => Number(entry.id) === Number(item.id)))
            ));

            writeJson(STORAGE.photos, this.gallery);
            writeJson(STORAGE.legacy, this.gallery);
            writeJson(STORAGE.videos, this.galleryVideos);
            writeJson(STORAGE.albums, this.galleryAlbums);
            writeJson(STORAGE.recent, this.galleryRecent);
        };

        app.getAllGalleryItems = function getAllGalleryItems() {
            return [
                ...this.gallery.map(normalizePhoto),
                ...this.galleryVideos.map(normalizeVideo),
                ...this.galleryAlbums.map(normalizeAlbum)
            ].sort((a, b) => new Date(b.date) - new Date(a.date));
        };

        app.isRecentGalleryItem = function isRecentGalleryItem(type, id) {
            return this.galleryRecent.some((item) => item.type === type && Number(item.id) === Number(id));
        };

        app.renderGalleryGrid = function renderGalleryGrid() {
            const container = document.getElementById('galleryGrid');
            if (!container) return;

            const items = this.getAllGalleryItems();
            if (!items.length) {
                container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-500)"><i class="fas fa-images" style="font-size:3rem;display:block;margin-bottom:12px;opacity:0.3"></i><p style="font-weight:600;margin-bottom:6px">Aucun contenu</p><small>Cliquez sur "Déposer" pour publier votre premier élément.</small></div>';
                return;
            }

            container.innerHTML = items.map((item) => `
                <div class="gallery-item" onclick="app.viewImage(${item.id}, '${item.type}')">
                    ${previewMarkup(item)}
                    <div class="gallery-overlay">
                        <div class="gallery-overlay-title">${item.title}</div>
                        <div class="gallery-overlay-meta">
                            <span><i class="fas fa-tag"></i> ${categoryLabel(item.category)}</span>
                            <span><i class="fas fa-futbol"></i> ${item.sport || 'Non précisé'}</span>
                        </div>
                        <div class="gallery-overlay-meta">
                            <span>${item.type === 'album' ? `${item.items.length} élément(s)` : item.type === 'video' ? 'Vidéo' : 'Photo'}</span>
                            <span>${this.isRecentGalleryItem(item.type, item.id) ? 'Récent' : 'Archive'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        };

        app.showAddImageModal = function showAddImageModal() {
            this.openModal('', '<i class="fas fa-upload"></i> Déposer', `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
                    <button class="btn btn-secondary" onclick="app.openGalleryEntryModal('album')"><i class="fas fa-images"></i> + Album</button>
                    <button class="btn btn-secondary" onclick="app.openGalleryEntryModal('photo')"><i class="fas fa-camera"></i> + Photo</button>
                    <button class="btn btn-secondary" onclick="app.openGalleryEntryModal('video')"><i class="fas fa-video"></i> + Vidéo</button>
                    <button class="btn btn-secondary" onclick="app.openRecentSelectionModal()"><i class="fas fa-clock"></i> + Récent</button>
                </div>
            `, '<button class="btn btn-secondary" onclick="app.closeModal()">Fermer</button>');
        };

        app.openGalleryEntryModal = function openGalleryEntryModal(type) {
            const isAlbum = type === 'album';
            const isVideo = type === 'video';
            const title = isAlbum ? 'Nouvel album' : isVideo ? 'Nouvelle vidéo' : 'Nouvelle photo';

            const body = `
                <div class="form-grid cols-1">
                    ${dropZoneMarkup('galleryPrimaryFile', isAlbum ? 'Photo de couverture' : isVideo ? 'Vidéo' : 'Photo', isVideo ? 'video/*' : 'image/*', isVideo ? 'Formats acceptés : MP4, WebM, MOV' : 'Formats acceptés : JPG, PNG, WEBP')}
                    <div id="galleryCoverPreview" style="display:none;margin-top:6px;padding:12px;border:1px solid var(--gray-200);border-radius:12px;">
                        <strong>Couverture sélectionnée</strong>
                        <img id="galleryCoverPreviewImage" alt="Couverture" style="display:block;width:100%;max-height:220px;object-fit:contain;margin-top:10px;border-radius:10px;background:#f8fafc">
                    </div>
                    <div class="form-group"><label class="form-label">Formats acceptés</label><input type="text" class="form-control" id="galleryAcceptedFormats" value="${isVideo ? 'MP4, WebM, MOV' : 'JPG, PNG, WEBP'}"></div>
                    <div class="form-group"><label class="form-label">Date</label><input type="text" class="form-control" id="galleryDate" value="${new Date().toLocaleDateString('fr-FR')}" placeholder="jj/mm/aaaa"></div>
                    <div class="form-group"><label class="form-label">Titre <span class="req">*</span></label><input type="text" class="form-control" id="galleryTitle" placeholder="Titre"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="galleryDescription" rows="3" placeholder="Description"></textarea></div>
                    <div class="form-group"><label class="form-label">Catégorie <span class="req">*</span></label><select class="form-select" id="galleryCategory">${categoryOptionsHtml('evenements')}</select></div>
                    <div class="form-group"><label class="form-label">Sport</label><select class="form-select" id="gallerySport"><option value="">Sélectionnez un sport</option>${sportOptionsHtml()}</select></div>
                    <div class="form-group"><label class="form-label">Nom de l’auteur</label><input type="text" class="form-control" id="galleryAuthor" placeholder="Nom de l’auteur"></div>
                    <div class="form-group"><label class="form-label">Nom du photographe</label><input type="text" class="form-control" id="galleryPhotographer" placeholder="Nom du photographe"></div>
                    ${isAlbum ? `
                        <div class="form-group">
                            <label class="form-label">Contenu de l’album</label>
                            <div id="galleryAlbumItems">
                                <div class="album-extra-row" style="margin-bottom:10px;">
                                    <input type="file" class="form-control gallery-album-item" accept="image/*,video/*">
                                </div>
                            </div>
                            <button class="btn btn-secondary" type="button" onclick="app.addAlbumItemInput()"><i class="fas fa-plus"></i> Ajouter d’autres photos ou vidéos</button>
                        </div>
                    ` : ''}
                </div>
            `;

            this._galleryModalType = type;
            this.openModal('', `<i class="fas fa-upload"></i> ${title}`, body, `
                <button class="btn btn-secondary" onclick="app.closeModal()">Annuler</button>
                <button class="btn btn-success" onclick="app.submitGalleryEntry()"><i class="fas fa-check"></i> Publier</button>
            `);

            this.bindGalleryDropZones();
            document.getElementById('galleryPrimaryFile')?.addEventListener('change', (event) => this.handleCoverSelection(event.target.files?.[0]));
        };

        app.bindGalleryDropZones = function bindGalleryDropZones() {
            document.querySelectorAll('.gallery-drop-zone').forEach((zone) => {
                const input = document.getElementById(zone.dataset.input);
                if (!input) return;

                ['dragenter', 'dragover'].forEach((eventName) => {
                    zone.addEventListener(eventName, (event) => {
                        event.preventDefault();
                        zone.style.borderColor = 'var(--primary-light)';
                    });
                });

                ['dragleave', 'drop'].forEach((eventName) => {
                    zone.addEventListener(eventName, (event) => {
                        event.preventDefault();
                        zone.style.borderColor = '';
                    });
                });

                zone.addEventListener('drop', (event) => {
                    const files = event.dataTransfer?.files;
                    if (!files?.length) return;
                    input.files = files;
                    input.dispatchEvent(new Event('change'));
                });
            });
        };

        app.handleCoverSelection = function handleCoverSelection(file) {
            const info = document.getElementById('galleryPrimaryFileInfo');
            if (info) info.textContent = file ? `Fichier sélectionné : ${file.name}` : '';
            if (!file || !file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.getElementById('galleryCoverPreview');
                const image = document.getElementById('galleryCoverPreviewImage');
                if (!wrapper || !image) return;
                image.src = event.target.result;
                wrapper.style.display = 'block';
                this._selectedAlbumCover = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        app.addAlbumItemInput = function addAlbumItemInput() {
            const wrapper = document.getElementById('galleryAlbumItems');
            if (!wrapper) return;
            const row = document.createElement('div');
            row.className = 'album-extra-row';
            row.style.marginBottom = '10px';
            row.innerHTML = '<input type="file" class="form-control gallery-album-item" accept="image/*,video/*">';
            wrapper.appendChild(row);
        };

        app.readGalleryFile = function readGalleryFile(file) {
            return new Promise((resolve, reject) => {
                if (!file) {
                    resolve('');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        app.submitGalleryEntry = async function submitGalleryEntry() {
            const type = this._galleryModalType || 'photo';
            const title = document.getElementById('galleryTitle')?.value.trim();
            const category = document.getElementById('galleryCategory')?.value;
            const primaryFile = document.getElementById('galleryPrimaryFile')?.files?.[0];

            if (!title || !category || !primaryFile) {
                this.toast('Veuillez remplir les champs obligatoires.', 'warning');
                return;
            }

            const baseItem = {
                id: Date.now(),
                title,
                description: document.getElementById('galleryDescription')?.value.trim() || '',
                category,
                sport: document.getElementById('gallerySport')?.value || '',
                author: document.getElementById('galleryAuthor')?.value.trim() || 'Administration',
                photographer: document.getElementById('galleryPhotographer')?.value.trim() || '',
                acceptedFormats: document.getElementById('galleryAcceptedFormats')?.value.trim() || '',
                date: document.getElementById('galleryDate')?.value || new Date().toLocaleDateString('fr-FR')
            };

            if (type === 'photo') {
                const dataUrl = await this.readGalleryFile(primaryFile);
                const item = normalizePhoto({ ...baseItem, dataUrl });
                this.gallery.unshift(item);
                if (!this.isRecentGalleryItem('photo', item.id)) this.galleryRecent.unshift({ type: 'photo', id: item.id });
            } else if (type === 'video') {
                const dataUrl = await this.readGalleryFile(primaryFile);
                const item = normalizeVideo({ ...baseItem, dataUrl });
                this.galleryVideos.unshift(item);
                if (!this.isRecentGalleryItem('video', item.id)) this.galleryRecent.unshift({ type: 'video', id: item.id });
            } else {
                const items = await Promise.all(
                    Array.from(document.querySelectorAll('.gallery-album-item'))
                        .map((input) => input.files?.[0])
                        .filter(Boolean)
                        .map(async (file) => ({
                            id: `${Date.now()}-${file.name}`,
                            name: file.name,
                            type: file.type.startsWith('video/') ? 'video' : 'photo',
                            dataUrl: await this.readGalleryFile(file)
                        }))
                );

                const coverDataUrl = this._selectedAlbumCover || await this.readGalleryFile(primaryFile);
                const item = normalizeAlbum({ ...baseItem, coverDataUrl, items });
                this.galleryAlbums.unshift(item);
                if (!this.isRecentGalleryItem('album', item.id)) this.galleryRecent.unshift({ type: 'album', id: item.id });
                this._selectedAlbumCover = '';
            }

            this.syncGalleryStorage();
            this.closeModal();
            this.renderGalleryGrid();
            this.toast('Galerie mise à jour avec succès.', 'success');
        };

        app.openRecentSelectionModal = function openRecentSelectionModal() {
            const groups = [
                { type: 'photo', title: 'Photos', items: this.gallery },
                { type: 'video', title: 'Vidéos', items: this.galleryVideos },
                { type: 'album', title: 'Galeries', items: this.galleryAlbums }
            ];

            const body = groups.map((group) => `
                <div class="form-group">
                    <label class="form-label">${group.title}</label>
                    <div style="display:grid;gap:8px;">
                        ${group.items.length ? group.items.map((item) => `
                            <label style="display:flex;align-items:center;gap:8px;">
                                <input type="checkbox" class="recent-selection" data-type="${group.type}" value="${item.id}" ${this.isRecentGalleryItem(group.type, item.id) ? 'checked' : ''}>
                                <span>${item.title}</span>
                            </label>
                        `).join('') : '<p style="margin:0;color:var(--gray-500)">Aucun élément importé.</p>'}
                    </div>
                </div>
            `).join('');

            this.openModal('', '<i class="fas fa-clock"></i> Sélection Récent', body, `
                <button class="btn btn-secondary" onclick="app.closeModal()">Annuler</button>
                <button class="btn btn-success" onclick="app.submitRecentSelection()"><i class="fas fa-save"></i> Enregistrer</button>
            `);
        };

        app.submitRecentSelection = function submitRecentSelection() {
            this.galleryRecent = Array.from(document.querySelectorAll('.recent-selection:checked')).map((checkbox) => ({
                type: checkbox.dataset.type,
                id: Number(checkbox.value)
            }));
            this.syncGalleryStorage();
            this.closeModal();
            this.renderGalleryGrid();
            this.toast('Sélection récente enregistrée.', 'success');
        };

        app.viewImage = function viewImage(id, type = 'photo') {
            const source = type === 'album' ? this.galleryAlbums : type === 'video' ? this.galleryVideos : this.gallery;
            const item = source.find((entry) => Number(entry.id) === Number(id));
            if (!item) return;

            const preview = type === 'album'
                ? `<img src="${item.coverDataUrl}" alt="${item.title}" style="width:100%;max-height:380px;object-fit:contain;border-radius:12px;background:#000;display:block;margin-bottom:16px">`
                : type === 'video'
                    ? `<div style="padding:24px;border-radius:12px;background:var(--gray-50);margin-bottom:16px;"><a class="btn btn-primary" href="${item.dataUrl}" target="_blank" rel="noopener"><i class="fas fa-play"></i> Ouvrir la vidéo</a></div>`
                    : `<img src="${item.dataUrl}" alt="${item.title}" style="width:100%;max-height:380px;object-fit:contain;border-radius:12px;background:#000;display:block;margin-bottom:16px">`;

            this.openModal('large', `<i class="fas ${type === 'album' ? 'fa-images' : type === 'video' ? 'fa-video' : 'fa-image'}"></i> ${item.title}`, `
                ${preview}
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                    <span class="badge badge-info">${categoryLabel(item.category)}</span>
                    <span class="badge badge-gray"><i class="fas fa-futbol"></i> ${item.sport || 'Non précisé'}</span>
                    <span class="badge badge-gray"><i class="fas fa-calendar"></i> ${item.date}</span>
                </div>
                ${item.description ? `<p style="color:var(--gray-600);margin-bottom:12px">${item.description}</p>` : ''}
            `, `
                <button class="btn btn-secondary" onclick="app.closeModal()">Fermer</button>
                <button class="btn btn-danger" onclick="app.deleteImage(${id}, '${type}')"><i class="fas fa-trash"></i> Supprimer</button>
            `);
        };

        app.deleteImage = function deleteImage(id, type = 'photo') {
            if (!confirm('Supprimer cet élément ?')) return;
            if (type === 'album') this.galleryAlbums = this.galleryAlbums.filter((item) => Number(item.id) !== Number(id));
            if (type === 'video') this.galleryVideos = this.galleryVideos.filter((item) => Number(item.id) !== Number(id));
            if (type === 'photo') this.gallery = this.gallery.filter((item) => Number(item.id) !== Number(id));
            this.galleryRecent = this.galleryRecent.filter((item) => !(item.type === type && Number(item.id) === Number(id)));
            this.syncGalleryStorage();
            this.closeModal();
            this.renderGalleryGrid();
            this.toast('Élément supprimé.', 'success');
        };

        const originalShowSection = app.showSection.bind(app);
        app.showSection = function patchedShowSection(name) {
            originalShowSection(name);
            if (name === 'galerie') this.renderGalleryGrid();
        };

        app.syncGalleryStorage();
        if (window.location.hash === '#galerie') app.renderGalleryGrid();
    });
})();
