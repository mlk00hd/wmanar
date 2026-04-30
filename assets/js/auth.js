class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.loadSession();
        this.initLoginForm();
        this.initForgotPassword();
        this.redirectToCorrectPage();
    }

    loadSession() {
        try {
            const session = localStorage.getItem('currentSession');
            this.currentUser = session ? JSON.parse(session) : null;
            this.isLoggedIn = !!this.currentUser;
        } catch (e) {
            console.error('Erreur session:', e);
            this.logout();
        }
    }

    initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm || loginForm.dataset.initialized) return;
        loginForm.dataset.initialized = 'true';

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const remember = document.getElementById('remember')?.checked || false;

            if (!email || !password || !this.isValidEmail(email)) {
                this.showLoginError('Email ou mot de passe incorrect');
                return;
            }

            this.login(email, password, remember);
        });
    }

    initForgotPassword() {
        const forgotLink = document.getElementById('forgotPasswordLink');
        const forgotForm = document.getElementById('forgotPasswordForm');
        const backToLogin = document.getElementById('backToLogin');
        const loginForm = document.getElementById('loginForm');

        if (forgotLink && forgotForm && loginForm) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.style.display = 'none';
                forgotForm.style.display = 'block';
                this.clearLoginError();
            });
        }

        if (backToLogin && forgotForm && loginForm) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                forgotForm.style.display = 'none';
                loginForm.style.display = 'block';
            });
        }

        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail')?.value.trim();
                this.handleForgotPassword(email);
            });
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    getProfilePictureFromUser(user) {
        if (!user) return null;
        if (typeof user.profilePicture === 'string' && user.profilePicture.startsWith('data:image')) {
            return user.profilePicture;
        }
        const docs = Array.isArray(user.documents) ? user.documents : [];
        const photoDoc = docs.find((doc) => /photo/i.test(doc.name || '') && doc.dataUrl && doc.dataUrl.startsWith('data:image'));
        return photoDoc ? photoDoc.dataUrl : null;
    }

    login(email, password, remember = false) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const normalizedEmail = email.trim().toLowerCase();
        const user = users.find((entry) => entry.email && String(entry.email).trim().toLowerCase() === normalizedEmail);

        if (!user) {
            this.showLoginError('Email ou mot de passe incorrect');
            return false;
        }

        const passwordMatches = user.password === password || user.password === btoa(password);
        if (!passwordMatches || user.status === 'inactive') {
            this.showLoginError('Email ou mot de passe incorrect');
            return false;
        }

        if (user.status === 'pending') {
            this.showMessage('Votre compte est en attente de validation.', 'warning');
            return false;
        }

        this.currentUser = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role || user.userType || 'membre',
            userType: user.userType || user.role || 'membre',
            adminFunction: user.adminFunction || '',
            profilePicture: this.getProfilePictureFromUser(user)
        };

        this.isLoggedIn = true;
        localStorage.setItem('currentSession', JSON.stringify(this.currentUser));
        this.clearLoginError();

        if (remember) {
            const date = new Date();
            date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
            document.cookie = `session_id=${user.id}; expires=${date.toUTCString()}; path=/`;
        }

        this.showMessage('Connexion réussie ! Redirection...', 'success');
        setTimeout(() => this.redirectToUserSpace(this.currentUser.role), 1500);
        return true;
    }

    redirectToUserSpace(role) {
        let redirectUrl = '../index.html';
        if (role === 'admin') redirectUrl = '../admin/dashboard.html';
        if (role === 'coach') redirectUrl = '../pages/espace-coach.html';
        if (role === 'athlete') redirectUrl = '../pages/espace-athlete.html';
        if (role === 'parent') redirectUrl = '../pages/espace-parent.html';
        window.location.href = redirectUrl;
    }

    redirectToCorrectPage() {
        if (!this.currentUser) return;
        const currentPath = window.location.pathname;
        const role = this.currentUser.role;
        if (currentPath.includes('/admin/') && role !== 'admin') {
            this.showMessage('Accès non autorisé', 'error');
            setTimeout(() => { window.location.href = '../index.html'; }, 1500);
        }
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentSession');
        document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.showMessage('Déconnexion réussie', 'success');
        setTimeout(() => { window.location.href = '../index.html'; }, 1500);
    }

    handleForgotPassword(email) {
        if (!email || !this.isValidEmail(email)) {
            this.showMessage('Email invalide', 'error');
            return;
        }

        this.showMessage('Envoi du lien de réinitialisation...', 'info');
        setTimeout(() => {
            this.showMessage('Un lien vous a été envoyé par email.', 'success');
            const forgotForm = document.getElementById('forgotPasswordForm');
            const loginForm = document.getElementById('loginForm');
            if (forgotForm && loginForm) {
                forgotForm.style.display = 'none';
                loginForm.style.display = 'block';
            }
        }, 1500);
    }

    isAuthenticated() {
        return this.isLoggedIn;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    isCoach() {
        return this.hasRole('coach');
    }

    isAthlete() {
        return this.hasRole('athlete');
    }

    isParent() {
        return this.hasRole('parent');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    showMessage(message, type = 'info') {
        const authMessages = document.getElementById('authMessages');
        if (authMessages) {
            authMessages.style.display = 'flex';
            authMessages.className = `auth-messages ${type}`;
            authMessages.innerHTML = `
                <i class="fas fa-${
                    type === 'success' ? 'check-circle'
                        : type === 'error' ? 'exclamation-circle'
                            : type === 'warning' ? 'exclamation-triangle'
                                : 'info-circle'
                }"></i>
                <span>${message}</span>
            `;
            authMessages.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        window.auth.showMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
    }
});
