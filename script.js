/**
 * Application principale - Association Sportive Manar Oran
 * Version complÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨te avec gestion des rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´les et redirection intelligente
 */

window.ManarDate = window.ManarDate || {
    parse(value) {
        if (!value) return null;
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : new Date(value);
        }

        const str = String(value).trim();
        let match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) {
            const [, day, month, year] = match.map(Number);
            const date = new Date(year, month - 1, day);
            return (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) ? date : null;
        }

        match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const [, year, month, day] = match.map(Number);
            const date = new Date(year, month - 1, day);
            return (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) ? date : null;
        }

        const parsed = new Date(str);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    },
    format(value) {
        const date = this.parse(value);
        return !date || Number.isNaN(date.getTime())
            ? ''
            : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    formatMonthYear(value) {
        const date = this.parse(value);
        return !date || Number.isNaN(date.getTime())
            ? ''
            : date.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' });
    },
    formatDateTime(value) {
        const date = this.parse(value);
        return !date || Number.isNaN(date.getTime())
            ? ''
            : `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    },
    toStorage(value) {
        const date = this.parse(value);
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    toInputValue(value) {
        return this.format(value);
    },
    isValid(value) {
        return !!this.parse(value);
    }
};

// ============ CLASSE PRINCIPALE DE L'APPLICATION ============
class ManarSportApp {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°viter les doubles initialisations
        if (this.initialized) {
            console.log('ManarSportApp dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
            return;
        }
        this.initialized = true;
        
        // Initialiser tous les modules
        this.initModules();
        this.bindEvents();
        this.checkAuth();
        this.loadInitialData();
        this.initUserInterface();
    }

    initModules() {
        // Initialiser tous les modules dans l'ordre
        this.cookies = new CookieManager();
        this.navigation = new NavigationManager();
        this.sliders = new SliderManager();
        this.animations = new AnimationManager();
        this.forms = new FormManager();
        this.modals = new ModalManager();
        this.auth = new AuthManager();
        this.notifications = new NotificationManager();
        this.contact = new ContactManager();
        this.gallery = new GalleryManager();
        this.planning = new PlanningManager();
        
        // Initialiser les composants spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiques ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la page
        this.initPageSpecific();
    }

    initPageSpecific() {
        // Initialiser les composants selon la page courante
        const page = this.getCurrentPage();
        
        switch(page) {
            case 'index':
                this.initHomePage();
                break;
            case 'inscription':
                this.initRegistrationPage();
                break;
            case 'connexion':
                this.initLoginPage();
                break;
            case 'galerie':
                if (this.gallery) this.gallery.initGallery();
                break;
            case 'planning':
                if (this.planning) this.planning.initCalendar();
                break;
            case 'admin-dashboard':
                this.initDashboard();
                break;
            case 'equipes':
                this.initTeamsPage();
                break;
            case 'actualites':
                this.initActualitesPage();
                break;
            case 'historique':
                this.initHistoriquePage();
                break;
            case 'profil':
                this.initProfilPage();
                break;
            case 'photos':
                this.initPhotosPage();
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (path.includes('/admin/')) {
            if (filename.includes('dashboard')) return 'admin-dashboard';
            if (filename.includes('utilisateurs')) return 'admin-utilisateurs';
            if (filename.includes('evenements')) return 'admin-evenements';
            if (filename.includes('galerie')) return 'admin-galerie';
            return 'admin';
        }
        
        if (filename.includes('inscription')) return 'inscription';
        if (filename.includes('connexion')) return 'connexion';
        if (filename.includes('galerie')) return 'galerie';
        if (filename.includes('planning')) return 'planning';
        if (filename.includes('equipes')) return 'equipes';
        if (filename.includes('actualites')) return 'actualites';
        if (filename.includes('historique')) return 'historique';
        if (filename.includes('profil')) return 'profil';
        if (filename.includes('mes-photos')) return 'photos';
        if (filename.includes('espace-coach')) return 'coach';
        if (filename.includes('espace-athlete')) return 'athlete';
        if (filename.includes('espace-parent')) return 'parent';
        
        return 'index';
    }

    bindEvents() {
        // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements globaux
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modals) this.modals.closeAll();
        });
    }

    handleScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Lazy load des images
        this.lazyLoadImages();
        
        // Animation au scroll
        if (this.animations) this.animations.animateOnScroll();
    }

    handleResize() {
        if (this.navigation) this.navigation.handleResponsive();
        if (this.sliders) this.sliders.updateSliderSize();
    }

    // ============ GESTION AUTHENTIFICATION ============
    checkAuth() {
        try {
            const session = localStorage.getItem('currentSession');
            if (session) {
                this.currentUser = JSON.parse(session);
                this.isLoggedIn = true;
                
                // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si l'utilisateur est sur la bonne page
                this.checkPageAccess();
            }
        } catch (e) {
            console.error('Erreur auth:', e);
            this.currentUser = null;
            this.isLoggedIn = false;
        }
    }

    checkPageAccess() {
        if (!this.currentUser) return;
        
        const page = this.getCurrentPage();
        const role = this.currentUser.role || this.currentUser.userType || 'membre';
        
        // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier l'accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s aux pages admin
        if (page.startsWith('admin-') && role !== 'admin') {
            this.redirectToUnauthorized();
            return;
        }
        
        // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier l'accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s aux pages spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiques
        if (page === 'coach' && role !== 'coach') {
            this.redirectToUnauthorized();
            return;
        }
        
        if (page === 'athlete' && role !== 'athlete') {
            this.redirectToUnauthorized();
            return;
        }
        
        if (page === 'parent' && role !== 'parent') {
            this.redirectToUnauthorized();
            return;
        }
        
        // Rediriger depuis les pages de connexion/inscription si dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
        if ((page === 'connexion' || page === 'inscription') && this.isLoggedIn) {
            this.redirectToUserSpace(role);
        }
    }

    redirectToUnauthorized() {
        if (this.notifications) {
            this.notifications.show('AccÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s non autorisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', 'error');
        }
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);
    }

    initUserInterface() {
        this.initSiteLogo();

        // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le menu utilisateur existe, sinon le crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er
        this.ensureUserMenuExists();
        
        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour l'interface si l'utilisateur est connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
        if (this.isLoggedIn && this.currentUser) {
            this.updateUIForLoggedInUser();
        }
    }

    initSiteLogo() {
        const isNestedPage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/admin/');
        const preferredLogo = isNestedPage ? '../assets/images/MANAR FINAL_DZ(1).jpg' : 'assets/images/MANAR FINAL_DZ(1).jpg';

        document.querySelectorAll('.logo-icon').forEach((logoIcon) => {
            if (logoIcon.querySelector('img')) return;

            logoIcon.innerHTML = `
                <img
                    src="${preferredLogo}"
                    alt="Logo Manar Sport"
                    class="site-logo-image"
                    onerror="this.closest('.logo-icon').innerHTML='<i class=&quot;fas fa-running&quot;></i>';"
                >
            `;
        });
    }

    ensureUserMenuExists() {
        const navMenu = document.querySelector('.nav-menu ul');
        if (!navMenu) return;
        
        // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le menu utilisateur existe dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â 
        if (document.getElementById('userMenuItem')) return;
        
        // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er le menu utilisateur (cachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© par dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©faut)
        const userMenuItem = document.createElement('li');
        userMenuItem.id = 'userMenuItem';
        userMenuItem.className = 'user-menu-item';
        userMenuItem.style.display = 'none';
        userMenuItem.innerHTML = `
            <div class="user-dropdown-container">
                <a href="#" class="btn-user" id="userMenuToggle">
                    <i class="fas fa-user-circle"></i>
                    <span id="userName">Mon Compte</span>
                    <i class="fas fa-chevron-down"></i>
                </a>
                <div class="user-dropdown" id="userDropdown">
                    <div class="dropdown-header">
                        <strong id="userFullName"></strong>
                        <span id="userRole"></span>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="/pages/profil.html" id="profileLink">
                        <i class="fas fa-id-card"></i> Mon Profil
                    </a>
                    <a href="/pages/planning.html" id="planningLink">
                        <i class="fas fa-calendar-alt"></i> Planning
                    </a>
                    <a href="/pages/galerie.html" id="photosLink">
                        <i class="fas fa-images"></i> Galerie
                    </a>
                    <div class="dropdown-divider" id="adminDivider" style="display: none;"></div>
                    <a href="/admin/dashboard.html" id="adminDashboardLink" style="display: none;">
                        <i class="fas fa-tachometer-alt"></i> Dashboard Admin
                    </a>
                    <div class="dropdown-divider" id="coachDivider" style="display: none;"></div>
                    <a href="/pages/espace-coach.html" id="coachDashboardLink" style="display: none;">
                        <i class="fas fa-chalkboard-teacher"></i> Espace Coach
                    </a>
                    <div class="dropdown-divider" id="athleteDivider" style="display: none;"></div>
                    <a href="/pages/espace-athlete.html" id="athleteDashboardLink" style="display: none;">
                        <i class="fas fa-running"></i> Espace Athl&egrave;te
                    </a>
                    <div class="dropdown-divider" id="parentDivider" style="display: none;"></div>
                    <a href="/pages/espace-parent.html" id="parentDashboardLink" style="display: none;">
                        <i class="fas fa-user-friends"></i> Espace Parent
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> D&eacute;connexion
                    </a>
                </div>
            </div>
        `;
// Ajouter le menu ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la fin de la navigation
        navMenu.appendChild(userMenuItem);
        
        // Ajouter le style CSS pour le dropdown s'il n'existe pas
        this.addUserMenuStyles();
    }

    addUserMenuStyles() {
        if (document.getElementById('user-menu-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'user-menu-styles';
        style.textContent = `
            .user-menu-item {
                position: relative;
                margin-left: 12px;
                flex: 0 0 auto;
            }
            
            .user-dropdown-container {
                position: relative;
            }
            
            .btn-user {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 14px;
                background: rgba(255, 255, 255, 0.12);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 999px;
                font-weight: 600;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .btn-user:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
                background: rgba(255, 255, 255, 0.18);
                color: white;
            }
            
            .btn-user i:first-child {
                font-size: 18px;
            }
            
            .btn-user i:last-child {
                font-size: 12px;
            }
            
            .user-dropdown {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                width: 260px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px);
                transition: all 0.3s ease;
                z-index: 1000;
                border: 1px solid rgba(30, 58, 138, 0.08);
                overflow: hidden;
            }
            
            .user-dropdown.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .dropdown-header {
                padding: 16px 18px 14px;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                color: white;
            }
            
            .dropdown-header strong {
                display: block;
                font-size: 15px;
                margin-bottom: 4px;
                line-height: 1.3;
                word-break: break-word;
            }
            
            .dropdown-header span {
                display: block;
                font-size: 12px;
                opacity: 0.85;
            }
            
            .dropdown-divider {
                height: 1px;
                background: rgba(15, 23, 42, 0.08);
                margin: 6px 0;
            }
            
            .user-dropdown a {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 18px;
                color: #1f2937;
                font-size: 14px;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            
            .user-dropdown a:hover {
                background: rgba(59, 130, 246, 0.08);
                color: #1e3a8a;
            }
            
            .user-dropdown a i {
                width: 18px;
                text-align: center;
                color: #3b82f6;
            }
            
            .user-dropdown a:last-child i {
                color: #dc3545;
            }
            
            .user-dropdown a:last-child:hover {
                background: rgba(220, 53, 69, 0.08);
                color: #dc3545;
            }
            
            @media (max-width: 768px) {
                .user-menu-item {
                    margin: 10px 0 0 0;
                    width: 100%;
                }
                
                .btn-user {
                    width: 100%;
                    justify-content: center;
                }
                
                .user-dropdown {
                    position: static;
                    width: 100%;
                    margin-top: 10px;
                    box-shadow: none;
                    border: 1px solid #eee;
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                    display: none;
                }
                
                .user-dropdown.show {
                    display: block;
                }
            }
        `;
document.head.appendChild(style);
    }

    // ============ MISE ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ JOUR UI SELON RÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂLE ============
    updateUIForLoggedInUser() {
        if (!this.currentUser) return;
        
        // Cacher les liens de connexion/inscription
        this.hideAuthLinks();
        
        // Afficher le menu utilisateur
        this.showUserMenu();
        
        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour les informations utilisateur dans le menu
        this.updateUserMenuInfo();
        
        // Afficher les panneaux spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiques selon le rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´le
        this.showRoleSpecificPanels();
        
        // DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©finir le lien de dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©connexion
        this.setupLogoutButton();

        const heroCta = document.getElementById('heroPrimaryCta');
        if (heroCta) {
            heroCta.textContent = 'Voir mon profil';
            heroCta.href = 'pages/profil.html';
        }
    }

    showLoginError(message) {
        const errorBox = document.getElementById('loginErrorMessage');
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.style.display = 'block';
    }

    clearLoginError() {
        const errorBox = document.getElementById('loginErrorMessage');
        if (!errorBox) return;
        errorBox.textContent = '';
        errorBox.style.display = 'none';
    }

    hideAuthLinks() {
        const loginLinks = document.querySelectorAll('.btn-login, .auth-links .btn-login, #loginLink');
        const registerLinks = document.querySelectorAll('.btn-register, .auth-links .btn-register, #registerLink');
        
        loginLinks.forEach(link => {
            if (link) link.style.display = 'none';
        });
        
        registerLinks.forEach(link => {
            if (link) link.style.display = 'none';
        });
    }

    showUserMenu() {
        const userMenuItem = document.getElementById('userMenuItem');
        if (userMenuItem) {
            userMenuItem.style.display = 'block';
            
            // Configuration du dropdown
            const userMenuToggle = document.getElementById('userMenuToggle');
            const userDropdown = document.getElementById('userDropdown');
            
            if (userMenuToggle && userDropdown) {
                // Supprimer les anciens ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couteurs
                const newToggle = userMenuToggle.cloneNode(true);
                userMenuToggle.parentNode.replaceChild(newToggle, userMenuToggle);
                
                // Ajouter le nouvel ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couteur
                newToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });
                
                // Fermer en cliquant ailleurs
                document.addEventListener('click', (e) => {
                    if (!newToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                        userDropdown.classList.remove('show');
                    }
                });
            }
        }
    }

    updateUserMenuInfo() {
        if (!this.currentUser) return;
        
        const userName = document.getElementById('userName');
        const userFullName = document.getElementById('userFullName');
        const userRole = document.getElementById('userRole');
        
        if (userName) {
            userName.textContent = this.currentUser.prenom || this.currentUser.nom || 'Mon Compte';
        }
        
        if (userFullName) {
            userFullName.textContent = `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || 'Utilisateur';
        }
        
        if (userRole) {
            userRole.textContent = this.getUserRoleText();
        }
    }

    getUserRoleText() {
        if (!this.currentUser) return 'Membre';
        
        const role = this.currentUser.role || this.currentUser.userType || '';
        
        switch(role) {
            case 'admin': return 'Administrateur';
            case 'coach': return 'Coach';
            case 'parent': return 'Parent';
            case 'athlete': return 'Athlète';
            default: return 'Membre';
        }
    }

    isAdmin() {
        if (!this.currentUser) return false;
        const role = this.currentUser.role || this.currentUser.userType || '';
        return role === 'admin';
    }

    isCoach() {
        if (!this.currentUser) return false;
        const role = this.currentUser.role || this.currentUser.userType || '';
        return role === 'coach';
    }

    isAthlete() {
        if (!this.currentUser) return false;
        const role = this.currentUser.role || this.currentUser.userType || '';
        return role === 'athlete';
    }

    isParent() {
        if (!this.currentUser) return false;
        const role = this.currentUser.role || this.currentUser.userType || '';
        return role === 'parent';
    }

    // ============ PANELS SPÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°CIFIQUES PAR RÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂLE ============
    showRoleSpecificPanels() {
        if (!this.currentUser) return;
        
        const role = this.currentUser.role || this.currentUser.userType || '';
        
        // Masquer tous les panels d'abord
        this.hideAllPanels();
        
        // Afficher selon le rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´le
        switch(role) {
            case 'admin':
                this.showAdminPanels();
                break;
            case 'coach':
                this.showCoachPanels();
                break;
            case 'athlete':
                this.showAthletePanels();
                break;
            case 'parent':
                this.showParentPanels();
                break;
        }
    }

    hideAllPanels() {
        const allPanels = [
            'adminEventsPanel', 'adminSportsPanel', 'adminVideoPanel', 
            'adminTestimonialsPanel', 'adminMessagesPanel', 'footerAdminLink',
            'footerCoachLink', 'footerAthleteLink', 'footerParentLink'
        ];
        
        allPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) panel.style.display = 'none';
        });
        
        const allDropdownLinks = [
            'adminDashboardLink', 'adminDivider',
            'coachDashboardLink', 'coachSeancesLink', 'coachAthletesLink', 'coachDivider',
            'athleteDashboardLink', 'athletePerformancesLink', 'athleteDivider',
            'parentDashboardLink', 'parentEnfantsLink', 'parentPaiementsLink', 'parentDivider'
        ];
        
        allDropdownLinks.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) link.style.display = 'none';
        });
    }

    showAdminPanels() {
        // Panels admin sur la page
        const adminPanels = [
            'adminEventsPanel', 'adminSportsPanel', 'adminVideoPanel', 
            'adminTestimonialsPanel', 'adminMessagesPanel', 'footerAdminLink'
        ];
        
        adminPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) panel.style.display = 'block';
        });
        
        // Liens admin dans le dropdown
        const adminLinks = [
            'adminDashboardLink', 'adminDivider'
        ];
        
        adminLinks.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) link.style.display = 'block';
        });
    }

    showCoachPanels() {
        // Lien coach dans footer
        const footerCoachLink = document.getElementById('footerCoachLink');
        if (footerCoachLink) footerCoachLink.style.display = 'block';
        
        // Liens coach dans le dropdown
        const coachLinks = [
            'coachDashboardLink', 'coachSeancesLink', 'coachAthletesLink', 'coachDivider'
        ];
        
        coachLinks.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) link.style.display = 'block';
        });
    }

    showAthletePanels() {
        // Lien athlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨te dans footer
        const footerAthleteLink = document.getElementById('footerAthleteLink');
        if (footerAthleteLink) footerAthleteLink.style.display = 'block';
        
        // Liens athlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨te dans le dropdown
        const athleteLinks = [
            'athleteDashboardLink', 'athletePerformancesLink', 'athleteDivider'
        ];
        
        athleteLinks.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) link.style.display = 'block';
        });
    }

    showParentPanels() {
        // Lien parent dans footer
        const footerParentLink = document.getElementById('footerParentLink');
        if (footerParentLink) footerParentLink.style.display = 'block';
        
        // Liens parent dans le dropdown
        const parentLinks = [
            'parentDashboardLink', 'parentEnfantsLink', 'parentPaiementsLink', 'parentDivider'
        ];
        
        parentLinks.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) link.style.display = 'block';
        });
    }

    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Supprimer les anciens ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couteurs
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    logout() {
        // Supprimer la session
        localStorage.removeItem('currentSession');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        this.currentUser = null;
        this.isLoggedIn = false;
        
        // Notification
        if (this.notifications) {
            this.notifications.show('DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©connexion rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ussie', 'success');
        }
        
        // Recharger la page aprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s 1 seconde
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }

    // ============ REDIRECTION INTELLIGENTE ============
    redirectToUserSpace(role) {
        let redirectUrl = '/index.html';
        
        switch(role) {
            case 'admin':
                redirectUrl = '/admin/dashboard.html';
                break;
            case 'coach':
                redirectUrl = '/pages/espace-coach.html';
                break;
            case 'athlete':
                redirectUrl = '/pages/espace-athlete.html';
                break;
            case 'parent':
                redirectUrl = '/pages/espace-parent.html';
                break;
            default:
                redirectUrl = '/index.html';
                break;
        }
        
        console.log('Redirection vers:', redirectUrl);
        window.location.href = redirectUrl;
    }

    // ============ CHARGEMENT DONNÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°ES ============
    loadInitialData() {
        // Charger les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es initiales si nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cessaire
        if (!localStorage.getItem('sportsData')) {
            this.loadSportsData();
        }
        
        if (!localStorage.getItem('eventsData')) {
            this.loadEventsData();
        }
        
        // Corriger le chargement des utilisateurs pour ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©viter erreur JSON.parse
        try {
            const usersData = localStorage.getItem('users');
            if (!usersData) {
                this.loadDemoUsers();
            } else {
                const users = JSON.parse(usersData);
                if (!Array.isArray(users) || users.length === 0) {
                    this.loadDemoUsers();
                }
            }
        } catch (e) {
            console.error('Erreur chargement utilisateurs:', e);
            this.loadDemoUsers();
        }
        
        if (!localStorage.getItem('galleryPhotos')) {
            this.loadGalleryPhotos();
        }
        
        if (!localStorage.getItem('actualitesData')) {
            this.loadActualitesData();
        }
        
        if (!localStorage.getItem('equipesData')) {
            this.loadEquipesData();
        }
    }

    loadSportsData() {
        const sports = [
            { id: 1, name: 'Football', icon: 'futbol', description: 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°quipes jeunes et seniors', color: '#1e88e5' },
            { id: 2, name: 'Basketball', icon: 'basketball-ball', description: 'Section masculine et fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©minine', color: '#fb8b24' },
            { id: 3, name: 'Volleyball', icon: 'volleyball-ball', description: 'EntraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nements en salle', color: '#e94f37' },
            { id: 4, name: 'Handball', icon: 'hand-paper', description: 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°quipe compÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©titive', color: '#9c27b0' },
            { id: 5, name: 'Natation', icon: 'swimming-pool', description: 'Piscine olympique', color: '#0d9488' },
            { id: 6, name: 'AthlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tisme', icon: 'running', description: "Piste d'athlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tisme", color: '#7e57c2' },
            { id: 7, name: 'Judo', icon: 'user-ninja', description: 'Arts martiaux japonais', color: '#d32f2f' },
            { id: 8, name: 'Karate', icon: 'fist-raised', description: 'Arts martiaux traditionnels', color: '#c2185b' },
            { id: 9, name: 'Tennis', icon: 'table-tennis', description: 'Courts couverts et extÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rieurs', color: '#43a047' },
            { id: 10, name: 'Gymnastique', icon: 'spa', description: 'Gymnastique artistique', color: '#8d6e63' }
        ];
        
        localStorage.setItem('sportsData', JSON.stringify(sports));
    }

    loadEventsData() {
        const events = [
            {
                id: 1,
                title: 'Tournoi Annuel de Football',
                date: '2024-12-15',
                endDate: '2024-12-20',
                type: 'competition',
                sport: 'Football',
                location: 'Stade Municipal',
                description: 'Tournoi inter-clubs annuel - CatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gories U15, U17, U20',
                coach: 'Mohamed Ali',
                maxParticipants: 100
            },
            {
                id: 2,
                title: 'Championnat RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gional de Basketball',
                date: '2024-11-25',
                endDate: '2024-11-27',
                type: 'competition',
                sport: 'Basketball',
                location: 'Salle Omnisports',
                description: 'Phase finale du championnat rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gional',
                coach: 'Leila Bensalem',
                maxParticipants: 60
            },
            {
                id: 3,
                title: "JournÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e Portes Ouvertes",
                date: '2024-12-05',
                endDate: '2024-12-05',
                type: 'event',
                sport: 'Tous sports',
                location: 'Complexe Manar',
                description: "DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couvrez nos installations et rencontrez nos coachs",
                maxParticipants: 500
            }
        ];
        
        localStorage.setItem('eventsData', JSON.stringify(events));
    }

    loadDemoUsers() {
        const users = [
            {
                id: 1,
                nom: 'Admin',
                prenom: 'System',
                email: 'admin@manarsport.dz',
                password: 'admin123', // En clair pour la dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©mo
                userType: 'admin',
                role: 'admin',
                dateNaissance: '1980-01-01',
                sexe: 'M',
                telephone: '0550123456',
                adresse: 'Usto Oran',
                ville: 'Oran',
                status: 'active',
                registrationDate: new Date().toISOString()
            },
            {
                id: 2,
                nom: 'Benali',
                prenom: 'Karim',
                email: 'coach@manarsport.dz',
                password: 'coach123',
                userType: 'coach',
                role: 'coach',
                dateNaissance: '1985-05-15',
                sexe: 'M',
                telephone: '0551234567',
                sport: 'Football',
                status: 'active',
                registrationDate: new Date().toISOString()
            },
            {
                id: 3,
                nom: 'Moussa',
                prenom: 'Leila',
                email: 'parent@manarsport.dz',
                password: 'parent123',
                userType: 'parent',
                role: 'parent',
                dateNaissance: '1988-10-20',
                sexe: 'F',
                telephone: '0552345678',
                status: 'active',
                registrationDate: new Date().toISOString()
            },
            {
                id: 4,
                nom: 'Touati',
                prenom: 'Yacine',
                email: 'athlete@manarsport.dz',
                password: 'athlete123',
                userType: 'athlete',
                role: 'athlete',
                dateNaissance: '2000-03-10',
                sexe: 'M',
                telephone: '0553456789',
                sport: 'Basketball',
                niveau: 'avance',
                status: 'active',
                registrationDate: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('users', JSON.stringify(users));
    }

    loadGalleryPhotos() {
        const photos = [
            {
                id: 1,
                title: 'Victoire en finale rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gionale',
                description: 'Notre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quipe de football U20 aprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s leur victoire au championnat rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gional.',
                category: 'competitions',
                image: '/assets/images/galerie/football-victoire.jpg',
                author: 'Karim Benali',
                authorId: 2,
                date: '2024-11-15',
                likes: 245,
                views: 1845,
                comments: 42,
                tags: ['football', 'victoire', 'U20', 'championnat']
            },
            {
                id: 2,
                title: 'EntraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nement basketball',
                description: "SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ance d'entraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nement de l'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quipe senior fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©minine.",
                category: 'entrainements',
                image: '/assets/images/galerie/basket-entrainement.jpg',
                author: 'Leila Bensalem',
                authorId: 3,
                date: '2024-11-10',
                likes: 156,
                views: 982,
                comments: 23,
                tags: ['basketball', 'entraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nement', 'fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©minin']
            },
            {
                id: 3,
                title: 'JournÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e portes ouvertes',
                description: 'DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couverte des installations lors de notre journÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e portes ouvertes.',
                category: 'evenements',
                image: '/assets/images/galerie/portes-ouvertes.jpg',
                author: 'Service Communication',
                authorId: 1,
                date: '2024-11-05',
                likes: 189,
                views: 2103,
                comments: 31,
                tags: ['portes ouvertes', 'dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couverte', 'public']
            }
        ];
        
        localStorage.setItem('galleryPhotos', JSON.stringify(photos));
    }

    loadActualitesData() {
        const actualites = [
            {
                id: 1,
                title: "Notre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quipe de football U20 championne rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gionale",
                excerpt: "L'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quipe des moins de 20 ans a remportÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© le championnat rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gional aprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s une saison exceptionnelle.",
                date: "2024-11-10",
                category: "competitions",
                author: "ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°quipe Football",
                views: 2845,
                image: "/assets/images/actualites/football.jpg",
                tags: ["football", "championnat", "jeunes"],
                featured: true
            },
            {
                id: 2,
                title: "Nouveau coach de natation : Karim Benali",
                excerpt: "L'association accueille Karim Benali, ancien champion national, comme nouveau coach de natation.",
                date: "2024-11-08",
                category: "annonces",
                author: "Direction Sportive",
                views: 1956,
                image: "/assets/images/actualites/natation.jpg",
                tags: ["natation", "coach", "recrutement"],
                featured: false
            },
            {
                id: 3,
                title: "Portes ouvertes : record de participation",
                excerpt: "Notre journÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e portes ouvertes a attirÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© plus de 500 visiteurs, un record pour l'association.",
                date: "2024-11-05",
                category: "evenements",
                author: "Communication",
                views: 1745,
                image: "/assets/images/actualites/portes-ouvertes.jpg",
                tags: ["ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement", "dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©couverte", "communautÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©"],
                featured: false
            }
        ];
        
        localStorage.setItem('actualitesData', JSON.stringify(actualites));
    }

    loadEquipesData() {
        const equipes = [
            {
                id: 1,
                name: 'Football U20',
                sport: 'football',
                category: 'Jeunes',
                coach: 'Mohamed Ali',
                members: 25,
                maxMembers: 30,
                level: 'CompÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tition',
                schedule: 'Lun, Mer, Ven 18h-20h',
                description: 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°quipe de football des moins de 20 ans, participant aux championnats rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gionaux.',
                achievements: ['Champion rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©gional 2023', 'Finaliste coupe d\'Oran 2022'],
                image: '/assets/images/equipes/football-u20.jpg',
                status: 'open'
            },
            {
                id: 2,
                name: 'Basketball Senior FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©minin',
                sport: 'basketball',
                category: 'Adultes',
                coach: 'Leila Bensalem',
                members: 15,
                maxMembers: 20,
                level: 'IntermÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©diaire',
                schedule: 'Mar, Jeu 19h-21h, Sam 10h-12h',
                description: 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°quipe fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©minine de basketball ouverte ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tous niveaux.',
                achievements: ['3ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me division nationale'],
                image: '/assets/images/equipes/basket-feminin.jpg',
                status: 'open'
            }
        ];
        
        localStorage.setItem('equipesData', JSON.stringify(equipes));
    }

    // ============ PAGES SPÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°CIFIQUES ============
    initHomePage() {
        // Initialiser les composants spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiques ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la page d'accueil
        this.initStatsCounter();
        this.initVideoPlayer();
        this.initTestimonialsSlider();
        this.initContactForm();
        this.initNewsletter();
    }

    initStatsCounter() {
        const counters = document.querySelectorAll('.stat-number');
        if (!counters.length) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target') || '0', 10);
                    this.animateCounter(counter, target);
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element, target) {
        let start = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start).toLocaleString();
            }
        }, 16);
    }

    initVideoPlayer() {
        const video = document.getElementById('presentationVideo');
        const overlay = document.getElementById('videoOverlay');
        const playBtn = document.getElementById('playVideoBtn');
        
        if (!video || !overlay || !playBtn) return;
        
        playBtn.addEventListener('click', () => {
            video.play();
            overlay.classList.add('hidden');
        });
        
        video.addEventListener('pause', () => {
            overlay.classList.remove('hidden');
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
        
        video.addEventListener('ended', () => {
            overlay.classList.remove('hidden');
            playBtn.innerHTML = '<i class="fas fa-redo"></i>';
            playBtn.setAttribute('title', 'Revoir la vidÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©o');
        });
    }

    initTestimonialsSlider() {
        const slider = document.querySelector('.testimonials-slider');
        if (!slider) return;
        
        const testimonials = slider.querySelectorAll('.testimonial');
        const dotsContainer = document.querySelector('.testimonial-dots');
        const prevBtn = document.querySelector('.testimonial-prev');
        const nextBtn = document.querySelector('.testimonial-next');
        
        if (!testimonials.length) return;
        
        let currentIndex = 0;
        
        // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er les dots
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            testimonials.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.className = 'testimonial-dot';
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => this.showTestimonial(testimonials, dots, currentIndex, index));
                dotsContainer.appendChild(dot);
            });
        }
        
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.testimonial-dot') : [];
        
        this.showTestimonial = (testimonials, dots, currentIndex, index) => {
            testimonials[currentIndex].classList.remove('active');
            if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
            
            currentIndex = index;
            
            testimonials[currentIndex].classList.add('active');
            if (dots[currentIndex]) dots[currentIndex].classList.add('active');
            
            return currentIndex;
        };
        
        const nextTestimonial = () => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= testimonials.length) nextIndex = 0;
            currentIndex = this.showTestimonial(testimonials, dots, currentIndex, nextIndex);
        };
        
        const prevTestimonial = () => {
            let prevIndex = currentIndex - 1;
            if (prevIndex < 0) prevIndex = testimonials.length - 1;
            currentIndex = this.showTestimonial(testimonials, dots, currentIndex, prevIndex);
        };
        
        if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);
        if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);
        
        // Auto-slide
        setInterval(nextTestimonial, 5000);
    }

    initContactForm() {
        const form = document.getElementById('quickContact');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('nom') || formData.get('name') || '',
                email: formData.get('email') || '',
                subject: formData.get('sujet') || formData.get('subject') || 'Demande d\'information',
                message: formData.get('message') || '',
                timestamp: new Date().toISOString()
            };
            
            if (this.contact) {
                const success = await this.contact.sendMessage(data);
                
                if (success) {
                    if (this.notifications) {
                        this.notifications.show('Message envoyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s! Nous vous rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©pondrons dans les 48h.', 'success');
                    }
                    form.reset();
                } else {
                    if (this.notifications) {
                        this.notifications.show('Erreur lors de l\'envoi du message. Veuillez rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©essayer.', 'error');
                    }
                }
            }
        });
    }

    initNewsletter() {
        const emailInput = document.getElementById('newsletterEmail');
        const submitBtn = document.getElementById('subscribeBtn');
        
        if (!emailInput || !submitBtn) return;
        
        submitBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            
            if (!this.validateEmail(email)) {
                if (this.notifications) {
                    this.notifications.show('Veuillez entrer une adresse email valide.', 'warning');
                }
                return;
            }
            
            if (this.contact) {
                const success = await this.contact.subscribeNewsletter(email);
                
                if (success) {
                    if (this.notifications) {
                        this.notifications.show('Merci pour votre abonnement ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  notre newsletter!', 'success');
                    }
                    emailInput.value = '';
                } else {
                    if (this.notifications) {
                        this.notifications.show('Erreur lors de l\'abonnement. Veuillez rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©essayer.', 'error');
                    }
                }
            }
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    initRegistrationPage() {
        // Le formulaire d'inscription est gÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© par FormManager
        console.log('Page d\'inscription initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    initLoginPage() {
        console.log('Page de connexion initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
        
        // Attendre un peu pour ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©viter les conflits d'initialisation
        setTimeout(() => {
            // Initialiser le formulaire de connexion
            this.initLoginForm();
            
            // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si l'utilisateur est dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
            if (this.isLoggedIn) {
                console.log('Utilisateur dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©, redirection vers son espace');
                this.redirectToUserSpace(this.currentUser.role || this.currentUser.userType);
                return;
            }
        }, 100);
    }

    initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°viter les doubles initialisations
        if (loginForm.dataset.initialized) return;
        loginForm.dataset.initialized = 'true';
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value;
            
            if (!email || !password) {
                this.showLoginError('Email ou mot de passe incorrect');
                return;
            }
            
            if (!this.isValidEmail(email)) {
                this.showLoginError('Email ou mot de passe incorrect');
                return;
            }
            
            // DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sactiver le bouton pendant la connexion
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Connexion...';
            }
            
            const success = await this.auth.login(email, password);
            
            if (!success && submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Se connecter';
            }
            if (success) this.clearLoginError();
        });
        
        // Gestion du lien "Mot de passe oubliÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©"
        const forgotLink = document.getElementById('forgotPasswordLink');
        const forgotForm = document.getElementById('forgotPasswordForm');
        
        if (forgotLink && forgotForm) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.style.display = 'none';
                forgotForm.style.display = 'block';
            });
        }
        
        // Gestion du bouton retour
        const backToLogin = document.getElementById('backToLogin');
        if (backToLogin && forgotForm) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                forgotForm.style.display = 'none';
                loginForm.style.display = 'block';
            });
        }
        
        // Gestion du formulaire mot de passe oubliÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail')?.value?.trim();
                
                if (!email || !this.isValidEmail(email)) {
                    if (this.notifications) {
                        this.notifications.show('Email invalide', 'error');
                    }
                    return;
                }
                
                if (this.notifications) {
                    this.notifications.show('FonctionnalitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© en dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©veloppement', 'info');
                }
            });
        }
        
        // Toggles de mot de passe
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                }
            });
        });
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    initDashboard() {
        console.log('Initialisation du dashboard - VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rification auth');

        // Attendre un peu pour ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©viter les conflits d'initialisation
        setTimeout(() => {
            // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si AdminApp gÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cette page
            if (window.originalApp && window.AdminApp && window.originalApp instanceof window.AdminApp) {
                console.log('AdminApp dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e, pas de redirection');
                return;
            }

            // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier les droits d'accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s
            if (!this.isLoggedIn) {
                console.log('Utilisateur non connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©, redirection vers connexion');
                if (this.notifications) {
                    this.notifications.show('Veuillez vous connecter', 'error');
                }
                setTimeout(() => {
                    window.location.href = '/pages/connexion.html';
                }, 1500);
                return;
            }

            if (!this.isAdmin()) {
                console.log('Utilisateur non admin, redirection vers accueil');
                if (this.notifications) {
                    this.notifications.show('AccÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s non autorisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© - RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©servÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© aux administrateurs', 'error');
                }
                setTimeout(() => {
                    this.redirectToUserSpace(this.currentUser.role || this.currentUser.userType);
                }, 1500);
                return;
            }

            console.log('Utilisateur admin connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© - Dashboard accessible');
            // Ne pas rediriger, laisser AdminApp gÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rer l'interface
        }, 200);
    }

    initTeamsPage() {
        console.log('Page ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quipes initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    initActualitesPage() {
        console.log('Page actualitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    initHistoriquePage() {
        console.log('Page historique initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    initProfilPage() {
        console.log('Page profil initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    initReservationsPage() {
        console.log('Page rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©servations initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    initPhotosPage() {
        console.log('Page photos initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        if (!images.length) return;
        
        const windowHeight = window.innerHeight;
        
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < windowHeight + 100) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
            }
        });
    }
}

// ============ GESTIONNAIRE DE COOKIES ============
class CookieManager {
    constructor() {
        this.banner = document.getElementById('cookie-banner');
        this.acceptBtn = document.getElementById('accept-cookies');
        this.rejectBtn = document.getElementById('reject-cookies');
        this.init();
    }

    init() {
        if (!this.banner) return;
        
        const choice = this.getChoice();
        
        if (!choice) {
            setTimeout(() => this.showBanner(), 2000);
        } else {
            this.hideBanner();
        }
        
        this.bindEvents();
    }

    showBanner() {
        if (this.banner) {
            this.banner.classList.add('show');
            this.banner.style.display = 'block';
        }
    }

    hideBanner() {
        if (this.banner) {
            this.banner.classList.remove('show');
            this.banner.style.display = 'none';
        }
    }

    bindEvents() {
        if (this.acceptBtn) {
            this.acceptBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.acceptCookies();
            });
        }
        
        if (this.rejectBtn) {
            this.rejectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.rejectCookies();
            });
        }
    }

    acceptCookies() {
        this.setChoice('accepted');
        this.hideBanner();
        this.enableAnalytics();
        if (window.app && window.app.notifications) {
            window.app.notifications.show('PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rences cookies enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es.', 'success');
        }
    }

    rejectCookies() {
        this.setChoice('rejected');
        this.hideBanner();
        this.disableAnalytics();
        if (window.app && window.app.notifications) {
            window.app.notifications.show('Cookies dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sactivÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s.', 'info');
        }
    }

    getChoice() {
        return localStorage.getItem('cookieChoice');
    }

    setChoice(choice) {
        localStorage.setItem('cookieChoice', choice);
        localStorage.setItem('cookieChoiceDate', new Date().toISOString());
    }

    enableAnalytics() {
        console.log('Analytics activÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s');
    }

    disableAnalytics() {
        console.log('Analytics dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sactivÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s');
    }
}

