// Global variables
let currentUser = null;
let currentSection = 'dashboard';

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeEventListeners();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Verify token and get user info
    fetch('/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            document.getElementById('user-name').textContent = data.user.name;
            loadDashboard();
        } else {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
        }
    })
    .catch(error => {
        console.error('Auth check error:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });

    // Filter events
    document.getElementById('reservation-status-filter')?.addEventListener('change', filterReservations);
    document.getElementById('reservation-date-filter')?.addEventListener('change', filterReservations);
    document.getElementById('reservation-search')?.addEventListener('input', debounce(filterReservations, 500));
}

// Switch sections
function switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'reservations': 'Rezervasyonlar',
        'menu': 'Menü Yönetimi',
        'reviews': 'Yorumlar',
        'settings': 'Ayarlar'
    };
    document.getElementById('page-title').textContent = titles[section] || section;

    currentSection = section;

    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'menu':
            loadMenuData();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        showLoading();
        const response = await apiCall('/api/admin/dashboard');
        
        if (response.success) {
            // Update stats
            document.getElementById('today-reservations').textContent = response.stats.rezervasyonlar.bugün;
            document.getElementById('pending-reservations').textContent = response.stats.rezervasyonlar.beklemede;
            document.getElementById('total-menu-items').textContent = response.stats.menü.toplamÜrün;
            document.getElementById('review-average').textContent = response.stats.yorumlar.ortalamaPuan;

            // Update recent reservations
            updateRecentReservations(response.recentReservations);
            
            // Update recent reviews
            updateRecentReviews(response.recentReviews);
        }
    } catch (error) {
        showError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
        hideLoading();
    }
}

// Update recent reservations table
function updateRecentReservations(reservations) {
    const tbody = document.getElementById('recent-reservations');
    if (!reservations || reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Henüz rezervasyon yok</td></tr>';
        return;
    }

    tbody.innerHTML = reservations.map(reservation => `
        <tr>
            <td>${reservation.customerName}</td>
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.time}</td>
            <td>${reservation.guests}</td>
            <td><span class="status-badge status-${reservation.status}">${getStatusText(reservation.status)}</span></td>
        </tr>
    `).join('');
}

