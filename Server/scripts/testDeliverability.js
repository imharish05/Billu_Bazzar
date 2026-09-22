'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: `"Billu Bazaar" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Billu Bazaar: Order BB3C899A7E Confirmed',
      text: 'Dear Harish,\n\nThank you for your order (BB3C899A7E). Your order has been confirmed and our warehouse is preparing it.\n\nTotal: INR 3,712.00\nPayment: Paid\n\nThank you for shopping at Billu Bazaar.',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 20px;">
          <h2>Billu Bazaar - Order Confirmed</h2>
          <p>Dear Harish,</p>
          <p>Thank you for your order <strong>#BB3C899A7E</strong>. We have successfully received your payment and our team is preparing it for shipment.</p>
          <p><strong>Order Total:</strong> ₹3,712.00<br/><strong>Payment Status:</strong> Paid</p>
          <p>Billu Bazaar Concierge</p>
        </body>
        </html>
      `
    });
    console.log('✅ Sent successfully! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending mail:', err.message);
  }
}

run();
