import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { OrderDetails } from '../types/order'; // Adjust the import path as necessary

dotenv.config();

// Add console log to verify email configuration
console.log('Email Configuration:', {
  user: process.env.EMAIL_USER,
  host: 'smtp.gmail.com',
  port: 587,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails) => {
  try {
    if (!orderDetails.customerEmail) {
      console.error('Customer email is missing');
      return;
    }

    const mailOptions = {
      from: `"Sandy's Market" <${process.env.EMAIL_USER}>`,
      to: orderDetails.customerEmail,
      subject: "Your Order Confirmation - Sandy's Market",
      text: `Thank you for your order!\n\nOrder ID: ${orderDetails.id}\nTotal Amount: $${orderDetails.totalAmount.toFixed(2)}\n\nItems:\n${orderDetails.items.map(item => `${item.quantity}x ${item.name}`).join('\n')}\n\nWe'll notify you when your order is ready for pickup.`,
      html: `
        <h2>Thank you for your order!</h2>
        <p><strong>Order ID:</strong> ${orderDetails.id}</p>
        <p><strong>Total Amount:</strong> $${orderDetails.totalAmount.toFixed(2)}</p>
        <h3>Order Items:</h3>
        <ul>
          ${orderDetails.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('')}
        </ul>
        <p>We'll notify you when your order is ready for pickup.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;

  } catch (error) {
    console.error('Failed to send email:', error);
    throw error; // Rethrow to handle in the order creation
  }
}; 