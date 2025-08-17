const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendReservationConfirmation(reservation) {
    const mailOptions = {
      from: `"LunaBrew" <${process.env.EMAIL_USER}>`,
      to: reservation.customerEmail,
      subject: 'Rezervasyon Onayı - LunaBrew',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e3c086;">Rezervasyon Onayı</h2>
          <p>Sayın ${reservation.customerName},</p>
          <p>Rezervasyonunuz başarıyla alınmıştır. Detaylar aşağıdaki gibidir:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Rezervasyon Detayları</h3>
            <p><strong>Tarih:</strong> ${new Date(reservation.date).toLocaleDateString('tr-TR')}</p>
            <p><strong>Saat:</strong> ${reservation.time}</p>
            <p><strong>Kişi Sayısı:</strong> ${reservation.guests}</p>
            <p><strong>Durum:</strong> ${this.getStatusText(reservation.status)}</p>
            ${reservation.message ? `<p><strong>Mesajınız:</strong> ${reservation.message}</p>` : ''}
          </div>
          
          <p>Rezervasyonunuzla ilgili herhangi bir değişiklik olması durumunda size bilgi vereceğiz.</p>
          <p>Teşekkürler,<br>LunaBrew Ekibi</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            LunaBrew<br>
            Ankara, Çankaya, Tunalı Hilmi Caddesi, No: 12T.<br>
            Tel: (312) 454 8484<br>
            Email: info@lunabrew.com
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendReservationStatusUpdate(reservation) {
    const mailOptions = {
      from: `"LunaBrew" <${process.env.EMAIL_USER}>`,
      to: reservation.customerEmail,
      subject: 'Rezervasyon Durumu Güncellendi - LunaBrew',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e3c086;">Rezervasyon Durumu Güncellendi</h2>
          <p>Sayın ${reservation.customerName},</p>
          <p>Rezervasyonunuzun durumu güncellendi:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Güncel Durum</h3>
            <p><strong>Durum:</strong> <span style="color: ${this.getStatusColor(reservation.status)}; font-weight: bold;">${this.getStatusText(reservation.status)}</span></p>
            <p><strong>Tarih:</strong> ${new Date(reservation.date).toLocaleDateString('tr-TR')}</p>
            <p><strong>Saat:</strong> ${reservation.time}</p>
            ${reservation.tableNumber ? `<p><strong>Masa No:</strong> ${reservation.tableNumber}</p>` : ''}
            ${reservation.adminNotes ? `<p><strong>Not:</strong> ${reservation.adminNotes}</p>` : ''}
          </div>
          
          ${this.getStatusMessage(reservation.status)}
          
          <p>Teşekkürler,<br>LunaBrew Ekibi</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            LunaBrew<br>
            Ankara, Çankaya, Tunalı Hilmi Caddesi, No: 12T.<br>
            Tel: (312) 454 8484<br>
            Email: info@lunabrew.com
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  getStatusText(status) {
    const statusMap = {
      'beklemede': 'Beklemede',
      'onaylandi': 'Onaylandı',
      'iptal': 'İptal Edildi',
      'tamamlandi': 'Tamamlandı'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status) {
    const colorMap = {
      'beklemede': '#ffc107',
      'onaylandi': '#28a745',
      'iptal': '#dc3545',
      'tamamlandi': '#6c757d'
    };
    return colorMap[status] || '#6c757d';
  }

  getStatusMessage(status) {
    const messageMap = {
      'beklemede': '<p>Rezervasyonunuz değerlendiriliyor. En kısa sürede size dönüş yapacağız.</p>',
      'onaylandi': '<p>🎉 Harika! Rezervasyonunuz onaylandı. Sizi aramızda görmek için sabırsızlanıyoruz!</p>',
      'iptal': '<p>Üzgünüz, rezervasyonunuz iptal edilmiştir. Başka bir tarih için tekrar deneyebilirsiniz.</p>',
      'tamamlandi': '<p>Bizi tercih ettiğiniz için teşekkürler! Deneyiminiz hakkında görüşlerinizi paylaşırsanız çok memnun oluruz.</p>'
    };
    return messageMap[status] || '';
  }
}

module.exports = new EmailService();