// ============ GESTIONNAIRE DE NAVIGATION ============
class NavigationManager {
    constructor() {
        this.menuToggle = document.getElementById('menuToggle');
        this.navMenu = document.getElementById('navMenu');
        this.init();
    }

    init() {
        if (!this.menuToggle || !this.navMenu) return;
        
        this.bindEvents();
        this.handleResponsive();
        this.updateActiveLink();
    }

    bindEvents() {
        this.menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });
        
        const navLinks = this.navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    this.closeMenu();
                }
            });
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                if (!this.navMenu.contains(e.target) && !this.menuToggle.contains(e.target)) {
                    this.closeMenu();
                }
            }
        });
        
        window.addEventListener('resize', () => this.handleResponsive());
    }

    toggleMenu() {
        this.navMenu.classList.toggle('active');
        const isOpen = this.navMenu.classList.contains('active');
        
        this.menuToggle.innerHTML = isOpen 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
        
        this.menuToggle.setAttribute('aria-expanded', isOpen);
        
        if (isOpen) {
            this.navMenu.style.display = '';
        }
    }

    closeMenu() {
        this.navMenu.classList.remove('active');
        this.menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        this.menuToggle.setAttribute('aria-expanded', 'false');
        
        if (window.innerWidth < 768) {
            this.navMenu.style.display = 'none';
        }
    }

    handleResponsive() {
        if (!this.menuToggle || !this.navMenu) return;
        
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            this.menuToggle.style.display = 'block';
            if (!this.navMenu.classList.contains('active')) {
                this.navMenu.style.display = 'none';
            } else {
                this.navMenu.style.display = '';
            }
        } else {
            this.menuToggle.style.display = 'none';
            this.navMenu.style.display = '';
            this.closeMenu();
        }
    }

    updateActiveLink() {
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'index.html';
        
        const navLinks = this.navMenu.querySelectorAll('a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const linkPath = link.getAttribute('href');
            const linkFile = linkPath.split('/').pop();
            
            if (linkFile === currentFile) {
                link.classList.add('active');
            } else if (currentFile === '' && linkFile === 'index.html') {
                link.classList.add('active');
            }
        });
    }
}

