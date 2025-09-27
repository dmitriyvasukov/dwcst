// Product management
class ProductManager {
    constructor() {
        this.products = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.bindEvents();
        this.renderProducts();
    }

    async loadProducts() {
        try {
            this.products = await api.getProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showMessage('Ошибка загрузки товаров', 'error');
        }
    }

    bindEvents() {
        // Navigation buttons
        document.querySelectorAll('.navigation-buttons button').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.classList.contains('all-products') ? 'all' :
                             e.target.classList.contains('in-stock') ? 'in_stock' : 'preorder';
                this.setFilter(filter);
            });
        });

        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-button')) {
                const productId = parseInt(e.target.dataset.productId);
                this.addToCart(productId);
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.navigation-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = filter === 'all' ? '.all-products' :
                           filter === 'in_stock' ? '.in-stock' : '.preorder';
        document.querySelector(activeButton).classList.add('active');
        
        this.renderProducts();
    }

    getFilteredProducts() {
        if (this.currentFilter === 'all') {
            return this.products;
        }
        return this.products.filter(product => product.status === this.currentFilter);
    }

    renderProducts() {
        const container = document.querySelector('.products-container');
        if (!container) return;

        const filteredProducts = this.getFilteredProducts();
        
        container.innerHTML = filteredProducts.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const statusText = {
            'in_stock': 'в наличии',
            'preorder': 'предзаказ',
            'waiting': 'ожидание'
        }[product.status] || 'неизвестно';

        const statusClass = product.status === 'in_stock' ? 'in-stock' : 
                           product.status === 'preorder' ? 'preorder' : 'waiting';

        // Get image URL - if it's a full URL, use it; otherwise, construct API URL
        let imageUrl = product.preview || 'static/front/product-example.png';
        if (product.preview && !product.preview.startsWith('http') && !product.preview.startsWith('/')) {
            imageUrl = api.getFileUrl(product.preview);
        } else if (product.preview && product.preview.startsWith('/api/')) {
            imageUrl = `http://localhost:8000${product.preview}`;
        }

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product">
                    <div class="status ${statusClass}">${statusText}</div>
                    <div class="product-image">
                        <img src="${imageUrl}" 
                             height="400px" 
                             alt="${product.name}"
                             onclick="window.location.href='product.html?id=${product.id}'">
                    </div>
                </div>
                <div class="title">${product.name}</div>
                <div class="price">${product.price} ₽</div>
                <button class="add-to-cart-button" data-product-id="${product.id}">
                    В КОРЗИНУ
                </button>
            </div>
        `;
    }

    async addToCart(productId) {
        if (!authManager.currentUser) {
            authModal.show();
            return;
        }

        try {
            await api.addToCart(productId, 1);
            this.showMessage('Товар добавлен в корзину!', 'success');
        } catch (error) {
            this.showMessage('Ошибка добавления в корзину', 'error');
        }
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `product-message ${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Product page management
class ProductPageManager {
    constructor() {
        this.product = null;
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            await this.loadProduct(parseInt(productId));
            this.bindEvents();
        }
    }

    async loadProduct(id) {
        try {
            this.product = await api.getProduct(id);
            this.renderProduct();
        } catch (error) {
            console.error('Error loading product:', error);
            this.showMessage('Ошибка загрузки товара', 'error');
        }
    }

    renderProduct() {
        if (!this.product) return;

        const statusText = {
            'in_stock': 'В наличии',
            'preorder': 'Предзаказ',
            'waiting': 'Ожидание'
        }[this.product.status] || 'Неизвестно';

        // Update product info
        document.querySelector('.product-title').textContent = this.product.name;
        document.querySelector('.price').textContent = `Цена товара: ${this.product.price} ₽`;
        document.querySelector('.status').textContent = `Тип заказа: ${statusText}`;

        // Update product image
        const productImage = document.querySelector('.product-pictures-slider img');
        if (this.product.preview) {
            let imageUrl = this.product.preview;
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = api.getFileUrl(imageUrl);
            } else if (imageUrl.startsWith('/api/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
            }
            productImage.src = imageUrl;
        }

        // Update stock counter
        const stockCounter = document.querySelector('.stock-counter');
        if (this.product.stock > 0) {
            stockCounter.innerHTML = `
                Осталось:<br>
                ${this.product.stock} шт.
            `;
        } else {
            stockCounter.innerHTML = 'Нет в наличии';
        }

        // Update description sections
        if (this.product.description) {
            const descEl = document.querySelector('.description');
            descEl.innerHTML = `
                <div class="description-header">Описание изделия</div>
                <div class="description-content">${this.product.description}</div>
            `;
        }

        if (this.product.care) {
            const careEl = document.querySelector('.care-info');
            careEl.innerHTML = `
                <div class="care-header">Информация об уходе</div>
                <div class="care-content">${this.product.care}</div>
            `;
        }
    }

    bindEvents() {
        // Add to cart button
        const addToCartBtn = document.querySelector('.add-to-cart-button');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if (!authManager.currentUser) {
                    authModal.show();
                    return;
                }

                api.addToCart(this.product.id, 1)
                    .then(() => {
                        this.showMessage('Товар добавлен в корзину!', 'success');
                    })
                    .catch(error => {
                        this.showMessage('Ошибка добавления в корзину', 'error');
                    });
            });
        }

        // Description sections toggle
        document.querySelectorAll('.description-info > div').forEach(section => {
            section.addEventListener('click', () => {
                const content = section.querySelector('div:last-child');
                if (content) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                }
            });
        });
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `product-message ${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth manager first
    await authManager.init();
    
    if (window.location.pathname.includes('product.html')) {
        new ProductPageManager();
    } else {
        new ProductManager();
    }
});