// Update recent reviews
function updateRecentReviews(reviews) {
    const container = document.getElementById('recent-reviews');
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Henüz yorum yok</p>';
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="review-author">${review.authorName}</span>
                <div class="rating-stars">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
            </div>
            <p class="review-text">${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}</p>
            <small class="review-date">${formatDate(review.createdAt)}</small>
        </div>
    `).join('');
}

// Load reservations
async function loadReservations(page = 1) {
    try {
        showLoading();
        const params = new URLSearchParams({
            page,
            limit: 20
        });

        // Add filters
        const status = document.getElementById('reservation-status-filter')?.value;
        const date = document.getElementById('reservation-date-filter')?.value;
        const search = document.getElementById('reservation-search')?.value;

        if (status && status !== 'all') params.append('status', status);
        if (date) params.append('date', date);
        if (search) params.append('search', search);

        const response = await apiCall(`/api/reservations/admin?${params}`);
        
        if (response.success) {
            updateReservationsTable(response.reservations);
            updatePagination('reservations-pagination', response.pagination, loadReservations);
        }
    } catch (error) {
        showError('Rezervasyonlar yüklenirken hata oluştu');
    } finally {
        hideLoading();
    }
}

// Update reservations table
function updateReservationsTable(reservations) {
    const tbody = document.getElementById('reservations-table');
    if (!reservations || reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Rezervasyon bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = reservations.map(reservation => `
        <tr>
            <td>
                <div>
                    <strong>${reservation.customerName}</strong><br>
                    <small class="text-muted">${reservation.customerEmail}</small><br>
                    <small class="text-muted">${reservation.customerPhone}</small>
                </div>
            </td>
            <td>
                <div>
                    ${formatDate(reservation.date)}<br>
                    <strong>${reservation.time}</strong>
                </div>
            </td>
            <td>${reservation.guests}</td>
            <td><span class="status-badge status-${reservation.status}">${getStatusText(reservation.status)}</span></td>
            <td>${reservation.tableNumber || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editReservation('${reservation._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteReservation('${reservation._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load menu data
async function loadMenuData() {
    await Promise.all([
        loadCategories(),
        loadMenuItems()
    ]);
}

// Load categories
async function loadCategories() {
    try {
        const response = await apiCall('/api/menu/admin/categories');
        if (response.success) {
            updateCategoriesTable(response.categories);
            updateCategorySelects(response.categories);
        }
    } catch (error) {
        showError('Kategoriler yüklenirken hata oluştu');
    }
}

// Update categories table
function updateCategoriesTable(categories) {
    const tbody = document.getElementById('categories-table');
    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Kategori bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map(category => `
        <tr>
            <td><strong>${category.name}</strong></td>
            <td>${category.description || '-'}</td>
            <td>${category.order}</td>
            <td>
                <span class="badge ${category.isActive ? 'bg-success' : 'bg-secondary'}">
                    ${category.isActive ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editCategory('${category._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${category._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load menu items
async function loadMenuItems(page = 1) {
    try {
        const params = new URLSearchParams({
            page,
            limit: 20
        });

        const category = document.getElementById('item-category-filter')?.value;
        const search = document.getElementById('item-search')?.value;

        if (category) params.append('category', category);
        if (search) params.append('search', search);

        const response = await apiCall(`/api/menu/admin/items?${params}`);
        
        if (response.success) {
            updateMenuItemsTable(response.items);
            updatePagination('menu-items-pagination', response.pagination, loadMenuItems);
        }
    } catch (error) {
        showError('Menü ürünleri yüklenirken hata oluştu');
    }
}

// Update menu items table
function updateMenuItemsTable(items) {
    const tbody = document.getElementById('menu-items-table');
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Ürün bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>
                ${item.image ? 
                    `<img src="${item.image}" class="image-preview" alt="${item.name}">` : 
                    '<div class="image-preview bg-light d-flex align-items-center justify-content-center"><i class="fas fa-image text-muted"></i></div>'
                }
            </td>
            <td>
                <div>
                    <strong>${item.name}</strong><br>
                    <small class="text-muted">${item.description.substring(0, 50)}...</small>
                </div>
            </td>
            <td>${item.category?.name || '-'}</td>
            <td>
                <div>
                    ${item.prices.medium ? `Orta: ${item.prices.medium} TL<br>` : ''}
                    ${item.prices.large ? `Büyük: ${item.prices.large} TL<br>` : ''}
                    ${item.prices.single ? `Tek: ${item.prices.single} TL` : ''}
                </div>
            </td>
            <td>
                <div>
                    <span class="badge ${item.isAvailable ? 'bg-success' : 'bg-secondary'}">
                        ${item.isAvailable ? 'Mevcut' : 'Tükendi'}
                    </span>
                    ${item.isPopular ? '<br><span class="badge bg-warning">Popüler</span>' : ''}
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editMenuItem('${item._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="toggleItemAvailability('${item._id}')">
                        <i class="fas fa-toggle-${item.isAvailable ? 'on' : 'off'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="toggleItemPopular('${item._id}')">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMenuItem('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load reviews
async function loadReviews(page = 1) {
    try {
        showLoading();
        const params = new URLSearchParams({
            page,
            limit: 20
        });

        const response = await apiCall(`/api/reviews/admin?${params}`);
        
        if (response.success) {
            updateReviewsTable(response.reviews);
            updateReviewStats(response.stats);
            updatePagination('reviews-pagination', response.pagination, loadReviews);
        }
    } catch (error) {
        showError('Yorumlar yüklenirken hata oluştu');
    } finally {
        hideLoading();
    }
}

// Update reviews table
function updateReviewsTable(reviews) {
    const tbody = document.getElementById('reviews-table');
    if (!reviews || reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Yorum bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = reviews.map(review => `
        <tr>
            <td><strong>${review.authorName}</strong></td>
            <td>
                <div style="max-width: 200px;">
                    ${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}
                </div>
            </td>
            <td>
                <div class="rating-stars">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
            </td>
            <td>
                <span class="badge ${review.source === 'google' ? 'bg-warning' : 'bg-info'}">
                    ${review.source === 'google' ? 'Google' : 'Manuel'}
                </span>
            </td>
            <td>${formatDate(review.createdAt)}</td>
            <td>
                <span class="badge ${review.isVisible ? 'bg-success' : 'bg-secondary'}">
                    ${review.isVisible ? 'Görünür' : 'Gizli'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-warning" onclick="toggleReviewVisibility('${review._id}')">
                        <i class="fas fa-eye${review.isVisible ? '-slash' : ''}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteReview('${review._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update review stats
function updateReviewStats(stats) {
    document.getElementById('total-reviews').textContent = stats.toplam;
    document.getElementById('visible-reviews').textContent = stats.görünür;
    document.getElementById('google-reviews').textContent = stats.google;
    document.getElementById('review-average').textContent = stats.ortalamaPuan;
}

// API call helper
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu');
    }

    return data;
}

// Utility functions
function showLoading() {
    document.getElementById('loading-overlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('show');
}

function showSuccess(message) {
    // Toast notification implementation
    console.log('Success:', message);
    // You can implement a toast library here
}

function showError(message) {
    // Toast notification implementation
    console.error('Error:', message);
    alert('Hata: ' + message);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('tr-TR');
}

function getStatusText(status) {
    const statusMap = {
        'beklemede': 'Beklemede',
        'onaylandi': 'Onaylandı',
        'iptal': 'İptal',
        'tamamlandi': 'Tamamlandı'
    };
    return statusMap[status] || status;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter functions
function filterReservations() {
    loadReservations(1);
}

function filterMenuItems() {
    loadMenuItems(1);
}

// Modal functions
function showAddCategoryModal() {
    document.getElementById('add-category-form').reset();
    new bootstrap.Modal(document.getElementById('addCategoryModal')).show();
}

function showAddItemModal() {
    document.getElementById('add-item-form').reset();
    new bootstrap.Modal(document.getElementById('addItemModal')).show();
}

function showAddReviewModal() {
    document.getElementById('add-review-form').reset();
    new bootstrap.Modal(document.getElementById('addReviewModal')).show();
}

// CRUD operations
async function addCategory() {
    try {
        const formData = {
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value,
            order: parseInt(document.getElementById('category-order').value) || 0
        };

        const response = await apiCall('/api/menu/admin/categories', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response.success) {
            showSuccess('Kategori başarıyla eklendi');
            bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
            loadCategories();
        }
    } catch (error) {
        showError(error.message);
    }
}

async function addMenuItem() {
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('item-name').value);
        formData.append('description', document.getElementById('item-description').value);
        formData.append('category', document.getElementById('item-category').value);
        
        const prices = {
            medium: parseFloat(document.getElementById('price-medium').value) || null,
            large: parseFloat(document.getElementById('price-large').value) || null,
            single: parseFloat(document.getElementById('price-single').value) || null
        };
        formData.append('prices', JSON.stringify(prices));
        
        formData.append('preparationTime', document.getElementById('preparation-time').value);
        formData.append('order', document.getElementById('item-order').value);
        formData.append('isPopular', document.getElementById('is-popular').checked);
        formData.append('isVegetarian', document.getElementById('is-vegetarian').checked);
        formData.append('isVegan', document.getElementById('is-vegan').checked);
        formData.append('isGlutenFree', document.getElementById('is-gluten-free').checked);

        const imageFile = document.getElementById('item-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/menu/admin/items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            showSuccess('Ürün başarıyla eklendi');
            bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
            loadMenuItems();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showError(error.message);
    }
}

// Toggle functions
async function toggleItemAvailability(itemId) {
    try {
        const response = await apiCall(`/api/menu/admin/items/${itemId}/toggle-availability`, {
            method: 'PATCH'
        });

        if (response.success) {
            showSuccess(response.message);
            loadMenuItems();
        }
    } catch (error) {
        showError(error.message);
    }
}

async function toggleItemPopular(itemId) {
    try {
        const response = await apiCall(`/api/menu/admin/items/${itemId}/toggle-popular`, {
            method: 'PATCH'
        });

        if (response.success) {
            showSuccess(response.message);
            loadMenuItems();
        }
    } catch (error) {
        showError(error.message);
    }
}

async function toggleReviewVisibility(reviewId) {
    try {
        const response = await apiCall(`/api/reviews/admin/${reviewId}/toggle-visibility`, {
            method: 'PATCH'
        });

        if (response.success) {
            showSuccess(response.message);
            loadReviews();
        }
    } catch (error) {
        showError(error.message);
    }
}

// Sync Google reviews
async function syncGoogleReviews() {
    try {
        showLoading();
        const response = await apiCall('/api/reviews/admin/sync-google', {
            method: 'POST'
        });

        if (response.success) {
            showSuccess(response.message);
            loadReviews();
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Update pagination
function updatePagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<ul class="pagination justify-content-center">';
    
    // Previous button
    if (pagination.current > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="${loadFunction.name}(${pagination.current - 1})">Önceki</a></li>`;
    }

    // Page numbers
    for (let i = Math.max(1, pagination.current - 2); i <= Math.min(pagination.pages, pagination.current + 2); i++) {
        paginationHTML += `<li class="page-item ${i === pagination.current ? 'active' : ''}">
            <a class="page-link" href="#" onclick="${loadFunction.name}(${i})">${i}</a>
        </li>`;
    }

    // Next button
    if (pagination.current < pagination.pages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="${loadFunction.name}(${pagination.current + 1})">Sonraki</a></li>`;
    }

    paginationHTML += '</ul>';
    container.innerHTML = paginationHTML;
}

// Update category selects
function updateCategorySelects(categories) {
    const selects = ['item-category-filter', 'item-category'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = selectId.includes('filter') ? 
                '<option value="">Tüm Kategoriler</option>' : 
                '<option value="">Kategori Seçin</option>';
            
            categories.forEach(category => {
                select.innerHTML += `<option value="${category._id}">${category.name}</option>`;
            });
            
            select.value = currentValue;
        }
    });
}

// Sidebar toggle for mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

// Logout
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    }
}

// Refresh functions
function refreshReservations() {
    loadReservations();
}

function refreshReviews() {
    loadReviews();
}

// Placeholder functions for future implementation
function editReservation(id) {
    console.log('Edit reservation:', id);
    // Implementation will be added
}

function deleteReservation(id) {
    if (confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) {
        console.log('Delete reservation:', id);
        // Implementation will be added
    }
}

function editCategory(id) {
    console.log('Edit category:', id);
    // Implementation will be added
}

function deleteCategory(id) {
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
        console.log('Delete category:', id);
        // Implementation will be added
    }
}

function editMenuItem(id) {
    console.log('Edit menu item:', id);
    // Implementation will be added
}

function deleteMenuItem(id) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        console.log('Delete menu item:', id);
        // Implementation will be added
    }
}

function deleteReview(id) {
    if (confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
        console.log('Delete review:', id);
        // Implementation will be added
    }
}

function addReview() {
    console.log('Add review');
    // Implementation will be added
}

function loadSettings() {
    console.log('Load settings');
    // Implementation will be added
}