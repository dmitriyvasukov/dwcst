// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// API Client
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                // If unauthorized, clear auth and redirect to login
                if (response.status === 401) {
                    authManager.clearAuth();
                    if (window.location.pathname.includes('admin.html')) {
                        window.location.href = 'index.html';
                    }
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        this.setToken(data.access_token);
        return data;
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    // Product endpoints
    async getProducts() {
        return await this.request('/products');
    }

    async getProduct(id) {
        return await this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        return await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    }

    async updateProduct(id, productData) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    }

    async deleteProduct(id) {
        return await this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    }

    // Cart endpoints
    async getCart() {
        return await this.request('/cart');
    }

    async addToCart(productId, quantity = 1) {
        return await this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity }),
        });
    }

    async updateCartItem(itemId, quantity) {
        return await this.request(`/cart/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
    }

    async removeFromCart(itemId) {
        return await this.request(`/cart/items/${itemId}`, {
            method: 'DELETE',
        });
    }

    // Promo endpoints
    async getPromos() {
        return await this.request('/promo');
    }

    async createPromo(promoData) {
        return await this.request('/promo', {
            method: 'POST',
            body: JSON.stringify(promoData),
        });
    }

    async updatePromo(id, promoData) {
        return await this.request(`/promo/${id}`, {
            method: 'PUT',
            body: JSON.stringify(promoData),
        });
    }

    async deletePromo(id) {
        return await this.request(`/promo/${id}`, {
            method: 'DELETE',
        });
    }

    // Orders endpoints
    async getOrders() {
        return await this.request('/orders');
    }

    async createOrder(orderData) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async updateOrderStatus(id, status) {
        return await this.request(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Upload endpoints
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${this.baseURL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': this.token ? `Bearer ${this.token}` : '',
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async deleteFile(filename) {
        return await this.request(`/upload/files/${filename}`, {
            method: 'DELETE',
        });
    }

    getFileUrl(filename) {
        return `${this.baseURL}/upload/files/${filename}`;
    }
}

// Global API client instance
const api = new ApiClient();

// Auth state management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.initialized = false;
    }

    async init() {
        if (!this.initialized) {
            await this.loadUserFromStorage();
            this.initialized = true;
        }
    }

    async loadUserFromStorage() {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                // Decode token to get basic user info
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Check if token is expired
                const currentTime = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp < currentTime) {
                    console.log('Token expired, clearing auth');
                    this.clearAuth();
                    return;
                }
                
                this.currentUser = { email: payload.sub };
                
                // Try to get full user info from API
                try {
                    const userInfo = await api.request('/users/me');
                    this.currentUser = userInfo;
                    this.isAdmin = userInfo.role === 'admin';
                } catch (apiError) {
                    // If API call fails, try to get role from token
                    this.isAdmin = payload.role === 'admin';
                    console.log('Could not fetch user info from API, using token data');
                }
                
                this.updateUI();
            } catch (e) {
                console.error('Error decoding token:', e);
                this.clearAuth();
            }
        }
    }

    setUser(user, isAdmin = false) {
        this.currentUser = user;
        this.isAdmin = isAdmin;
        this.updateUI();
    }

    clearAuth() {
        this.currentUser = null;
        this.isAdmin = false;
        api.clearToken();
        this.updateUI();
    }

    updateUI() {
        const userButton = document.querySelector('.user-button');
        const adminButton = document.querySelector('.admin-button');
        
        if (userButton) {
            if (this.currentUser) {
                userButton.innerHTML = `<span>${this.currentUser.email}</span>`;
            } else {
                userButton.innerHTML = '<img src="static/front/people.png" height="30px">';
            }
        }
        
        if (adminButton) {
            if (this.currentUser && this.isAdmin) {
                adminButton.style.display = 'block';
            } else {
                adminButton.style.display = 'none';
            }
        }
    }
}

// Global auth manager instance
const authManager = new AuthManager();