// ============ GESTIONNAIRE DE SLIDERS ============
class SliderManager {
    constructor() {
        this.heroSlider = document.querySelector('.hero-slider');
        this.init();
    }

    init() {
        if (!this.heroSlider) return;
        
        this.slides = this.heroSlider.querySelectorAll('.slide');
        this.prevBtn = document.querySelector('.slider-prev');
        this.nextBtn = document.querySelector('.slider-next');
        this.dotsContainer = document.querySelector('.slider-dots');
        
        if (!this.slides.length) return;
        
        this.currentSlide = 0;
        this.interval = null;
        
        this.createDots();
        this.bindEvents();
        this.startAutoSlide();
    }

    createDots() {
        if (!this.dotsContainer) return;
        
        this.dotsContainer.innerHTML = '';
        this.dots = [];
        
        this.slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = 'slider-dot';
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSlide(index);
            });
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });
    }

    bindEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevSlide();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextSlide();
            });
        }
        
        if (this.heroSlider) {
            this.heroSlider.addEventListener('mouseenter', () => this.stopAutoSlide());
            this.heroSlider.addEventListener('mouseleave', () => this.startAutoSlide());
        }
    }

    goToSlide(index) {
        this.slides[this.currentSlide].classList.remove('active');
        if (this.dots && this.dots[this.currentSlide]) {
            this.dots[this.currentSlide].classList.remove('active');
        }
        
        this.currentSlide = index;
        
        this.slides[this.currentSlide].classList.add('active');
        if (this.dots && this.dots[this.currentSlide]) {
            this.dots[this.currentSlide].classList.add('active');
        }
        
        this.resetAutoSlide();
    }

    nextSlide() {
        let nextIndex = this.currentSlide + 1;
        if (nextIndex >= this.slides.length) nextIndex = 0;
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        let prevIndex = this.currentSlide - 1;
        if (prevIndex < 0) prevIndex = this.slides.length - 1;
        this.goToSlide(prevIndex);
    }

    startAutoSlide() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.nextSlide(), 5000);
    }

    stopAutoSlide() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    resetAutoSlide() {
        this.stopAutoSlide();
        this.startAutoSlide();
    }

    updateSliderSize() {
        if (this.heroSlider) {
            const heroSection = this.heroSlider.closest('.hero');
            if (heroSection) {
                heroSection.style.height = `${Math.min(window.innerHeight * 0.85, 800)}px`;
            }
        }
    }
}

