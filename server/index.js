// server/index.js
require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Statik dosyalar için
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// server/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendReservationEmail(reservation) {
    // Müşteriye gönderilecek email
    const customerMailOptions = {
        from: process.env.EMAIL_USER,
        to: reservation.email,
        subject: "Rezervasyon Onayı",
        html: `
      <h2>Rezervasyon Onayı</h2>
      <p>Sayın ${reservation.name},</p>
      <p>Rezervasyonunuz başarıyla oluşturulmuştur:</p>
      <ul>
        <li>Tarih: ${reservation.date}</li>
        <li>Saat: ${reservation.time}</li>
        <li>Kişi Sayısı: ${reservation.guests}</li>
      </ul>
      <p>Sizi ağırlamaktan mutluluk duyacağız!</p>
    `
    };

    // Restoran yönetimine gönderilecek email
    const restaurantMailOptions = {
        from: process.env.EMAIL_USER,
        to: "lunabrewankara@gmail.com",
        subject: "Yeni Rezervasyon Bildirimi",
        html: `
      <h2>Yeni Rezervasyon</h2>
      <p>Yeni bir rezervasyon talebi alındı:</p>
      <ul>
        <li>Müşteri: ${reservation.name}</li>
        <li>Email: ${reservation.email}</li>
        <li>Telefon: ${reservation.phone}</li>
        <li>Tarih: ${reservation.date}</li>
        <li>Saat: ${reservation.time}</li>
        <li>Kişi Sayısı: ${reservation.guests}</li>
        ${reservation.message ? `<li>Mesaj: ${reservation.message}</li>` : ''}
      </ul>
    `
    };

    // Her iki emaili de gönder
    await Promise.all([
        transporter.sendMail(customerMailOptions),
        transporter.sendMail(restaurantMailOptions)
    ]);
}

module.exports = { sendReservationEmail };

// server/routes.js
const express = require('express');
const { sendReservationEmail } = require('./mailer');

const router = express.Router();

router.post("/api/reservations", async (req, res) => {
    try {
        // Get form data
        const reservation = {
            date: req.body.date,
            time: req.body.time,
            guests: req.body.guests,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message
        };

        // Send confirmation email
        await sendReservationEmail(reservation);

        res.json({
            result: 'success',
            message: "Reservation created successfully"
        });
    } catch (error) {
        console.error('Reservation error:', error);
        res.status(500).json({
            result: 'error',
            message: error instanceof Error ? error.message : "Failed to process reservation"
        });
    }
});

module.exports = router;