// Galerie publique synchronisée avec l'administration

(function () {
    const STORAGE = {
        photos: 'galleryPhotos',
        videos: 'galleryVideos',
        albums: 'galleryAlbums',
        recent: 'galleryRecent',
        session: 'currentSession'
    };

    const CATEGORIES = {
        competitions: 'Compétition',
        evenements: 'Événement',
        entrainements: 'Entraînement'
    };

    class PublicGalleryManager {
        constructor() {
            this.currentUser = null;
            this.isAdmin = false;
            this.currentView = 'photos';
            this.filters = {
                category: 'all',
                sport: 'all',
                years: []
            };
            this.photos = [];
            this.videos = [];
            this.albums = [];
            this.recent = [];
            this.filteredPhotos = [];
            this.currentPhotoId = null;
            this.currentPhotoIndex = -1;
        }

        parseDate(value) {
            if (!value) return new Date();
            const stringValue = String(value).trim();
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(stringValue)) {
                const [day, month, year] = stringValue.split('/').map(Number);
                return new Date(year, month - 1, day);
            }
            return new Date(stringValue);
        }

        init() {
            this.checkAuth();
            this.loadData();
            this.bindEvents();
            this.populateFilterOptions();
            this.switchTab('photos');
        }

        readJson(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (_) {
                return fallback;
            }
        }

        writeJson(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        }

        checkAuth() {
            try {
                const session = localStorage.getItem(STORAGE.session);
                this.currentUser = session ? JSON.parse(session) : null;
                this.isAdmin = (this.currentUser?.role || this.currentUser?.userType) === 'admin';
            } catch (_) {
                this.currentUser = null;
                this.isAdmin = false;
            }

            document.getElementById('galleryAdminActions')?.style.setProperty('display', this.isAdmin ? 'flex' : 'none');
            document.getElementById('footerAdminLink')?.style.setProperty('display', this.isAdmin ? 'block' : 'none');
        }

        normalizePhoto(item) {
            return {
                id: Number(item?.id) || Date.now(),
                type: 'photo',
                title: item?.title || 'Photo',
                description: item?.description || '',
                category: CATEGORIES[item?.category] ? item.category : 'evenements',
                sport: item?.sport || '',
                author: item?.author || 'Administration',
                photographer: item?.photographer || '',
                acceptedFormats: item?.acceptedFormats || 'JPG, PNG, WEBP',
                date: item?.date || new Date().toISOString().split('T')[0],
                dataUrl: item?.dataUrl || item?.image || '../assets/images/default-image.jpg'
            };
        }

        normalizeVideo(item) {
            return {
                id: Number(item?.id) || Date.now(),
                type: 'video',
                title: item?.title || 'Vidéo',
                description: item?.description || '',
                category: CATEGORIES[item?.category] ? item.category : 'evenements',
                sport: item?.sport || '',
                author: item?.author || 'Administration',
                photographer: item?.photographer || '',
                acceptedFormats: item?.acceptedFormats || 'MP4, WebM, MOV',
                date: item?.date || new Date().toISOString().split('T')[0],
                dataUrl: item?.dataUrl || item?.url || '',
                thumbnail: item?.thumbnail || '../assets/images/default-video.jpg'
            };
        }

        normalizeAlbum(item) {
            return {
                id: Number(item?.id) || Date.now(),
                type: 'album',
                title: item?.title || 'Album',
                description: item?.description || '',
                category: CATEGORIES[item?.category] ? item.category : 'evenements',
                sport: item?.sport || '',
                author: item?.author || 'Administration',
                photographer: item?.photographer || '',
                acceptedFormats: item?.acceptedFormats || 'JPG, PNG, WEBP, MP4',
                date: item?.date || new Date().toISOString().split('T')[0],
                coverDataUrl: item?.coverDataUrl || item?.cover || '../assets/images/default-album.jpg',
                items: Array.isArray(item?.items) ? item.items : []
            };
        }

        loadData() {
            this.photos = this.readJson(STORAGE.photos, []).map((item) => this.normalizePhoto(item));
            this.videos = this.readJson(STORAGE.videos, []).map((item) => this.normalizeVideo(item));
            this.albums = this.readJson(STORAGE.albums, []).map((item) => this.normalizeAlbum(item));
            this.recent = this.readJson(STORAGE.recent, []);
        }

        getSportsList() {
            return [...new Set(
                this.getAllRecentItems()
                    .map((item) => String(item.sport || '').trim())
                    .filter(Boolean)
            )];
        }

        getRecentIds(type) {
            return new Set(this.recent.filter((item) => item.type === type).map((item) => Number(item.id)));
        }

        getRecentPhotos() {
            return this.photos.filter((item) => this.getRecentIds('photo').has(Number(item.id)));
        }

        getRecentVideos() {
            return this.videos.filter((item) => this.getRecentIds('video').has(Number(item.id)));
        }

        getRecentAlbums() {
            return this.albums.filter((item) => this.getRecentIds('album').has(Number(item.id)));
        }

        getAllRecentItems() {
            return [...this.getRecentPhotos(), ...this.getRecentVideos(), ...this.getRecentAlbums()];
        }

        bindEvents() {
            document.querySelectorAll('.nav-tab[data-gallery]').forEach((tab) => {
                tab.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.switchTab(tab.dataset.gallery);
                });
            });

            document.getElementById('categoryFilter')?.addEventListener('change', (event) => {
                this.filters.category = event.target.value;
                this.renderCurrentView();
            });

            document.getElementById('sportFilter')?.addEventListener('change', (event) => {
                this.filters.sport = event.target.value;
                this.renderCurrentView();
            });

            document.getElementById('dateFilter')?.addEventListener('change', (event) => {
                const values = Array.from(event.target.selectedOptions).map((option) => option.value).filter((value) => value !== 'all');
                this.filters.years = values;
                this.renderCurrentView();
            });

            document.getElementById('uploadMedia')?.addEventListener('click', (event) => {
                event.preventDefault();
                if (this.isAdmin) window.location.href = '../admin/dashboard.html#galerie';
            });

            document.querySelectorAll('.footer-col a[data-category]').forEach((link) => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.filters.category = link.dataset.category || 'all';
                    const categoryFilter = document.getElementById('categoryFilter');
                    if (categoryFilter) categoryFilter.value = this.filters.category;
                    this.switchTab('photos');
                });
            });

            document.addEventListener('click', (event) => {
                const photoItem = event.target.closest('.gallery-item');
                if (photoItem && !event.target.closest('.admin-actions')) {
                    this.openLightbox(Number(photoItem.dataset.id));
                }
                const albumItem = event.target.closest('.album-card');
                if (albumItem) {
                    this.openAlbum(Number(albumItem.dataset.id));
                }
                if (event.target.classList.contains('modal')) {
                    event.target.style.display = 'none';
                }
            });

            document.querySelector('.lightbox-close')?.addEventListener('click', () => this.closeLightbox());
            document.querySelector('.lightbox-prev')?.addEventListener('click', () => this.navigateLightbox(-1));
            document.querySelector('.lightbox-next')?.addEventListener('click', () => this.navigateLightbox(1));

            document.addEventListener('keydown', (event) => {
                const lightbox = document.getElementById('lightbox');
                if (!lightbox?.classList.contains('show')) return;
                if (event.key === 'Escape') this.closeLightbox();
                if (event.key === 'ArrowLeft') this.navigateLightbox(-1);
                if (event.key === 'ArrowRight') this.navigateLightbox(1);
            });

            window.addEventListener('storage', (event) => {
                if (!Object.values(STORAGE).includes(event.key)) return;
                this.checkAuth();
                this.loadData();
                this.populateFilterOptions();
                this.renderCurrentView();
            });
        }

        populateFilterOptions() {
            const items = this.getAllRecentItems();
            const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
            const years = [...new Set(items.map((item) => String(this.parseDate(item.date).getFullYear())).filter(Boolean))].sort().reverse();

            this.populateSingleSelect('categoryFilter', categories, 'Toutes les catégories', (value) => CATEGORIES[value] || value);
            this.populateSingleSelect('sportFilter', this.getSportsList(), 'Tous les sports');
            this.populateYearsSelect(years);
        }

        populateSingleSelect(id, values, defaultLabel, labelFn) {
            const select = document.getElementById(id);
            if (!select) return;
            const currentValue = id === 'categoryFilter' ? this.filters.category : this.filters.sport;
            select.innerHTML = `<option value="all">${defaultLabel}</option>${values.map((value) => `<option value="${value}">${labelFn ? labelFn(value) : value}</option>`).join('')}`;
            select.value = values.includes(currentValue) || currentValue === 'all' ? currentValue : 'all';
        }

        populateYearsSelect(years) {
            const select = document.getElementById('dateFilter');
            if (!select) return;
            select.innerHTML = `<option value="all">Toutes les années</option>${years.map((year) => `<option value="${year}">${year}</option>`).join('')}`;
            Array.from(select.options).forEach((option) => {
                option.selected = this.filters.years.includes(option.value);
            });
        }

        matchesFilters(item) {
            if (this.filters.category !== 'all' && item.category !== this.filters.category) return false;
            if (this.filters.sport !== 'all' && item.sport !== this.filters.sport) return false;
            if (this.filters.years.length && !this.filters.years.includes(String(this.parseDate(item.date).getFullYear()))) return false;
            return true;
        }

        switchTab(view) {
            this.currentView = view;
            document.querySelectorAll('.nav-tab[data-gallery]').forEach((tab) => {
                tab.classList.toggle('active', tab.dataset.gallery === view);
            });

            document.getElementById('photosGallery').style.display = view === 'photos' ? 'block' : 'none';
            document.getElementById('videosGallery').style.display = view === 'videos' ? 'block' : 'none';
            document.getElementById('albumsGallery').style.display = view === 'albums' ? 'block' : 'none';
            this.renderCurrentView();
        }

        renderCurrentView() {
            if (this.currentView === 'photos') this.renderPhotos();
            if (this.currentView === 'videos') this.renderVideos();
            if (this.currentView === 'albums') this.renderAlbums();
        }

        renderEmpty(containerId, icon, title, text) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = `
                <div class="no-results">
                    <i class="${icon}"></i>
                    <h3>${title}</h3>
                    <p>${text}</p>
                </div>
            `;
        }

        renderPhotos() {
            const container = document.getElementById('photosGrid');
            if (!container) return;

            this.filteredPhotos = this.getRecentPhotos().filter((item) => this.matchesFilters(item));
            if (!this.filteredPhotos.length) {
                this.renderEmpty('photosGrid', 'fas fa-images', 'Aucune photo récente', 'Aucune photo récente ne correspond aux filtres sélectionnés.');
                return;
            }

            container.innerHTML = this.filteredPhotos.map((photo) => `
                <div class="gallery-item" data-id="${photo.id}">
                    <div class="gallery-image">
                        <img src="${photo.dataUrl}" alt="${photo.title}" loading="lazy" onerror="this.src='../assets/images/default-image.jpg'">
                        <div class="gallery-overlay">
                            <h3>${photo.title}</h3>
                            <p>${photo.description ? `${photo.description.slice(0, 90)}${photo.description.length > 90 ? '...' : ''}` : ''}</p>
                            <div class="gallery-meta">
                                <span><i class="fas fa-futbol"></i> ${photo.sport || 'Non précisé'}</span>
                                <span><i class="fas fa-calendar"></i> ${this.formatDate(photo.date)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        renderVideos() {
            const container = document.getElementById('videosGrid');
            if (!container) return;

            const videos = this.getRecentVideos().filter((item) => this.matchesFilters(item));
            if (!videos.length) {
                this.renderEmpty('videosGrid', 'fas fa-video', 'Aucune vidéo récente', 'Aucune vidéo récente ne correspond aux filtres sélectionnés.');
                return;
            }

            container.innerHTML = videos.map((video) => `
                <div class="video-card" data-id="${video.id}">
                    <div class="video-thumbnail">
                        <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='../assets/images/default-video.jpg'">
                        <span class="video-duration">${video.acceptedFormats}</span>
                        ${video.dataUrl ? `<a class="video-play" href="${video.dataUrl}" target="_blank" rel="noopener"><i class="fas fa-play"></i></a>` : ''}
                    </div>
                    <div class="video-info">
                        <h3>${video.title}</h3>
                        <p>${video.description || ''}</p>
                        <div class="video-meta">
                            <span><i class="fas fa-futbol"></i> ${video.sport || 'Non précisé'}</span>
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(video.date)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        renderAlbums() {
            const container = document.getElementById('albumsGrid');
            if (!container) return;

            const albums = this.getRecentAlbums().filter((item) => this.matchesFilters(item));
            if (!albums.length) {
                this.renderEmpty('albumsGrid', 'fas fa-images', 'Aucun album récent', 'Aucun album récent ne correspond aux filtres sélectionnés.');
                return;
            }

            container.innerHTML = albums.map((album) => `
                <div class="album-card" data-id="${album.id}">
                    <div class="album-cover">
                        <img src="${album.coverDataUrl}" alt="${album.title}" onerror="this.src='../assets/images/default-album.jpg'">
                        <span class="album-count">${album.items.length} élément(s)</span>
                    </div>
                    <div class="album-info">
                        <h3>${album.title}</h3>
                        <p>${album.description || ''}</p>
                    </div>
                </div>
            `).join('');
        }

        openAlbum(albumId) {
            const album = this.albums.find((item) => Number(item.id) === Number(albumId));
            if (!album) return;
            alert(`${album.title}\n${album.items.length} élément(s)`);
        }

        openLightbox(photoId) {
            const index = this.filteredPhotos.findIndex((photo) => Number(photo.id) === Number(photoId));
            if (index === -1) return;

            const photo = this.filteredPhotos[index];
            this.currentPhotoId = photo.id;
            this.currentPhotoIndex = index;

            document.getElementById('lightboxImage').src = photo.dataUrl;
            document.getElementById('lightboxTitle').textContent = photo.title;
            document.getElementById('lightboxDescription').textContent = photo.description || '';
            document.getElementById('lightboxAuthor').innerHTML = `<i class="fas fa-user"></i> ${photo.author || 'Administration'}`;
            document.getElementById('lightboxDate').innerHTML = `<i class="fas fa-calendar"></i> ${this.formatDate(photo.date)}`;
            document.getElementById('lightboxCategory').innerHTML = `<i class="fas fa-tag"></i> ${CATEGORIES[photo.category] || photo.category}`;
            document.getElementById('lightboxAdminActions').style.display = 'none';
            document.getElementById('lightbox').classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        closeLightbox() {
            document.getElementById('lightbox').classList.remove('show');
            document.body.style.overflow = '';
        }

        navigateLightbox(direction) {
            if (!this.filteredPhotos.length || this.currentPhotoIndex < 0) return;
            let nextIndex = this.currentPhotoIndex + direction;
            if (nextIndex < 0) nextIndex = this.filteredPhotos.length - 1;
            if (nextIndex >= this.filteredPhotos.length) nextIndex = 0;
            this.openLightbox(this.filteredPhotos[nextIndex].id);
        }

        formatDate(date) {
            return this.parseDate(date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.galleryManager = new PublicGalleryManager();
        window.galleryManager.init();
    });
})();