// ============ GESTIONNAIRE D'ANIMATIONS ============
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.animateOnScroll();
        window.addEventListener('scroll', () => this.animateOnScroll());
    }

    animateOnScroll() {
        const elements = document.querySelectorAll('.animation-slideup, .animation-fadein, .stat-card, .feature-card, .sport-card');
        
        elements.forEach(element => {
            if (element.classList.contains('animated')) return;
            
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    }

    addAnimation(element, animationClass) {
        if (!element) return;
        
        element.classList.add(animationClass);
        
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, 800);
    }
}

// ============ GESTIONNAIRE DE FORMULAIRES ============
class FormManager {
    constructor() {
        this.forms = new Map();
        this.init();
    }

    init() {
        this.bindFormEvents();
        this.initRegistrationForm();
    }

    bindFormEvents() {
        document.querySelectorAll('form[data-validate]').forEach(form => {
            this.setupFormValidation(form);
        });
    }

    setupFormValidation(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.validateForm(form)) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                const formId = form.id || 'unknown';
                await this.handleFormSubmit(formId, data, form);
            }
        });
        
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.validateField(field);
                }
            });
        });
    }

    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('[required]');
        
        fields.forEach(field => {
            if (this.isElementVisible(field)) {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            }
        });
        
        const password = form.querySelector('input[type="password"][name="password"]');
        const confirmPassword = form.querySelector('input[type="password"][name="confirmPassword"]');
        
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Les mots de passe ne correspondent pas');
            isValid = false;
        }
        
        return isValid;
    }

    isElementVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    validateField(field) {
        const value = field.value ? field.value.trim() : '';
        const type = field.dataset.dateFormat === 'dd/mm/yyyy' ? 'date' : field.type;
        const name = field.name;
        
        this.clearFieldError(field);
        
        if (field.required && !value) {
            this.showFieldError(field, 'Ce champ est obligatoire');
            return false;
        }
        
        if (!value) return true;
        
        switch(type) {
            case 'email':
                if (!this.validateEmail(value)) {
                    this.showFieldError(field, 'Email invalide');
                    return false;
                }
                break;
                
            case 'tel':
                if (!this.validatePhone(value)) {
                    this.showFieldError(field, 'NumÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ro de tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©phone invalide');
                    return false;
                }
                break;
                
            case 'date':
                if (!this.validateDate(value)) {
                    this.showFieldError(field, 'Date invalide');
                    return false;
                }
                
                if (name && name.includes('dateNaissance')) {
                    const isChild = name.includes('Enfant');
                    if (!this.validateBirthDate(value, isChild)) {
                        if (isChild) {
                            this.showFieldError(field, 'L\'enfant doit avoir entre 3 et 18 ans');
                        } else {
                            this.showFieldError(field, 'Vous devez avoir au moins 18 ans');
                        }
                        return false;
                    }
                }
                break;
                
            case 'password':
                if (!this.validateStrongPassword(value)) {
                    this.showFieldError(field, 'Au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
                    return false;
                }
                break;
        }
        
        if (name === 'codeOptionAdmin' || name === 'codeOptionCoach') {
            if (!this.validateCodeOption(value)) {
                this.showFieldError(field, 'Format: 3 lettres majuscules suivies de 3 chiffres');
                return false;
            }
        }
        
        if (name === 'ccpCoach') {
            if (!this.validateCCP(value)) {
                this.showFieldError(field, 'Format CCP invalide (000-000-000-000)');
                return false;
            }
        }
        
        return true;
    }

    validateBirthDate(dateString, isChild = false) {
        if (!dateString) return false;
        
        try {
            const birthDate = window.ManarDate.parse(dateString);
            
            if (!birthDate || isNaN(birthDate.getTime())) return false;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (birthDate > today) return false;
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();
            
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                age--;
            }
            
            if (isChild) {
                return age >= 3 && age <= 18;
            } else {
                return age >= 18 && age <= 120;
            }
        } catch (e) {
            console.error('Erreur validation date:', e);
            return false;
        }
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentElement.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 5px;';
            field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        const re = /^(\+213|0)[5-7][0-9]{8}$/;
        return re.test(cleanPhone);
    }

    validateDate(date) {
        if (!date) return false;
        return !!window.ManarDate.parse(date);
    }

    validateStrongPassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    }

    validateCodeOption(code) {
        const re = /^[A-Z]{3}\d{3}$/;
        return re.test(code);
    }

    validateCCP(ccp) {
        const re = /^\d{3}-\d{3}-\d{3}-\d{3}$/;
        return re.test(ccp);
    }

    async handleFormSubmit(formId, data, formElement) {
        switch(formId) {
            case 'registrationForm':
                await this.handleRegistration(data, formElement);
                break;
            case 'loginForm':
                if (window.app && window.app.auth) await window.app.auth.login(data.email, data.password);
                break;
            case 'quickContact':
                if (window.app && window.app.contact) await window.app.contact.sendMessage(data);
                break;
            default:
                await this.submitGenericForm(data, formElement);
        }
    }

    async handleRegistration(data, formElement) {
        try {
            const fileInputs = formElement.querySelectorAll('input[type="file"]');
            const files = [];
            
            for (const input of fileInputs) {
                if (input.files && input.files[0]) {
                    const f = input.files[0];
                    files.push({
                        field: input.name || input.id || 'document',
                        name: f.name,
                        size: f.size,
                        type: f.type,
                        lastModified: f.lastModified || Date.now()
                    });
                }
            }
            
            data.files = files;
            data.userType = formElement.querySelector('#userType')?.value || 'athlete';
            data.role = data.userType;
            data.dateNaissance = window.ManarDate.toStorage(data.dateNaissance);
            data.registrationDate = new Date().toLocaleDateString('fr-FR');
            data.status = 'active';
            
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            const emailExists = users.some(user => user.email === data.email);
            if (emailExists) {
                if (window.app && window.app.notifications) {
                    window.app.notifications.show('Cet email est dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  utilisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', 'error');
                }
                return false;
            }
            
            const newUser = {
                ...data,
                id: Date.now(),
                password: data.password // Garder en clair pour la dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©mo
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er la session automatiquement
            const session = {
                id: newUser.id,
                nom: newUser.nom,
                prenom: newUser.prenom,
                email: newUser.email,
                role: newUser.role,
                userType: newUser.userType,
                dateNaissance: newUser.dateNaissance,
                telephone: newUser.telephone,
                sport: newUser.sport || null,
                niveau: newUser.niveau || null
            };
            
            localStorage.setItem('currentSession', JSON.stringify(session));
            
            if (window.app && window.app.notifications) {
                window.app.notifications.show('Inscription rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ussie! Redirection vers votre espace...', 'success');
            }
            
            // Redirection intelligente
            setTimeout(() => {
                if (window.app) {
                    window.app.redirectToUserSpace(data.role);
                } else {
                    window.location.href = '/index.html';
                }
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Erreur inscription:', error);
            if (window.app && window.app.notifications) {
                window.app.notifications.show('Erreur lors de l\'inscription', 'error');
            }
            return false;
        }
    }

    async submitGenericForm(data, formElement) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.app && window.app.notifications) {
                window.app.notifications.show('Formulaire soumis avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s!', 'success');
            }
            formElement.reset();
            
            return true;
        } catch (error) {
            if (window.app && window.app.notifications) {
                window.app.notifications.show('Erreur lors de la soumission', 'error');
            }
            return false;
        }
    }

    initRegistrationForm() {
        const registrationForm = document.getElementById('registrationForm');
        if (!registrationForm) return;
        
        this.setMaxDateForBirthFields();
        
        const userTypeSelect = document.getElementById('userType');
        const userTypeCards = document.querySelectorAll('.user-type-card');
        
        userTypeCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                if (userTypeSelect) {
                    userTypeSelect.value = type;
                }
                userTypeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.showRoleFields(type);
                
                // Si c'est un parent, ajouter un premier enfant
                if (type === 'parent') {
                    const container = document.getElementById('enfantsContainer');
                    if (container && container.children.length === 0) {
                        this.ajouterEnfant();
                    }
                }
            });
        });
        
        if (userTypeSelect) {
            userTypeSelect.addEventListener('change', () => {
                const type = userTypeSelect.value;
                userTypeCards.forEach(card => {
                    card.classList.toggle('selected', card.dataset.type === type);
                });
                this.showRoleFields(type);
            });
        }
        
        registrationForm.querySelectorAll('.next-step').forEach(button => {
            button.addEventListener('click', () => {
                const currentStep = button.closest('.form-step');
                const nextStepId = button.dataset.next;
                const nextStep = document.getElementById(nextStepId);
                
                if (currentStep && nextStep) {
                    if (this.validateStep(currentStep)) {
                        currentStep.classList.remove('active');
                        nextStep.classList.add('active');
                        window.scrollTo({
                            top: nextStep.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
        
        registrationForm.querySelectorAll('.prev-step').forEach(button => {
            button.addEventListener('click', () => {
                const currentStep = button.closest('.form-step');
                const prevStepId = button.dataset.prev;
                const prevStep = document.getElementById(prevStepId);
                
                if (currentStep && prevStep) {
                    currentStep.classList.remove('active');
                    prevStep.classList.add('active');
                    window.scrollTo({
                        top: prevStep.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        this.setupMaladieToggle('hasMaladieCoach', 'nomMaladieCoach');
        this.setupMaladieToggle('hasMaladieAthlete', 'nomMaladieAthlete');
        
        const ajouterEnfantBtn = document.getElementById('ajouterEnfant');
        if (ajouterEnfantBtn) {
            ajouterEnfantBtn.addEventListener('click', () => this.ajouterEnfant());
        }
    }

    setMaxDateForBirthFields() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const adultMaxYear = year - 18;
        const adultMaxDate = `${adultMaxYear}-${month}-${day}`;
        const adultMinYear = year - 100;
        const adultMinDate = `${adultMinYear}-${month}-${day}`;
        
        const childMaxYear = year - 3;
        const childMaxDate = `${childMaxYear}-${month}-${day}`;
        const childMinYear = year - 18;
        const childMinDate = `${childMinYear}-${month}-${day}`;
        
        const dateNaissance = document.getElementById('dateNaissance');
        if (dateNaissance) {
            dateNaissance.dataset.maxDate = adultMaxDate;
            dateNaissance.dataset.minDate = adultMinDate;
        }
        
        const enfantDateFields = document.querySelectorAll('[id^="dateNaissanceEnfant"]');
        enfantDateFields.forEach(field => {
            field.dataset.maxDate = childMaxDate;
            field.dataset.minDate = childMinDate;
        });
    }

    validateStep(step) {
        let isValid = true;
        const inputs = step.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.required && this.isElementVisible(input)) {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    showRoleFields(type) {
        const roleFields = document.querySelectorAll('.role-fields');
        roleFields.forEach(field => {
            field.style.display = 'none';
            
            field.querySelectorAll('input[required], select[required]').forEach(input => {
                input.required = false;
            });
        });
        
        const specificFields = document.getElementById(type + 'Fields');
        if (specificFields) {
            specificFields.style.display = 'block';
            
            specificFields.querySelectorAll('input[required], select[required]').forEach(input => {
                input.required = true;
            });
            
            if (type === 'parent') {
                setTimeout(() => {
                    this.setMaxDateForBirthFields();
                }, 100);
            }
        }
    }

    setupMaladieToggle(checkboxId, inputId) {
        const checkbox = document.getElementById(checkboxId);
        const input = document.getElementById(inputId);
        
        if (checkbox && input) {
            checkbox.addEventListener('change', function() {
                input.style.display = this.checked ? 'block' : 'none';
                if (this.checked) {
                    input.setAttribute('required', 'required');
                } else {
                    input.removeAttribute('required');
                    input.value = '';
                }
            });
        }
    }

    ajouterEnfant() {
        const container = document.getElementById('enfantsContainer');
        if (!container) return;
        
        const enfantForms = container.querySelectorAll('.enfant-form');
        const index = enfantForms.length + 1;
        
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const childMaxYear = year - 3;
        const childMaxDate = `${childMaxYear}-${month}-${day}`;
        const childMinYear = year - 18;
        const childMinDate = `${childMinYear}-${month}-${day}`;
        
        const newForm = document.createElement('div');
        newForm.className = 'enfant-form';
        newForm.id = `enfant-form-${index}`;
        newForm.style.cssText = 'position: relative; padding: 20px; margin-bottom: 20px; border: 1px solid #dee2e6; border-radius: 8px; background-color: #f9f9f9;';
        
        newForm.innerHTML = `
            <button type="button" class="btn-remove-enfant" style="position: absolute; right: 10px; top: 10px; background: none; border: none; color: #dc3545; cursor: pointer; font-size: 20px;">
                <i class="fas fa-times-circle"></i>
            </button>
            
            <h5 style="margin-bottom: 15px; color: #007bff; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-child"></i> Enfant ${index}
            </h5>
            
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label for="nomEnfant${index}" class="form-label">Nom de l'enfant *</label>
                    <input type="text" id="nomEnfant${index}" name="nomEnfant[]" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="prenomEnfant${index}" class="form-label">PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nom de l'enfant *</label>
                    <input type="text" id="prenomEnfant${index}" name="prenomEnfant[]" class="form-control" required>
                </div>
            </div>
            
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label for="dateNaissanceEnfant${index}" class="form-label">Date de naissance *</label>
                    <input type="text" id="dateNaissanceEnfant${index}" name="dateNaissanceEnfant[]" 
                           class="form-control" placeholder="dd/mm/yyyy" inputmode="numeric" maxlength="10" data-date-format="dd/mm/yyyy" required data-max-date="${childMaxDate}" data-min-date="${childMinDate}">
                    <small class="date-info-child" style="display: block; color: #6c757d; font-size: 0.85rem; margin-top: 5px;">
                        <i class="fas fa-info-circle"></i> L'enfant doit avoir entre 3 et 18 ans (nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©(e) entre ${childMinYear} et ${childMaxYear})
                    </small>
                </div>
                <div class="form-group">
                    <label for="sexeEnfant${index}" class="form-label">Sexe *</label>
                    <select id="sexeEnfant${index}" name="sexeEnfant[]" class="form-select" required>
                        <option value="">SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lectionnez</option>
                        <option value="M">GarÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§on</option>
                        <option value="F">Fille</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="sportEnfant${index}" class="form-label">Sport de l'enfant *</label>
                <select id="sportEnfant${index}" name="sportEnfant[]" class="form-select" required>
                    <option value="">SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lectionnez un sport</option>
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="handball">Handball</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="tennis">Tennis</option>
                    <option value="natation">Natation</option>
                    <option value="athletisme">AthlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tisme</option>
                    <option value="judo">Judo</option>
                    <option value="karate">Karate</option>
                    <option value="gymnastique">Gymnastique</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="certificatMedicalEnfant${index}" class="form-label">Certificat mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dical *</label>
                <input type="file" id="certificatMedicalEnfant${index}" name="certificatMedicalEnfant[]" 
                       class="form-control" accept=".pdf,.jpg,.png" required>
            </div>
            
            <div class="form-group">
                <div class="checkbox-group" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="hasMaladieEnfant${index}" name="hasMaladieEnfant[]" style="width: auto;">
                    <label for="hasMaladieEnfant${index}">L'enfant a une maladie chronique</label>
                </div>
                <input type="text" id="nomMaladieEnfant${index}" name="nomMaladieEnfant[]" class="form-control" 
                       placeholder="Nom de la maladie" style="display: none; margin-top: 10px;">
            </div>
            
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label for="photoEnfant${index}" class="form-label">Photo *</label>
                    <input type="file" id="photoEnfant${index}" name="photoEnfant[]" 
                           class="form-control" accept=".jpg,.jpeg,.png" required>
                </div>
                <div class="form-group">
                    <label for="extraitNaissanceEnfant${index}" class="form-label">Extrait de naissance *</label>
                    <input type="file" id="extraitNaissanceEnfant${index}" name="extraitNaissanceEnfant[]" 
                           class="form-control" accept=".pdf,.jpg,.png" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="permissionParentale${index}" class="form-label">Permission parentale signÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e *</label>
                <input type="file" id="permissionParentale${index}" name="permissionParentale[]" 
                       class="form-control" accept=".pdf,.jpg,.png" required>
            </div>
        `;
        
        container.appendChild(newForm);
        
        this.setupMaladieToggle(`hasMaladieEnfant${index}`, `nomMaladieEnfant${index}`);
        
        const removeBtn = newForm.querySelector('.btn-remove-enfant');
        removeBtn.addEventListener('click', () => {
            newForm.remove();
        });
        
        const fileInputs = newForm.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', function() {
                const fileName = this.files[0]?.name;
                if (fileName) {
                    const oldName = this.parentElement.querySelector('.file-name');
                    if (oldName) oldName.remove();
                    
                    const fileNameSpan = document.createElement('span');
                    fileNameSpan.className = 'file-name';
                    fileNameSpan.style.cssText = 'display: block; font-size: 0.85rem; color: #28a745; margin-top: 5px;';
                    fileNameSpan.innerHTML = `<i class="fas fa-check-circle"></i> ${fileName}`;
                    this.parentElement.appendChild(fileNameSpan);
                }
            });
        });
        
        setTimeout(() => {
            newForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// ============ GESTIONNAIRE DE MODALS ============
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    init() {
        this.bindModalEvents();
    }

    bindModalEvents() {
        document.querySelectorAll('[data-modal]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.dataset.modal;
                this.openModal(modalId);
            });
        });
        
        document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(button => {
            button.addEventListener('click', () => this.closeCurrentModal());
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeCurrentModal();
            }
        });
    }

    openModal(modalId) {
        const modalIdFormatted = `modal${this.capitalize(modalId)}`;
        const modal = document.getElementById(modalIdFormatted);
        
        if (!modal) {
            console.warn(`Modal ${modalIdFormatted} non trouvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©`);
            return;
        }
        
        modal.classList.add('show');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        this.modals.set(modalId, modal);
    }

    closeModal(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            this.modals.delete(modalId);
        }
        
        if (this.modals.size === 0) {
            document.body.style.overflow = '';
        }
    }

    closeCurrentModal() {
        if (this.modals.size > 0) {
            const [modalId] = this.modals.entries().next().value;
            this.closeModal(modalId);
        }
    }

    closeAll() {
        this.modals.forEach((modal, modalId) => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
        this.modals.clear();
        document.body.style.overflow = '';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// ============ GESTIONNAIRE D'AUTHENTIFICATION ============
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.createDemoUsers();
        this.currentUser = this.getCurrentUser();
    }

    createDemoUsers() {
        const existingUsers = localStorage.getItem('users');
        
        if (!existingUsers || JSON.parse(existingUsers).length === 0) {
            const users = [
                { 
                    id: 1, 
                    nom: 'Admin', 
                    prenom: 'System', 
                    email: 'admin@manarsport.dz', 
                    password: 'admin123', 
                    role: 'admin', 
                    status: 'active' 
                },
                { 
                    id: 2, 
                    nom: 'Coach', 
                    prenom: 'Karim', 
                    email: 'coach@manarsport.dz', 
                    password: 'coach123', 
                    role: 'coach', 
                    status: 'active' 
                },
                { 
                    id: 3, 
                    nom: 'AthlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨te', 
                    prenom: 'Yacine', 
                    email: 'athlete@manarsport.dz', 
                    password: 'athlete123', 
                    role: 'athlete', 
                    status: 'active' 
                },
                { 
                    id: 4, 
                    nom: 'Parent', 
                    prenom: 'Leila', 
                    email: 'parent@manarsport.dz', 
                    password: 'parent123', 
                    role: 'parent', 
                    status: 'active' 
                }
            ];
            localStorage.setItem('users', JSON.stringify(users));
            console.log('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Utilisateurs de dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©mo crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s');
        }
    }

    async login(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const normalizedEmail = email.trim().toLowerCase();
        const user = users.find(u => {
            return u.email && String(u.email).trim().toLowerCase() === normalizedEmail
                && (u.password === password || u.password === btoa(password))
                && u.status !== 'inactive';
        });
        
        if (user) {
            this.currentUser = { ...user };
            delete this.currentUser.password;
            this.setCurrentUser(this.currentUser);
            if (window.app && typeof window.app.clearLoginError === 'function') {
                window.app.clearLoginError();
            }
            
            if (window.app && window.app.notifications) {
                window.app.notifications.show('Connexion rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ussie! Redirection...', 'success');
            }
            
            // Redirection intelligente
            setTimeout(() => {
                if (window.app) {
                    window.app.redirectToUserSpace(user.role || user.userType);
                } else {
                    window.location.href = '/index.html';
                }
            }, 1500);
            
            return true;
        }
        
        if (window.app && typeof window.app.showLoginError === 'function') {
            window.app.showLoginError('Email ou mot de passe incorrect');
        }
        
        return false;
    }

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentSession');
        this.currentUser = null;
        
        if (window.app && window.app.notifications) {
            window.app.notifications.show('DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©connexion rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ussie', 'success');
        }
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }

    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser') || localStorage.getItem('currentSession');
        return userJson ? JSON.parse(userJson) : null;
    }

    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('currentSession', JSON.stringify(user));
        
        const token = btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            expires: Date.now() + 24 * 60 * 60 * 1000
        }));
        localStorage.setItem('authToken', token);
    }

    isAuthenticated() {
        return !!this.currentUser || !!localStorage.getItem('currentUser') || !!localStorage.getItem('currentSession');
    }

    hasRole(role) {
        if (!this.currentUser) return false;
        const userRole = this.currentUser.role || this.currentUser.userType;
        return userRole === role;
    }

    initLoginForm() {
        // Cette mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©thode est maintenant dans ManarSportApp.initLoginPage()
        console.log('AuthManager: initLoginForm appelÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
    }
}

// ============ GESTIONNAIRE DE NOTIFICATIONS ============
class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        if (document.querySelector('.notifications-container')) return;
        
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        if (!this.container) this.createContainer();
        
        const id = 'notification-' + Date.now();
        const icon = this.getIconForType(type);
        
        const colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeeba' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };
        
        const style = colors[type] || colors.info;
        
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            font-size: 14px;
            animation: slideIn 0.3s ease-in-out;
            background-color: ${style.bg};
            color: ${style.color};
            border: 1px solid ${style.border};
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="${icon}" style="font-size: 18px;"></i>
                <span>${message}</span>
            </div>
            <button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; padding: 0 5px;">&times;</button>
        `;
        
        this.container.appendChild(notification);
        
        if (!document.getElementById('notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'notification-styles';
            styleSheet.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        const closeBtn = notification.querySelector('button');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease-in-out';
            setTimeout(() => notification.remove(), 300);
        });
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease-in-out';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    getIconForType(type) {
        switch(type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }

    success(message, duration = 5000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        this.show(message, 'info', duration);
    }
}

// ============ GESTIONNAIRE DE CONTACT ============
class ContactManager {
    constructor() {
        this.init();
    }

    init() {}

    async sendMessage(data) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
            messages.push({
                ...data,
                id: Date.now(),
                read: false,
                date: new Date().toISOString()
            });
            localStorage.setItem('contactMessages', JSON.stringify(messages));
            
            return true;
        } catch (error) {
            console.error('Erreur envoi message:', error);
            return false;
        }
    }

    async subscribeNewsletter(email) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
            
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
            }
            
            return true;
        } catch (error) {
            console.error('Erreur abonnement:', error);
            return false;
        }
    }
}

// ============ GESTIONNAIRE DE GALERIE ============
class GalleryManager {
    constructor() {
        this.isAdminMode = false;
        this.init();
    }

    init() {
        if (window.app) {
            this.isAdminMode = window.app.isAdmin();
        }
    }

    setAdminMode(isAdmin) {
        this.isAdminMode = isAdmin;
    }

    initGallery() {
        const gallery = document.querySelector('.gallery-grid');
        if (!gallery) return;
        
        this.loadGalleryPhotos();
        this.setupLightbox();
        this.addAdminButtons();
    }

    loadGalleryPhotos() {
        const gallery = document.querySelector('.gallery-grid');
        if (!gallery) return;
        
        const photos = JSON.parse(localStorage.getItem('galleryPhotos') || '[]');
        
        if (photos.length === 0) {
            gallery.innerHTML = '<div class="no-photos">Aucune photo disponible</div>';
            return;
        }
        
        gallery.innerHTML = '';
        photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${photo.image}" alt="${photo.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h3>${photo.title}</h3>
                    <p>${photo.description}</p>
                    <span class="gallery-category">${photo.category}</span>
                </div>
            `;
            gallery.appendChild(item);
        });
    }

    setupLightbox() {
        const images = document.querySelectorAll('.gallery-item img');
        
        images.forEach(img => {
            img.addEventListener('click', () => this.openLightbox(img));
        });
    }

    addAdminButtons() {
        if (!this.isAdminMode) return;
        
        const gallery = document.querySelector('.gallery-grid');
        if (gallery) {
            const adminBar = document.createElement('div');
            adminBar.className = 'gallery-admin-bar';
            adminBar.style.cssText = 'margin-bottom: 20px; text-align: right;';
            adminBar.innerHTML = `
                <button class="btn btn-primary" onclick="window.galleryManager.uploadPhoto()">
                    <i class="fas fa-upload"></i> Ajouter une photo
                </button>
                <button class="btn btn-secondary" onclick="window.galleryManager.manageGallery()">
                    <i class="fas fa-cog"></i> GÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rer la galerie
                </button>
            `;
            gallery.parentNode.insertBefore(adminBar, gallery);
        }
    }

    openLightbox(img) {
        if (document.querySelector('.lightbox')) {
            document.querySelector('.lightbox').remove();
        }
        
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        lightbox.innerHTML = `
            <button class="lightbox-close" style="position: absolute; top: 20px; right: 30px; background: none; border: none; color: white; font-size: 40px; cursor: pointer;">&times;</button>
            <div class="lightbox-content" style="max-width: 90%; max-height: 90%;">
                <img src="${img.src}" alt="${img.alt}" style="max-width: 100%; max-height: 90vh; object-fit: contain;">
                <div class="lightbox-caption" style="color: white; text-align: center; margin-top: 15px;">${img.alt}</div>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        
        const closeBtn = lightbox.querySelector('.lightbox-close');
        closeBtn.addEventListener('click', () => lightbox.remove());
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.remove();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.parentNode) {
                lightbox.remove();
            }
        }, { once: true });
    }

    uploadPhoto() {
        alert('FonctionnalitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© d\'upload ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  implÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©menter');
    }

    manageGallery() {
        alert('FonctionnalitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© de gestion ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  implÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©menter');
    }
}

// ============ GESTIONNAIRE DE PLANNING ============
class PlanningManager {
    constructor() {
        this.calendar = null;
        this.init();
    }

    init() {}

    initCalendar() {
        if (typeof FullCalendar === 'undefined') {
            console.warn('FullCalendar non chargÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©');
            return;
        }
        
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        
        try {
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'fr',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                events: this.getEvents(),
                eventClick: (info) => this.handleEventClick(info),
                height: 'auto',
                navLinks: true,
                editable: false,
                selectable: false,
                dayMaxEvents: true,
                firstDay: 1,
                eventDisplay: 'block',
                eventTimeFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }
            });
            
            this.calendar.render();
            this.loadEvents();
        } catch (error) {
            console.error('Erreur initialisation calendrier:', error);
        }
    }

    getEvents() {
        const events = JSON.parse(localStorage.getItem('eventsData') || '[]');
        
        return events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.date,
            end: event.endDate,
            description: event.description,
            extendedProps: {
                sport: event.sport,
                location: event.location,
                type: event.type
            },
            color: this.getEventColor(event.type)
        }));
    }

    getEventColor(type) {
        switch(type) {
            case 'competition': return '#ef4444';
            case 'training': return '#3b82f6';
            case 'event': return '#10b981';
            case 'meeting': return '#f59e0b';
            default: return '#6b7280';
        }
    }

    async loadEvents() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const events = this.getEvents();
            if (this.calendar) {
                this.calendar.removeAllEvents();
                this.calendar.addEventSource(events);
            }
        } catch (error) {
            console.error('Erreur chargement ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements:', error);
        }
    }

    handleEventClick(info) {
        const event = info.event;
        
        const modalHTML = `
            <div class="modal show" style="display: block; position: fixed; z-index: 10000;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-calendar-alt"></i> ${event.title}</h3>
                        <button class="modal-close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; gap: 15px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-tag" style="color: #6c757d;"></i>
                                <strong>Sport:</strong> ${event.extendedProps.sport || 'Non spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-calendar" style="color: #6c757d;"></i>
                                <strong>Date:</strong> ${window.ManarDate.format(event.start)}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-clock" style="color: #6c757d;"></i>
                                <strong>Heure:</strong> ${event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-map-marker-alt" style="color: #6c757d;"></i>
                                <strong>Lieu:</strong> ${event.extendedProps.location || 'Non spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-info-circle" style="color: #6c757d;"></i>
                                <strong>Description:</strong> ${event.extendedProps.description || 'Aucune description'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstChild);
        
        const modal = document.querySelector('.modal:last-child');
        const closeBtn = modal.querySelector('.modal-close');
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

// ============ INITIALISATION DE L'APPLICATION ============
document.addEventListener('DOMContentLoaded', () => {
    // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si une app spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e existe dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  (comme AdminApp)
    if (window.app && !(window.app instanceof ManarSportApp)) {
        console.log('App spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e, utilisation du systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me existant');
        return;
    }
    
    // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er l'instance de l'application
    window.app = new ManarSportApp();
    
    // Exposer les gestionnaires pour un accÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s global
    window.cookies = window.app.cookies;
    window.navigation = window.app.navigation;
    window.sliders = window.app.sliders;
    window.animations = window.app.animations;
    window.forms = window.app.forms;
    window.modals = window.app.modals;
    window.auth = window.app.auth;
    window.notifications = window.app.notifications;
    window.contact = window.app.contact;
    window.gallery = window.app.gallery;
    window.planning = window.app.planning;
    
    // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier le paramÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨tre registered=true dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true' && window.notifications) {
        setTimeout(() => {
            window.notifications.show('Inscription rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ussie ! Vous pouvez maintenant vous connecter.', 'success');
        }, 500);
    }
    
    console.log('Application Manar Sport initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e');
});


