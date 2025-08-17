// Rezervasyon formu işlevselliği
document.addEventListener('DOMContentLoaded', function() {
    const reservationForm = document.getElementById('contact_form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    // Tarih seçici için minimum tarih ayarla (bugün)
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

async function handleReservationSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Form verilerini object'e çevir
    const reservationData = {
        customerName: formData.get('Name'),
        customerEmail: formData.get('Email'),
        customerPhone: formData.get('phone'),
        date: formData.get('date'),
        time: formData.get('time'),
        guests: formData.get('guests'),
        message: formData.get('message') || ''
    };

    // Validasyon
    if (!validateReservationData(reservationData)) {
        return;
    }

    try {
        // Loading durumunu göster
        showFormLoading(true);
        hideMessages();

        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservationData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccessMessage(data.message);
            form.reset();
            
            // Rezervasyon ID'sini göster
            if (data.reservation && data.reservation.id) {
                showReservationId(data.reservation.id);
            }
        } else {
            showErrorMessage(data.message || 'Rezervasyon oluşturulurken bir hata oluştu');
        }

    } catch (error) {
        console.error('Rezervasyon hatası:', error);
        showErrorMessage('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
        showFormLoading(false);
    }
}

function validateReservationData(data) {
    // Ad soyad kontrolü
    if (!data.customerName || data.customerName.trim().length < 2) {
        showErrorMessage('Lütfen geçerli bir ad soyad girin');
        return false;
    }

    // Email kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.customerEmail || !emailRegex.test(data.customerEmail)) {
        showErrorMessage('Lütfen geçerli bir email adresi girin');
        return false;
    }

    // Telefon kontrolü
    if (!data.customerPhone || data.customerPhone.trim().length < 10) {
        showErrorMessage('Lütfen geçerli bir telefon numarası girin');
        return false;
    }

    // Tarih kontrolü
    if (!data.date) {
        showErrorMessage('Lütfen bir tarih seçin');
        return false;
    }

    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showErrorMessage('Geçmiş tarih için rezervasyon yapılamaz');
        return false;
    }

    // Saat kontrolü
    if (!data.time) {
        showErrorMessage('Lütfen bir saat seçin');
        return false;
    }

    // Kişi sayısı kontrolü
    if (!data.guests) {
        showErrorMessage('Lütfen kişi sayısını seçin');
        return false;
    }

    return true;
}

function showFormLoading(show) {
    const submitBtn = document.getElementById('send_message');
    if (submitBtn) {
        if (show) {
            submitBtn.disabled = true;
            submitBtn.value = 'Gönderiliyor...';
        } else {
            submitBtn.disabled = false;
            submitBtn.value = 'Rezervasyon Yap';
        }
    }
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('success_message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('error_message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideMessages() {
    const successDiv = document.getElementById('success_message');
    const errorDiv = document.getElementById('error_message');
    
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
}

function showReservationId(reservationId) {
    const message = `Rezervasyon numaranız: ${reservationId.substring(0, 8).toUpperCase()}. Bu numarayı saklayın.`;
    
    // Başarı mesajına ekle
    const successDiv = document.getElementById('success_message');
    if (successDiv) {
        successDiv.innerHTML = successDiv.textContent + '<br><br><strong>' + message + '</strong>';
    }
}

// Rezervasyon durumu sorgulama
function checkReservationStatus() {
    const reservationId = prompt('Rezervasyon numaranızı girin:');
    if (!reservationId) return;

    fetch(`/api/reservations/status/${reservationId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const reservation = data.reservation;
                const statusText = getStatusText(reservation.status);
                const dateText = new Date(reservation.date).toLocaleDateString('tr-TR');
                
                alert(`Rezervasyon Durumu:
                
Müşteri: ${reservation.customerName}
Tarih: ${dateText}
Saat: ${reservation.time}
Kişi Sayısı: ${reservation.guests}
Durum: ${statusText}`);
            } else {
                alert('Rezervasyon bulunamadı. Lütfen numaranızı kontrol edin.');
            }
        })
        .catch(error => {
            console.error('Rezervasyon sorgulama hatası:', error);
            alert('Rezervasyon sorgulanırken bir hata oluştu.');
        });
}

function getStatusText(status) {
    const statusMap = {
        'beklemede': 'Beklemede - Değerlendiriliyor',
        'onaylandi': 'Onaylandı - Sizi bekliyoruz!',
        'iptal': 'İptal Edildi',
        'tamamlandi': 'Tamamlandı - Teşekkürler!'
    };
    return statusMap[status] || status;
}

// Çalışma saatleri kontrolü
function checkWorkingHours() {
    const now = new Date();
    const day = now.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
    const hour = now.getHours();
    
    const workingHours = {
        1: { start: 9, end: 23 }, // Pazartesi
        2: { start: 9, end: 23 }, // Salı
        3: { start: 9, end: 23 }, // Çarşamba
        4: { start: 9, end: 23 }, // Perşembe
        5: { start: 10, end: 22 }, // Cuma
        6: { start: 9.5, end: 24 }, // Cumartesi
        0: { start: 9.5, end: 24 }  // Pazar
    };

    const todayHours = workingHours[day];
    if (!todayHours) return true; // Varsayılan olarak açık

    const currentTime = hour + (now.getMinutes() / 60);
    return currentTime >= todayHours.start && currentTime <= todayHours.end;
}

// Sayfa yüklendiğinde çalışma saatleri uyarısı
document.addEventListener('DOMContentLoaded', function() {
    if (!checkWorkingHours()) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning';
        warningDiv.innerHTML = `
            <strong>Dikkat:</strong> Şu anda çalışma saatlerimiz dışındasınız. 
            Rezervasyonunuz normal çalışma saatlerinde değerlendirilecektir.
            <br><small>Çalışma Saatleri: Pzt-Per: 09:00-23:00, Cuma: 10:00-22:00, Cmt-Paz: 09:30-24:00</small>
        `;
        
        const form = document.getElementById('contact_form');
        if (form) {
            form.parentNode.insertBefore(warningDiv, form);
        }
    }
});