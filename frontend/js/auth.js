// Auth modal management
class AuthModal {
    constructor() {
        this.modal = null;
        this.isLogin = true;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const modalHTML = `
            <div id="authModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div class="auth-container">
                        <div class="auth-tabs">
                            <button class="tab-button active" data-tab="login">Вход</button>
                            <button class="tab-button" data-tab="register">Регистрация</button>
                        </div>
                        
                        <div id="loginTab" class="auth-tab active">
                            <h2>Вход в аккаунт</h2>
                            <form id="loginForm">
                                <div class="form-group">
                                    <label for="loginEmail">Email:</label>
                                    <input type="email" id="loginEmail" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="loginPassword">Пароль:</label>
                                    <input type="password" id="loginPassword" name="password" required>
                                </div>
                                <button type="submit" class="auth-button">Войти</button>
                            </form>
                        </div>
                        
                        <div id="registerTab" class="auth-tab">
                            <h2>Регистрация</h2>
                            <form id="registerForm">
                                <div class="form-group">
                                    <label for="registerEmail">Email:</label>
                                    <input type="email" id="registerEmail" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="registerPassword">Пароль:</label>
                                    <input type="password" id="registerPassword" name="password" required>
                                </div>
                                <div class="form-group">
                                    <label for="registerFirstName">Имя:</label>
                                    <input type="text" id="registerFirstName" name="first_name">
                                </div>
                                <button type="submit" class="auth-button">Зарегистрироваться</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('authModal');
    }

    bindEvents() {
        // Close modal events
        this.modal.querySelector('.close').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Tab switching
        this.modal.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
    }

    switchTab(tab) {
        // Update tab buttons
        this.modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        this.modal.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update tab content
        this.modal.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        this.modal.querySelector(`#${tab}Tab`).classList.add('active');

        this.isLogin = tab === 'login';
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await api.login(email, password);
            
            // Get user info after successful login
            try {
                const userInfo = await api.request('/users/me');
                authManager.setUser(userInfo, userInfo.role === 'admin');
            } catch (userError) {
                // If /users/me endpoint doesn't exist, create basic user info from token
                const token = response.access_token;
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userInfo = { email: payload.sub, role: payload.role || 'client' };
                authManager.setUser(userInfo, userInfo.role === 'admin');
            }
            
            this.close();
            this.showMessage('Успешный вход!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            first_name: formData.get('first_name') || null,
        };

        try {
            const response = await api.register(userData);
            authManager.setUser(response, response.role === 'admin');
            
            this.close();
            this.showMessage('Регистрация успешна!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    show() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear forms
        this.modal.querySelectorAll('form').forEach(form => form.reset());
    }

    showMessage(message, type) {
        // Create or update message element
        let messageEl = document.querySelector('.auth-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'auth-message';
            this.modal.querySelector('.auth-container').appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageEl) messageEl.remove();
        }, 3000);
    }
}

// Initialize auth modal
const authModal = new AuthModal();

// Bind user button click to show modal
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth manager
    await authManager.init();
    
    const userButton = document.querySelector('.user-button');
    const adminButton = document.querySelector('.admin-button');
    
    if (userButton) {
        userButton.addEventListener('click', () => {
            if (authManager.currentUser) {
                // Show logout option or user menu
                if (confirm('Выйти из аккаунта?')) {
                    authManager.clearAuth();
                }
            } else {
                authModal.show();
            }
        });
    }
    
    if (adminButton) {
        adminButton.addEventListener('click', () => {
            if (authManager.isAdmin) {
                window.location.href = 'admin.html';
            }
        });
    }
});
