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
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2E7D32; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
              .order-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              .button { background-color: #2E7D32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Order Confirmation</h1>
              </div>
              <div class="content">
                <p>Thank you for your order at Sandy's Market!</p>
                
                <div class="order-details">
                  <h2>Order Information</h2>
                  <p><strong>Order ID:</strong> ${orderDetails.id}</p>
                  <p><strong>Order Status:</strong> Pending</p>
                </div>

                <h3>Order Items</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderDetails.items.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>$${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total">
                  Total Amount: $${orderDetails.totalAmount.toFixed(2)}
                </div>

                <p>We'll notify you when your order is ready for pickup.</p>
                
                <div style="text-align: center;">
                  <a href="https://sandymarket.up.railway.app/orders/${orderDetails.id}" class="button">View Order Details</a>
                </div>

                <div class="footer">
                  <p>If you have any questions about your order, please contact us.</p>
                  <p>© ${new Date().getFullYear()} Sandy's Market. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;

  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}; 