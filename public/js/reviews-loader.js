// Yorumları dinamik olarak yükle
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
});

async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        
        if (data.success && data.reviews) {
            updateReviewsSection(data.reviews);
        }
    } catch (error) {
        console.error('Yorumlar yüklenirken hata:', error);
    }
}

function updateReviewsSection(reviews) {
    // Ana sayfadaki müşteri memnuniyeti bölümünü güncelle
    const reviewsContainer = document.querySelector('.row.g-4 .col-lg-4:first-child');
    if (!reviewsContainer) return;

    // Mevcut yorumları güncelle
    const reviewCards = document.querySelectorAll('.de-review-app');
    
    reviews.forEach((review, index) => {
        if (reviewCards[index]) {
            updateReviewCard(reviewCards[index], review);
        }
    });
}

function updateReviewCard(card, review) {
    // Yorum metnini güncelle
    const testiElement = card.querySelector('.d-testi');
    if (testiElement) {
        testiElement.textContent = review.text;
    }

    // Yazar adını güncelle
    const authorElement = card.querySelector('.d-testi-by');
    if (authorElement) {
        const reviewDate = new Date(review.createdAt).toLocaleDateString('tr-TR');
        authorElement.innerHTML = `${review.authorName}<span>${reviewDate}</span>`;
    }

    // Yıldızları güncelle (Google yorumları için)
    const starsElement = card.querySelector('.d-stars img');
    if (starsElement && review.rating) {
        // Yıldız görselini rating'e göre güncelle
        starsElement.style.filter = `grayscale(${review.rating < 5 ? (5 - review.rating) * 20 : 0}%)`;
    }
}

// Yorum gönderme formu (gelecekte eklenebilir)
function submitCustomerReview(formData) {
    // Müşteri yorum gönderme implementasyonu
    console.log('Müşteri yorumu gönderildi:', formData);
}

// Yorum puanlama sistemi
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Dolu yıldızlar
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star text-warning"></i>';
    }
    
    // Yarım yıldız
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    // Boş yıldızlar
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star text-warning"></i>';
    }
    
    return starsHtml;
}

// Yorum kaynak ikonları
function getSourceIcon(source) {
    const icons = {
        'google': '<i class="fab fa-google text-primary"></i>',
        'manuel': '<i class="fas fa-user-edit text-info"></i>',
        'facebook': '<i class="fab fa-facebook text-primary"></i>',
        'tripadvisor': '<i class="fab fa-tripadvisor text-success"></i>'
    };
    return icons[source] || '<i class="fas fa-comment text-secondary"></i>';
}

// Yorum filtreleme (gelecekte eklenebilir)
function filterReviewsByRating(minRating) {
    const reviewCards = document.querySelectorAll('.de-review-app');
    reviewCards.forEach(card => {
        const rating = parseInt(card.dataset.rating || '5');
        if (rating >= minRating) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Yorum istatistikleri
function calculateReviewStats(reviews) {
    if (!reviews || reviews.length === 0) return null;

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
    };

    return {
        total: totalReviews,
        average: Math.round(averageRating * 10) / 10,
        distribution: ratingDistribution
    };
}

// Yorum yükleme animasyonu
function showReviewsLoading() {
    const reviewsContainer = document.querySelector('.row.g-4');
    if (reviewsContainer) {
        const loadingHtml = `
            <div class="col-12 text-center review-loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yorumlar yükleniyor...</span>
                </div>
                <p class="mt-2">Müşteri yorumları yükleniyor...</p>
            </div>
        `;
        reviewsContainer.insertAdjacentHTML('beforeend', loadingHtml);
    }
}

function hideReviewsLoading() {
    const loadingElement = document.querySelector('.review-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}