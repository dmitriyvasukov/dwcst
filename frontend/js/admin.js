// Admin Panel Management
class AdminPanel {
    constructor() {
        this.currentSection = 'products';
        this.editingItem = null;
        this.init();
    }

    async init() {
        // Check if user is admin
        if (!authManager.isAdmin) {
            window.location.href = 'index.html';
            return;
        }

        this.bindEvents();
        await this.loadCurrentSection();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Add buttons
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductModal();
        });

        document.getElementById('add-promo-btn').addEventListener('click', () => {
            this.showPromoModal();
        });

        // Logout
        document.querySelector('.logout-button button').addEventListener('click', () => {
            authManager.clearAuth();
            window.location.href = 'index.html';
        });

        // Modal events
        this.bindModalEvents();
        
        // File upload events
        this.bindFileUploadEvents();
    }

    bindModalEvents() {
        // Product modal
        const productModal = document.getElementById('product-modal');
        const productForm = document.getElementById('product-form');

        productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
        productModal.querySelector('.close').addEventListener('click', () => this.closeModal('product-modal'));
        productModal.querySelector('.cancel-button').addEventListener('click', () => this.closeModal('product-modal'));

        // Promo modal
        const promoModal = document.getElementById('promo-modal');
        const promoForm = document.getElementById('promo-form');

        promoForm.addEventListener('submit', (e) => this.handlePromoSubmit(e));
        promoModal.querySelector('.close').addEventListener('click', () => this.closeModal('promo-modal'));
        promoModal.querySelector('.cancel-button').addEventListener('click', () => this.closeModal('promo-modal'));

        // Close modals on outside click
        [productModal, promoModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;
        this.loadCurrentSection();
    }

    async loadCurrentSection() {
        const section = this.currentSection;
        
        switch (section) {
            case 'products':
                await this.loadProducts();
                break;
            case 'promos':
                await this.loadPromos();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'users':
                await this.loadUsers();
                break;
        }
    }

    async loadProducts() {
        try {
            const products = await api.getProducts();
            this.renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showMessage('Ошибка загрузки товаров', 'error');
        }
    }

    renderProducts(products) {
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.price} ₽</td>
                <td><span class="status-badge ${product.status}">${this.getStatusText(product.status)}</span></td>
                <td>${product.stock}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-button" onclick="adminPanel.editProduct(${product.id})">Редактировать</button>
                        <button class="delete-button" onclick="adminPanel.deleteProduct(${product.id})">Удалить</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadPromos() {
        try {
            const promos = await api.getPromos();
            this.renderPromos(promos);
        } catch (error) {
            console.error('Error loading promos:', error);
            this.showMessage('Ошибка загрузки промокодов', 'error');
        }
    }

    renderPromos(promos) {
        const tbody = document.getElementById('promos-table-body');
        tbody.innerHTML = promos.map(promo => `
            <tr>
                <td>${promo.id}</td>
                <td>${promo.code}</td>
                <td>${promo.discount}${promo.type === 'percentage' ? '%' : ' ₽'}</td>
                <td>${promo.type === 'percentage' ? 'Процент' : 'Фиксированная сумма'}</td>
                <td>${promo.is_active ? 'Да' : 'Нет'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-button" onclick="adminPanel.editPromo(${promo.id})">Редактировать</button>
                        <button class="delete-button" onclick="adminPanel.deletePromo(${promo.id})">Удалить</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadOrders() {
        try {
            const orders = await api.getOrders();
            this.renderOrders(orders);
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showMessage('Ошибка загрузки заказов', 'error');
        }
    }

    renderOrders(orders) {
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.user_email || 'N/A'}</td>
                <td><span class="status-badge">${order.status}</span></td>
                <td>${order.total_amount} ₽</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-button" onclick="adminPanel.updateOrderStatus(${order.id})">Изменить статус</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadUsers() {
        try {
            // Note: You might need to add a users endpoint to your API
            this.renderUsers([]);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showMessage('Ошибка загрузки пользователей', 'error');
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.first_name || 'N/A'}</td>
                <td>${user.role}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-button" onclick="adminPanel.editUser(${user.id})">Редактировать</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    bindFileUploadEvents() {
        // Preview image upload
        const previewFileInput = document.getElementById('product-preview-file');
        const previewUploadBtn = document.getElementById('upload-preview-btn');
        const previewFilename = document.getElementById('preview-filename');
        const previewImageContainer = document.getElementById('preview-image-container');

        previewUploadBtn.addEventListener('click', () => {
            previewFileInput.click();
        });

        previewFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.uploadPreviewImage(file, previewFilename, previewImageContainer);
            }
        });

        // Multiple images upload
        const imagesFileInput = document.getElementById('product-images-files');
        const imagesUploadBtn = document.getElementById('upload-images-btn');
        const imagesFilename = document.getElementById('images-filename');
        const imagesPreviewContainer = document.getElementById('images-preview-container');

        imagesUploadBtn.addEventListener('click', () => {
            imagesFileInput.click();
        });

        imagesFileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await this.uploadMultipleImages(files, imagesFilename, imagesPreviewContainer);
            }
        });
    }

    async uploadPreviewImage(file, filenameDisplay, imageContainer) {
        try {
            filenameDisplay.textContent = 'Загрузка...';
            const result = await api.uploadImage(file);
            
            filenameDisplay.textContent = file.name;
            document.getElementById('product-preview').value = result.url;
            
            // Show preview
            imageContainer.innerHTML = `
                <img src="${api.getFileUrl(result.filename)}" alt="Preview">
                <button type="button" class="remove-image-btn" onclick="adminPanel.removePreviewImage()">×</button>
            `;
            
            this.showMessage('Изображение загружено!', 'success');
        } catch (error) {
            filenameDisplay.textContent = '';
            this.showMessage('Ошибка загрузки: ' + error.message, 'error');
        }
    }

    async uploadMultipleImages(files, filenameDisplay, imagesContainer) {
        try {
            filenameDisplay.textContent = `Загрузка ${files.length} файлов...`;
            
            const uploadPromises = files.map(file => api.uploadImage(file));
            const results = await Promise.all(uploadPromises);
            
            filenameDisplay.textContent = `${files.length} файлов загружено`;
            
            // Update hidden input with URLs
            const urls = results.map(result => result.url);
            document.getElementById('product-images').value = urls.join(',');
            
            // Show previews
            imagesContainer.innerHTML = results.map((result, index) => `
                <div class="image-item">
                    <img src="${api.getFileUrl(result.filename)}" alt="Image ${index + 1}">
                    <button type="button" class="remove-image-btn" onclick="adminPanel.removeImageFromList(${index})">×</button>
                </div>
            `).join('');
            
            this.showMessage('Изображения загружены!', 'success');
        } catch (error) {
            filenameDisplay.textContent = '';
            this.showMessage('Ошибка загрузки: ' + error.message, 'error');
        }
    }

    clearPreviewImage() {
        document.getElementById('preview-filename').textContent = '';
        document.getElementById('product-preview').value = '';
        document.getElementById('preview-image-container').innerHTML = '';
        document.getElementById('product-preview-file').value = '';
    }

    clearAdditionalImages() {
        document.getElementById('images-filename').textContent = '';
        document.getElementById('product-images').value = '';
        document.getElementById('images-preview-container').innerHTML = '';
        document.getElementById('product-images-files').value = '';
    }

    removePreviewImage() {
        this.clearPreviewImage();
    }

    removeImageFromList(index) {
        const urls = document.getElementById('product-images').value.split(',').filter(url => url.trim());
        urls.splice(index, 1);
        document.getElementById('product-images').value = urls.join(',');
        
        // Re-render preview
        const imagesContainer = document.getElementById('images-preview-container');
        if (urls.length === 0) {
            imagesContainer.innerHTML = '';
            document.getElementById('images-filename').textContent = '';
            document.getElementById('product-images-files').value = '';
        } else {
            imagesContainer.innerHTML = urls.map((url, i) => `
                <div class="image-item">
                    <img src="${url}" alt="Image ${i + 1}">
                    <button type="button" class="remove-image-btn" onclick="adminPanel.removeImageFromList(${i})">×</button>
                </div>
            `).join('');
        }
    }

    // Product management
    showProductModal(product = null) {
        this.editingItem = product;
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        
        if (product) {
            document.getElementById('product-modal-title').textContent = 'Редактировать товар';
            form.name.value = product.name;
            form.description.value = product.description || '';
            form.care.value = product.care || '';
            form.price.value = product.price;
            form.status.value = product.status;
            form.stock.value = product.stock;
            
            // Handle preview image
            if (product.preview) {
                form.preview.value = product.preview;
                document.getElementById('preview-filename').textContent = 'Загружено';
                document.getElementById('preview-image-container').innerHTML = `
                    <img src="${product.preview}" alt="Preview">
                    <button type="button" class="remove-image-btn" onclick="adminPanel.removePreviewImage()">×</button>
                `;
            } else {
                this.clearPreviewImage();
            }
            
            // Handle additional images
            if (product.images && product.images.length > 0) {
                form.images.value = product.images.join(',');
                document.getElementById('images-filename').textContent = `${product.images.length} изображений`;
                document.getElementById('images-preview-container').innerHTML = product.images.map((url, index) => `
                    <div class="image-item">
                        <img src="${url}" alt="Image ${index + 1}">
                        <button type="button" class="remove-image-btn" onclick="adminPanel.removeImageFromList(${index})">×</button>
                    </div>
                `).join('');
            } else {
                this.clearAdditionalImages();
            }
        } else {
            document.getElementById('product-modal-title').textContent = 'Добавить товар';
            form.reset();
            this.clearPreviewImage();
            this.clearAdditionalImages();
        }
        
        modal.style.display = 'block';
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            care: formData.get('care'),
            price: parseFloat(formData.get('price')),
            status: formData.get('status'),
            stock: parseInt(formData.get('stock')) || 0,
            preview: formData.get('preview'),
            images: formData.get('images') ? formData.get('images').split(',').map(url => url.trim()).filter(url => url) : []
        };

        try {
            if (this.editingItem) {
                await api.updateProduct(this.editingItem.id, productData);
                this.showMessage('Товар обновлен!', 'success');
            } else {
                await api.createProduct(productData);
                this.showMessage('Товар добавлен!', 'success');
            }
            
            this.closeModal('product-modal');
            await this.loadProducts();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async editProduct(id) {
        try {
            const product = await api.getProduct(id);
            this.showProductModal(product);
        } catch (error) {
            this.showMessage('Ошибка загрузки товара', 'error');
        }
    }

    async deleteProduct(id) {
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await api.deleteProduct(id);
                this.showMessage('Товар удален!', 'success');
                await this.loadProducts();
            } catch (error) {
                this.showMessage('Ошибка удаления товара', 'error');
            }
        }
    }

    // Promo management
    showPromoModal(promo = null) {
        this.editingItem = promo;
        const modal = document.getElementById('promo-modal');
        const form = document.getElementById('promo-form');
        
        if (promo) {
            document.getElementById('promo-modal-title').textContent = 'Редактировать промокод';
            form.code.value = promo.code;
            form.discount.value = promo.discount;
            form.type.value = promo.type;
            form.is_active.checked = promo.is_active;
        } else {
            document.getElementById('promo-modal-title').textContent = 'Добавить промокод';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    async handlePromoSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const promoData = {
            code: formData.get('code'),
            discount: parseFloat(formData.get('discount')),
            type: formData.get('type'),
            is_active: formData.get('is_active') === 'on'
        };

        try {
            if (this.editingItem) {
                await api.updatePromo(this.editingItem.id, promoData);
                this.showMessage('Промокод обновлен!', 'success');
            } else {
                await api.createPromo(promoData);
                this.showMessage('Промокод добавлен!', 'success');
            }
            
            this.closeModal('promo-modal');
            await this.loadPromos();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async editPromo(id) {
        try {
            const promos = await api.getPromos();
            const promo = promos.find(p => p.id === id);
            if (promo) {
                this.showPromoModal(promo);
            }
        } catch (error) {
            this.showMessage('Ошибка загрузки промокода', 'error');
        }
    }

    async deletePromo(id) {
        if (confirm('Вы уверены, что хотите удалить этот промокод?')) {
            try {
                await api.deletePromo(id);
                this.showMessage('Промокод удален!', 'success');
                await this.loadPromos();
            } catch (error) {
                this.showMessage('Ошибка удаления промокода', 'error');
            }
        }
    }

    // Order management
    async updateOrderStatus(orderId) {
        const newStatus = prompt('Введите новый статус заказа:');
        if (newStatus) {
            try {
                await api.updateOrderStatus(orderId, newStatus);
                this.showMessage('Статус заказа обновлен!', 'success');
                await this.loadOrders();
            } catch (error) {
                this.showMessage('Ошибка обновления статуса', 'error');
            }
        }
    }

    // Utility methods
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        this.editingItem = null;
    }

    getStatusText(status) {
        const statusMap = {
            'in_stock': 'В наличии',
            'preorder': 'Предзаказ',
            'waiting': 'Ожидание'
        };
        return statusMap[status] || status;
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `admin-message ${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth manager first
    await authManager.init();
    
    window.adminPanel = new AdminPanel();
});
