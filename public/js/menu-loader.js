// Menü verilerini dinamik olarak yükle
document.addEventListener('DOMContentLoaded', function() {
    loadMenuData();
    loadPopularItems();
});

async function loadMenuData() {
    try {
        const response = await fetch('/api/menu/categories');
        const data = await response.json();
        
        if (data.success && data.categories) {
            updateMenuSections(data.categories);
        }
    } catch (error) {
        console.error('Menü verileri yüklenirken hata:', error);
    }
}

async function loadPopularItems() {
    try {
        const response = await fetch('/api/menu/popular');
        const data = await response.json();
        
        if (data.success && data.items) {
            updatePopularItemsSection(data.items);
        }
    } catch (error) {
        console.error('Popüler ürünler yüklenirken hata:', error);
    }
}

function updateMenuSections(categories) {
    // Ana sayfa menü bölümlerini güncelle
    updateHomepageMenuSections(categories);
    
    // Menü sayfası varsa güncelle
    if (window.location.pathname.includes('menu.html')) {
        updateMenuPageSections(categories);
    }
}

function updateHomepageMenuSections(categories) {
    // İçecekler bölümünü güncelle
    const drinksCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('içecek') || 
        cat.name.toLowerCase().includes('kahve')
    );
    
    if (drinksCategory && drinksCategory.items.length > 0) {
        updateDrinksSection(drinksCategory.items);
    }

    // Yiyecekler bölümünü güncelle
    const foodCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('yiyecek') || 
        cat.name.toLowerCase().includes('yemek')
    );
    
    if (foodCategory && foodCategory.items.length > 0) {
        updateFoodSection(foodCategory.items);
    }
}

function updateDrinksSection(items) {
    // Ana sayfadaki içecekler bölümünü güncelle
    const drinksContainer = document.querySelector('.col-lg-5.offset-lg-7');
    if (!drinksContainer) return;

    const menuItemsHtml = items.slice(0, 7).map(item => {
        const mediumPrice = item.prices.medium || '';
        const largePrice = item.prices.large || '';
        
        return `
            <div class="menu-item">
                <div class="c1">${item.name}<span>${item.description}</span></div>
                <div class="c2">${mediumPrice ? mediumPrice + ' TL' : ''}</div>
                <div class="c3">${largePrice ? largePrice + ' TL' : ''}</div>
            </div>
        `;
    }).join('');

    // Mevcut menü öğelerini değiştir
    const existingItems = drinksContainer.querySelectorAll('.menu-item:not(.thead)');
    if (existingItems.length > 0) {
        // İlk menü öğesinden sonra yeni öğeleri ekle
        const firstItem = existingItems[0];
        firstItem.insertAdjacentHTML('afterend', menuItemsHtml);
        
        // Eski öğeleri kaldır
        existingItems.forEach(item => item.remove());
    }
}

function updateFoodSection(items) {
    // Ana sayfadaki yiyecekler bölümünü güncelle
    const foodContainer = document.querySelector('.col-lg-5:not(.offset-lg-7)');
    if (!foodContainer) return;

    const menuItemsHtml = items.slice(0, 8).map(item => {
        const price = item.prices.single || item.prices.large || item.prices.medium || '';
        
        return `
            <div class="menu-item">
                <div class="c1">${item.name}<span>${item.description}</span></div>
                <div class="c2"></div>
                <div class="c3">${price ? price + ' TL' : ''}</div>
            </div>
        `;
    }).join('');

    // Mevcut menü öğelerini değiştir
    const existingItems = foodContainer.querySelectorAll('.menu-item:not(.thead)');
    if (existingItems.length > 0) {
        const firstItem = existingItems[0];
        firstItem.insertAdjacentHTML('afterend', menuItemsHtml);
        existingItems.forEach(item => item.remove());
    }
}

function updateMenuPageSections(categories) {
    // Tam menü sayfasındaki bölümleri güncelle
    categories.forEach(category => {
        updateCategorySection(category);
    });
}

function updateCategorySection(category) {
    // Kategori başlığını bul ve güncelle
    const categoryHeaders = document.querySelectorAll('h2, h5');
    categoryHeaders.forEach(header => {
        if (header.textContent.includes(category.name)) {
            // Bu kategorinin ürünlerini güncelle
            const container = header.closest('.col-lg-5, .col-lg-6');
            if (container) {
                updateCategoryItems(container, category.items);
            }
        }
    });
}

function updateCategoryItems(container, items) {
    const menuItemsHtml = items.map(item => {
        const mediumPrice = item.prices.medium || '';
        const largePrice = item.prices.large || '';
        const singlePrice = item.prices.single || '';
        
        return `
            <div class="menu-item">
                <div class="c1">${item.name}<span>${item.description}</span></div>
                <div class="c2">${mediumPrice ? mediumPrice + ' TL' : ''}</div>
                <div class="c3">${largePrice || singlePrice ? (largePrice || singlePrice) + ' TL' : ''}</div>
            </div>
        `;
    }).join('');

    // Mevcut menü öğelerini değiştir
    const existingItems = container.querySelectorAll('.menu-item:not(.thead)');
    if (existingItems.length > 0) {
        const firstItem = existingItems[0];
        firstItem.insertAdjacentHTML('afterend', menuItemsHtml);
        existingItems.forEach(item => item.remove());
    }
}

function updatePopularItemsSection(items) {
    // Ana sayfadaki popüler ürünler bölümünü güncelle
    // Bu bölüm zaten mevcut içerikle dolu, gerekirse güncellenebilir
    console.log('Popüler ürünler yüklendi:', items.length);
}

// Menü filtreleme (menü sayfası için)
function filterMenuItems(category) {
    const allItems = document.querySelectorAll('.item');
    
    allItems.forEach(item => {
        if (category === '*' || item.classList.contains(category)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });

    // Aktif filtreyi güncelle
    document.querySelectorAll('#filters a').forEach(filter => {
        filter.classList.remove('selected');
    });
    document.querySelector(`#filters a[data-filter="${category}"]`)?.classList.add('selected');
}

// Fiyat formatlama
function formatPrice(price) {
    if (!price) return '';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

// Ürün detayları modal'ı (gelecekte eklenebilir)
function showItemDetails(itemId) {
    console.log('Ürün detayları:', itemId);
    // Modal implementasyonu eklenebilir
}

// Diyet bilgisi ikonları
function getDietaryIcons(item) {
    let icons = '';
    if (item.isVegetarian) icons += '<i class="fas fa-leaf text-success" title="Vejetaryen"></i> ';
    if (item.isVegan) icons += '<i class="fas fa-seedling text-success" title="Vegan"></i> ';
    if (item.isGlutenFree) icons += '<i class="fas fa-wheat text-warning" title="Glutensiz"></i> ';
    return icons;
}

// Alerjen uyarıları
function showAllergenInfo(allergens) {
    if (allergens && allergens.length > 0) {
        return `<small class="text-muted">Alerjenler: ${allergens.join(', ')}</small>`;
    }
    return '';
}