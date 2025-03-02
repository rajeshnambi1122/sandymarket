import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { OrderDetails } from '../types/order'; // Adjust the import path as necessary

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: orderDetails.customerEmail,
      subject: 'Order Confirmation',
      text: `Thank you for your order!\n\nOrder ID: ${orderDetails.id}\nTotal Amount: $${orderDetails.totalAmount}\n\nItems:\n${orderDetails.items.map((item) => `${item.quantity}x ${item.name}`).join('\n')}`,
      html: `<p>Thank you for your order!</p><p>Order ID: ${orderDetails.id}</p><p>Total Amount: $${orderDetails.totalAmount}</p><p>Items:</p><ul>${orderDetails.items.map((item) => `<li>${item.quantity}x ${item.name}</li>`).join('')}</ul>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw the error to prevent order creation failure
  }
}; 