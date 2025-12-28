import { Resend } from 'resend';
import dotenv from 'dotenv';
import { OrderDetails, OrderItem } from '../types/order';

dotenv.config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Store email configuration
const FROM_EMAIL = "Sandy's Market <orders@sandysmarket.net>";

/**
 * Validate and parse email addresses for Resend API
 */
const parseAndValidateEmails = (emailString: string): string[] => {
  if (!emailString) return [];

  const emails = emailString
    .split(',')
    .map(email => email.trim())
    .filter(email => email && email.includes('@'));

  // Validate email format for Resend
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.filter(email => emailRegex.test(email));
};

/**
 * Send notification to store staff about new orders
 */
const sendStoreNotification = async (orderDetails: OrderDetails): Promise<void> => {
  try {
    const storeEmails = parseAndValidateEmails(process.env.STORE_EMAILS || '');
    console.log('storeEmails', storeEmails);

    if (storeEmails.length === 0) {
      throw new Error('No valid store email addresses found in STORE_EMAILS environment variable');
    }

    console.log('📧 SENDING STORE NOTIFICATION:', `Attempting to send to ${storeEmails.length} store email(s)`);
    console.log('📋 STORE EMAIL RECIPIENTS:', storeEmails.map((email, index) => `  ${index + 1}. ${email}`).join('\n'));

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: storeEmails,
      subject: "🚨New Food Order Received - Sandy's Market",
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
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
                background-color: #ffffff !important;
              }
              .header { 
                background: linear-gradient(135deg, #2E7D32, #4CAF50) !important;
                color: white !important; 
                padding: 30px 20px; 
                text-align: center; 
                border-radius: 5px 5px 0 0; 
              }
              .action-banner {
                background-color: #ff9800 !important;
                color: white !important;
                padding: 15px;
                text-align: center;
                font-weight: bold;
                margin: 0;
                border-radius: 0;
              }
              .content { 
                background-color: #ffffff !important; 
                padding: 20px; 
                border: 1px solid #ddd;
                border-top: none;
                color: #333 !important;
              }
              .order-details { 
                background-color: #f9f9f9 !important; 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 8px;
                border-left: 4px solid #2E7D32;
                color: #333 !important;
              }
              .order-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: #ffffff !important;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .order-table th {
                background-color: #f0f0f0 !important;
                padding: 15px;
                text-align: left;
                border-bottom: 2px solid #ddd;
                font-weight: bold;
              }
              .order-table td {
                padding: 15px;
                border-bottom: 1px solid #ddd;
                vertical-align: top;
              }
              .toppings-info {
                margin-top: 5px;
                padding: 8px;
                background-color: #e8f5e9 !important;
                border-left: 3px solid #4caf50;
                border-radius: 3px;
                font-size: 14px;
              }
              .warning-info {
                margin-top: 5px;
                padding: 8px;
                background-color: #ffebee !important;
                border-left: 3px solid #c62828;
                border-radius: 3px;
                font-size: 14px;
              }
              .cooking-instructions {
                background-color: #fff3e0 !important;
                padding: 15px;
                margin: 15px 0;
                border-radius: 5px;
                border-left: 4px solid #ff9800 !important;
              }
              .total-section { 
                background-color: #f0f8ff !important;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                text-align: right;
                border: 2px solid #2E7D32;
              }
              .support-section {
                text-align: center;
                margin-top: 20px;
                padding: 15px;
                background-color: #f5f5f5 !important;
                border-radius: 5px;
                border: 1px solid #ddd;
              }
              @media only screen and (max-width: 600px) {
                .container {
                  padding: 10px !important;
                  width: 100% !important;
                }
                .content {
                  padding: 15px 10px !important;
                }
                .order-table, .order-table tbody, .order-table tr, .order-table td {
                  display: block !important;
                  width: 100% !important;
                }
                .order-table thead {
                  display: none !important;
                }
                .order-table tr {
                  margin-bottom: 15px !important;
                  border: 1px solid #ddd !important;
                  border-radius: 5px !important;
                  padding: 10px !important;
                }
                .order-table td {
                  text-align: left !important;
                  padding: 5px 0 !important;
                  border: none !important;
                }
                .order-table td::before {
                  content: attr(data-label);
                  font-weight: bold;
                  display: block;
                  margin-bottom: 5px;
                  color: #666;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍕 New Order Alert!</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px;">Order #${orderDetails.id}</p>
              </div>
              
              <div class="action-banner">
                ⚡ IMMEDIATE ACTION REQUIRED - New Order Needs Processing
              </div>
              
              <div class="content">
                <div class="order-details">
                  <h2 style="margin-top: 0; color: #2E7D32;">📋 Customer Information</h2>
                  <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
                  <p><strong>Phone:</strong> <a href="tel:${orderDetails.phone}">${orderDetails.phone}</a></p>
                  <p><strong>Email:</strong> <a href="mailto:${orderDetails.customerEmail}">${orderDetails.customerEmail}</a></p>
                  <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">⏳ PENDING</span></p>
                  <p><strong>Order Time:</strong> ${new Date().toLocaleString()}</p>
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2E7D32;">
                    <p style="margin-bottom: 10px;"><strong>Delivery Method:</strong> 
                      <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: bold; background-color: ${orderDetails.deliveryType === 'door-delivery' ? '#2196F3' : '#4CAF50'}; color: white;">
                        ${orderDetails.deliveryType === 'door-delivery' ? '🚚 DOOR DELIVERY' : '📍 PICKUP'}
                      </span>
                    </p>
                    <p style="margin: 0; font-weight: bold; color: ${orderDetails.deliveryType === 'door-delivery' ? '#1976d2' : '#2E7D32'};"><strong>${orderDetails.deliveryType === 'door-delivery' ? '🚚 Delivery' : '📍 Pickup'} Address:</strong> ${orderDetails.address || 'Pickup at store'}</p>
                  </div>
                </div>

                ${orderDetails.customItems ? `
                <div class="cooking-instructions" style="background-color: #f3e5f5; border-left: 4px solid #9c27b0;">
                  <h3 style="margin-top: 0; color: #7b1fa2;">✨ Custom Items Requested</h3>
                  <p style="margin-bottom: 0; font-size: 16px; font-weight: 500;">${orderDetails.customItems}</p>
                </div>
                ` : ''}

                ${orderDetails.cookingInstructions ? `
                <div class="cooking-instructions">
                  <h3 style="margin-top: 0; color: #e65100;">🔥 Special Cooking Instructions</h3>
                  <p style="margin-bottom: 0; font-size: 16px; font-weight: 500;">${orderDetails.cookingInstructions}</p>
                </div>
                ` : ''}

                <h2 style="color: #2E7D32;">🛒 Order Items</h2>
                <table class="order-table">
                  <thead>
                    <tr>
                      <th>Item Details</th>
                      <th style="text-align: center; width: 80px;">Qty</th>
                      <th style="text-align: right; width: 80px;">Price</th>
                      <th style="text-align: right; width: 100px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderDetails.items.map(item => `
                      <tr>
                        <td data-label="Item Details">
                          <strong>${item.name}</strong>
                          ${item.size ? `<br><small style="color: #666;">Size: ${item.size}</small>` : ''}
                          ${(item.name.toLowerCase().includes('pizza') && item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) ?
          `<div class="toppings-info">
                              <strong style="color: #2e7d32;">🍅 TOPPINGS:</strong> ${item.toppings.join(', ')}
                             </div>`
          : (item.name.toLowerCase().includes('topping') ?
            `<div class="warning-info">
                                  <strong style="color: #c62828;">⚠️ WARNING:</strong> No toppings selected!
                                </div>`
            : '')}
                        </td>
                        <td data-label="Qty" style="text-align: center; font-weight: bold; font-size: 16px;">${item.quantity}</td>
                        <td data-label="Price" style="text-align: right;">$${item.price.toFixed(2)}</td>
                        <td data-label="Total" style="text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total-section">
                  <p style="margin: 5px 0; font-size: 16px; color: #666;">
                    Subtotal: $${orderDetails.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </p>
                  ${(orderDetails.coupon && orderDetails.coupon.isApplied) ? `
                  <p style="margin: 5px 0; font-size: 16px; color: #2E7D32;">
                    Discount (${orderDetails.coupon.code}${orderDetails.coupon.discountPercentage ? ` - ${orderDetails.coupon.discountPercentage}%` : ''}): -$${(orderDetails.coupon.discountAmount || 0).toFixed(2)}
                  </p>
                  ` : ''}
                  <h3 style="margin: 10px 0 0 0; font-size: 24px; color: #2E7D32; border-top: 1px solid #ccc; padding-top: 10px;">
                    Total: $${orderDetails.totalAmount.toFixed(2)}
                  </h3>
                </div>

                <div style="background-color: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2196f3;">
                  <h3 style="margin-top: 0; color: #1976d2;">📝 Next Steps:</h3>
                  <ol style="margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;"><strong>Acknowledge Order:</strong> Review all items and quantities</li>
                    <li style="margin-bottom: 8px;"><strong>Start Preparation:</strong> Begin cooking within 5 minutes</li>
                    <li style="margin-bottom: 8px;"><strong>Update Status:</strong> Mark as "Preparing" in admin dashboard</li>
                    <li style="margin-bottom: 0;"><strong>Quality Check:</strong> Verify order matches specifications before completion</li>
                  </ol>
                </div>

                <div class="support-section">
                  <h4 style="margin-top: 0;">Need Technical Support?</h4>
                  <p style="margin: 5px 0;">
                    📧 <a href="mailto:rajeshnambi2016@gmail.com">rajeshnambi2016@gmail.com</a><br>
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Failed to send store notification via Resend:', error);
      throw error;
    }

    console.log('Store notification sent successfully via Resend:', data?.id);
  } catch (error) {
    console.error('Error sending store notification:', error);
    throw error;
  }
};

/**
 * Send order confirmation email to customer
 */
export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails): Promise<void> => {
  try {
    if (!orderDetails.customerEmail) {
      console.error('Customer email is missing');
      return;
    }

    // Validate customer email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderDetails.customerEmail)) {
      console.error('Customer email format is invalid:', orderDetails.customerEmail);
      throw new Error(`Invalid customer email format: ${orderDetails.customerEmail}`);
    }

    // Log order items for debugging
    console.log("RESEND SERVICE - Preparing order confirmation email:");
    orderDetails.items.forEach((item: OrderItem, index: number) => {
      console.log(`Email Item ${index}: ${item.name}`, {
        hasTopping: !!item.toppings,
        toppingsArray: item.toppings || [],
        toppingsCount: item.toppings ? item.toppings.length : 0,
        toppingsString: item.toppings ? item.toppings.join(', ') : 'NONE',
        size: item.size || null,
        quantity: item.quantity,
        price: item.price
      });
    });

    // Send customer confirmation email
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [orderDetails.customerEmail],
      subject: "✅ Order Confirmation - Sandy's Market",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #2E7D32, #4CAF50);
                color: white; 
                padding: 30px 20px; 
                text-align: center;
              }
              .content { 
                padding: 30px 20px;
              }
              .order-summary { 
                background-color: #f9f9f9; 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 8px;
                border-left: 4px solid #2E7D32;
              }
              .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .items-table th { 
                background-color: #f0f0f0;
                padding: 15px; 
                text-align: left; 
                border-bottom: 2px solid #ddd;
                font-weight: bold;
              }
              .items-table td { 
                padding: 15px; 
                border-bottom: 1px solid #ddd;
                vertical-align: top;
              }
              .toppings-display {
                margin-top: 8px;
                padding: 10px;
                background-color: #e8f5e9;
                border-left: 3px solid #4caf50;
                border-radius: 4px;
                font-size: 14px;
              }
              .warning-display {
                margin-top: 8px;
                padding: 10px;
                background-color: #ffebee;
                border-left: 3px solid #c62828;
                border-radius: 4px;
                font-size: 14px;
              }
              .cooking-instructions {
                background-color: #fff3e0;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                border-left: 4px solid #ff9800;
              }
              .total-section { 
                background-color: #f0f8ff;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                text-align: right;
                border: 2px solid #2E7D32;
              }
              .cta-button { 
                background-color: #2E7D32; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 6px; 
                display: inline-block; 
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
              .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding: 20px;
                background-color: #f5f5f5;
                color: #666;
                border-top: 1px solid #ddd;
              }
              .status-badge {
                background-color: #ff9800;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
                display: inline-block;
              }
              @media only screen and (max-width: 600px) {
                .container {
                  width: 100% !important;
                }
                .content {
                  padding: 15px 10px !important;
                }
                .header {
                  padding: 20px 15px !important;
                }
                .items-table, .items-table tbody, .items-table tr, .items-table td {
                  display: block !important;
                  width: 100% !important;
                }
                .items-table thead {
                  display: none !important;
                }
                .items-table tr {
                  margin-bottom: 15px !important;
                  border: 1px solid #eee !important;
                  border-radius: 8px !important;
                  padding: 15px !important;
                  background-color: #f9f9f9 !important;
                }
                .items-table td {
                  text-align: left !important;
                  padding: 5px 0 !important;
                  border: none !important;
                }
                /* Hide Qty/Total in main list, show in flex layout */
                .items-table td:nth-child(2), .items-table td:nth-child(3) {
                   display: inline-block !important;
                   width: auto !important;
                   margin-right: 15px !important;
                   background-color: #fff !important;
                   padding: 4px 8px !important;
                   border-radius: 4px !important;
                   border: 1px solid #ddd !important;
                   margin-top: 10px !important;
                }
                .cta-button {
                  display: block !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Thank You for Your Order!</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Sandy's Market</p>
              </div>
              
              <div class="content">
                <p style="font-size: 18px; margin-bottom: 0;">Hi <strong>${orderDetails.customerName}</strong>,</p>
                <p>We've received your order and we're excited to prepare it for you!</p>
                
                <div class="order-summary">
                  <h2 style="margin-top: 0; color: #2E7D32;">📋 Order Summary</h2>
                  <p><strong>Order ID:</strong> ${orderDetails.id}</p>
                  <p><strong>Status:</strong> <span class="status-badge">⏳ Pending</span></p>
                  <p><strong>Order Time:</strong> ${new Date().toLocaleString()}</p>
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                    <p style="margin-bottom: 10px;"><strong>Delivery Method:</strong> 
                      <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: bold; background-color: ${orderDetails.deliveryType === 'door-delivery' ? '#2196F3' : '#4CAF50'}; color: white;">
                        ${orderDetails.deliveryType === 'door-delivery' ? '🚚 Door Delivery' : '📍 Pickup'}
                      </span>
                    </p>
                    <p style="margin: 0;"><strong>${orderDetails.deliveryType === 'door-delivery' ? 'Delivery' : 'Pickup'} Address:</strong> ${orderDetails.address || 'Pickup at store'}</p>
                  </div>
                </div>

                ${orderDetails.customItems ? `
                <div class="cooking-instructions" style="background-color: #f3e5f5; border-left: 4px solid #9c27b0;">
                  <h3 style="margin-top: 0; color: #7b1fa2;">✨ Custom Items</h3>
                  <p style="margin-bottom: 0; font-size: 16px; font-style: italic;">"${orderDetails.customItems}"</p>
                </div>
                ` : ''}

                ${orderDetails.cookingInstructions ? `
                <div class="cooking-instructions">
                  <h3 style="margin-top: 0; color: #e65100;">🔥 Your Special Instructions</h3>
                  <p style="margin-bottom: 0; font-size: 16px; font-style: italic;">"${orderDetails.cookingInstructions}"</p>
                </div>
                ` : ''}

                <h3 style="color: #2E7D32;">🛒 Your Order Items</h3>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: center; width: 80px;">Qty</th>
                      <th style="text-align: right; width: 100px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderDetails.items.map(item => `
                      <tr>
                        <td>
                          <strong style="font-size: 16px;">${item.name}</strong>
                          ${item.size ? `<br><span style="color: #666; font-size: 14px;">Size: ${item.size}</span>` : ''}
                          ${(item.name.toLowerCase().includes('pizza') && item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) ?
          `<div class="toppings-display">
                              <strong style="color: #2e7d32;">🍅 Toppings:</strong> ${item.toppings.join(', ')}
                             </div>`
          : (item.name.toLowerCase().includes('topping') ?
            `<div class="warning-display">
                                  <strong style="color: #c62828;">⚠️ Note:</strong> No toppings selected
                                </div>`
            : '')}
                        </td>
                        <td style="text-align: center; font-weight: bold; font-size: 16px;">${item.quantity}</td>
                        <td style="text-align: right; font-weight: bold; font-size: 16px;">$${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total-section">
                  <p style="margin: 5px 0; font-size: 16px; color: #666;">
                    Subtotal: $${orderDetails.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </p>
                  ${(orderDetails.coupon && orderDetails.coupon.isApplied) ? `
                  <p style="margin: 5px 0; font-size: 16px; color: #2E7D32;">
                    Discount (${orderDetails.coupon.code}${orderDetails.coupon.discountPercentage ? ` - ${orderDetails.coupon.discountPercentage}%` : ''}): -$${(orderDetails.coupon.discountAmount || 0).toFixed(2)}
                  </p>
                  ` : ''}
                  <h3 style="margin: 10px 0 0 0; font-size: 24px; color: #2E7D32; border-top: 1px solid #ccc; padding-top: 10px;">
                    Total: $${orderDetails.totalAmount.toFixed(2)}
                  </h3>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <p style="font-size: 18px; margin-bottom: 15px;"><strong>What's Next?</strong></p>
                  <p>We'll send you another email when your order is ready for pickup!</p>
                  <a href="https://www.sandysmarket.net/profile" class="cta-button">
                    🔍 Track Your Order
                  </a>
                </div>

                <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
                  <h4 style="margin-top: 0; color: #1976d2;">📞 Questions About Your Order?</h4>
                  <p style="margin-bottom: 0;">
                    Feel free to call us or visit our store.<br>
                    We're here to help make your experience great!
                  </p>
                </div>
              </div>

              <div class="footer">
                <p style="margin: 0 0 10px 0;"><strong>Thank you for choosing Sandy's Market!</strong></p>
                <p style="margin: 0; font-size: 14px;">We appreciate your business and can't wait to serve you again. ❤️</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (customerError) {
      console.error('Failed to send customer confirmation via Resend:', customerError);
      throw customerError;
    }

    console.log('Customer confirmation sent successfully via Resend:', customerData?.id);

    // Send store notification concurrently
    await sendStoreNotification(orderDetails);

    console.log('All email notifications sent successfully via Resend');
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
};

export default {
  sendOrderConfirmationEmail,
  sendStoreNotification
};
