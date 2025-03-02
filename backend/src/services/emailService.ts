import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { OrderDetails } from '../types/order'; // Adjust the import path as necessary

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: Number(process.env.EMAIL_PORT), // e.g., 587
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orderDetails.customerEmail, // recipient's email
    subject: 'Order Confirmation',
    text: `Thank you for your order!\n\nOrder ID: ${orderDetails.id}\nTotal Amount: $${orderDetails.totalAmount}\n\nItems:\n${orderDetails.items.map((item) => `${item.quantity}x ${item.name}`).join('\n')}`,
    html: `<p>Thank you for your order!</p><p>Order ID: ${orderDetails.id}</p><p>Total Amount: $${orderDetails.totalAmount}</p><p>Items:</p><ul>${orderDetails.items.map((item) => `<li>${item.quantity}x ${item.name}</li>`).join('')}</ul>`,
  };

  await transporter.sendMail(mailOptions);
}; 