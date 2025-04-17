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

const sendStoreNotification = async (orderDetails: OrderDetails) => {
  // Split the STORE_EMAILS environment variable by comma and trim whitespace
  const storeEmails = (process.env.STORE_EMAILS || process.env.EMAIL_USER || '')
    .split(',')
    .map(email => email.trim())
    .filter(email => email); // Remove any empty strings

  const mailOptions = {
    from: `"Sandy's Market System" <${process.env.EMAIL_USER}>`,
    to: storeEmails.join(', '), // Join multiple emails with comma
    subject: "New Food Order Received - Sandy's Market",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <style>
            :root { color-scheme: light; }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333 !important; 
              background-color: #ffffff !important;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
              background-color: #ffffff !important;
            }
            .header { 
              background-color: #2E7D32 !important; 
              color: white !important; 
              padding: 20px; 
              text-align: center; 
              border-radius: 5px 5px 0 0; 
            }
            .action-banner {
              border-color: #ff9800 !important;
              color: white !important;
              padding: 10px;
              text-align: center;
              font-weight: bold;
              margin: -20px -20px 20px -20px;
            }
            .content { 
              background-color: #ffffff !important; 
              padding: 20px; 
              border: 1px solid #ddd;
              color: #333 !important;
            }
            .order-details { 
              background-color: #f9f9f9 !important; 
              padding: 15px; 
              margin: 15px 0; 
              border-radius: 5px;
              color: #333 !important;
            }
            .steps-container {
              background-color: #e8f5e9 !important;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
            }
            .step {
              margin: 10px 0;
              padding: 10px;
              background-color: white !important;
              border-radius: 5px;
              border-left: 4px solid #2E7D32;
            }
            .urgent {
              background-color: #fbe9e7 !important;
              border: 2px solid #ff5722;
              padding: 10px;
              margin: 15px 0;
              border-radius: 5px;
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Food Order Alert!</h1>
            </div>
            <div class="content">
              <div class="action-banner">
                ⚡ ACTION REQUIRED: New Order Needs Processing
              </div>

              <div class="order-details">
                <h2>📋 Order Details</h2>
                <p><strong>Order ID:</strong> ${orderDetails.id}</p>
                <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
                <p><strong>Phone:</strong> ${orderDetails.phone}</p>
                <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
                <p><strong>Status:</strong> <span style="color: #ff9800 !important; font-weight: bold;">PENDING</span></p>
              </div>

         

              <h2>🍕 Order Items</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #ffffff !important;">
                <thead style="background-color: #f5f5f5 !important;">
                  <tr>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderDetails.items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total Amount:</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold;">$${orderDetails.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

                   <div class="steps-container">
                <h2>🎯 Required Actions:</h2>
                <div class="step">
                  <h3>1. Review Order (Immediate)</h3>
                  <p>Verify all items and quantities listed below</p>
                </div>
                <div class="step">
                  <h3>2. Prepare Items (Within 5 mins)</h3>
                  <p>Start preparing the order as per specifications</p>
                </div>
                <div class="step">
                  <h3>3. Update Status (After Starting)</h3>
                  <p>Mark as "Preparing" in the admin dashboard</p>
                </div>
                <div class="step">
                  <h3>4. Quality Check (Before Completion)</h3>
                  <p>Ensure all items match the order specifications</p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f5f5f5 !important; border-radius: 5px;">
                <p style="margin: 0;">
                  <strong>Need help? Contact IT Support</strong><br>
                  📞 System Support: rajeshnambi2016@gmail.com
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails) => {
  try {
    if (!orderDetails.customerEmail) {
      console.error('Customer email is missing');
      return;
    }

    // Send email to customer
    const customerMailOptions = {
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
                  <p>❤️ With Love from Sandy's Market</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    };

    // Send both emails concurrently
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      sendStoreNotification(orderDetails)
    ]);

    console.log('Emails sent successfully to customer and store');
  } catch (error) {
    console.error('Failed to send emails:', error);
    throw error;
  }
}; 