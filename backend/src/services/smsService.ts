import axios from 'axios';

const BASE_URL = 'https://api.textbee.dev/api/v1';
const API_KEY = process.env.TEXTBEE_API_KEY;
const DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;

// Parse multiple admin phone numbers from environment variable
const getAdminPhoneNumbers = (): string[] => {
  const phoneString = process.env.ADMIN_PHONE_NUMBERS;
  if (!phoneString) return [];
  
  return phoneString
    .split(',')
    .map(phone => phone.trim())
    .filter(phone => phone.length > 0);
};

interface SendSmsParams {
  recipients: string[];
  message: string;
}

export const sendSms = async ({ recipients, message }: SendSmsParams): Promise<any> => {
  try {
    if (!API_KEY || !DEVICE_ID) {
      console.warn('⚠️ TextBee API credentials not configured - SMS not sent');
      return null;
    }

    if (!recipients || recipients.length === 0) {
      console.warn('⚠️ No recipients provided for SMS');
      return null;
    }

    console.log(`📱 Sending SMS to ${recipients.length} recipient(s)...`);

    const response = await axios.post(
      `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
      {
        recipients,
        message
      },
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ SMS sent successfully to ${recipients.join(', ')}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error.response?.data || error.message);
    throw error;
  }
};

interface OrderItemForSms {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  toppings?: string[];
}

interface CouponForSms {
  isApplied: boolean;
  code?: string;
  discountAmount: number;
  discountPercentage?: number;
}

export const sendNewOrderSms = async (
  orderId: string,
  customerName: string,
  customerPhone: string,
  totalAmount: number,
  items: OrderItemForSms[],
  deliveryType: string,
  address: string,
  cookingInstructions?: string,
  customItems?: string,
  coupon?: CouponForSms
): Promise<void> => {
  try {
    const adminPhones = getAdminPhoneNumbers();
    
    if (adminPhones.length === 0) {
      console.warn('⚠️ Admin phone numbers not configured - SMS notification skipped');
      return;
    }
    
    console.log(`📱 Sending admin notification to ${adminPhones.length} phone number(s): ${adminPhones.join(', ')}`);

    const deliveryInfo = deliveryType === 'door-delivery' 
      ? `🚗 DELIVERY\nAddress: ${address}`
      : `🏪 PICKUP at store`;

    // Format items with details
    const itemsDetails = items.map(item => {
      let itemText = `${item.quantity}x ${item.name}`;
      
      if (item.size) {
        itemText += ` (${item.size})`;
      }
      
      if (item.toppings && item.toppings.length > 0) {
        itemText += `\n   Toppings: ${item.toppings.join(', ')}`;
      }
      
      itemText += ` - $${(item.price * item.quantity).toFixed(2)}`;
      
      return itemText;
    }).join('\n\n');

    // Build custom items section
    const customItemsSection = customItems ? `\n✨ CUSTOM ITEMS:\n${customItems}\n` : '';
    
    // Build cooking instructions section
    const cookingInstructionsSection = cookingInstructions ? `\n🔥 COOKING INSTRUCTIONS:\n${cookingInstructions}\n` : '';

    // Build coupon section
    const couponSection = (coupon && coupon.isApplied) 
      ? `\n🎟️ COUPON APPLIED: ${coupon.code}${coupon.discountPercentage ? ` (${coupon.discountPercentage}% OFF)` : ''}\nDiscount: -$${coupon.discountAmount.toFixed(2)}\n` 
      : '';

    const message = `🔔 NEW ORDER RECEIVED!

Order ID: #${orderId}
Customer: ${customerName}
Phone: ${customerPhone}

${deliveryInfo}

📦 ORDER ITEMS:
${itemsDetails}
${customItemsSection}${cookingInstructionsSection}${couponSection}
💰 TOTAL: $${totalAmount.toFixed(2)}

Check the app for more details.`;

    await sendSms({
      recipients: adminPhones,
      message
    });

    console.log(`✅ New order SMS notification sent to ${adminPhones.length} admin(s) for order #${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to send new order SMS for order #${orderId}:`, error);
    // Don't throw - we don't want SMS failures to break order creation
  }
};

export const sendCustomerOrderConfirmationSms = async (
  orderId: string,
  customerName: string,
  customerPhone: string,
  totalAmount: number,
  items: OrderItemForSms[],
  deliveryType: string,
  address: string,
  coupon?: CouponForSms
): Promise<void> => {
  try {
    if (!API_KEY || !DEVICE_ID) {
      console.warn('⚠️ TextBee API credentials not configured - Customer SMS not sent');
      return;
    }

    if (!customerPhone) {
      console.warn('⚠️ Customer phone number not provided - Customer SMS not sent');
      return;
    }

    const deliveryInfo = deliveryType === 'door-delivery' 
      ? `🚗 Delivery to:\n${address}`
      : `🏪 Pickup at store`;

    // Format items summary (simpler for customer)
    const itemsSummary = items.map(item => {
      let itemText = `${item.quantity}x ${item.name}`;
      if (item.size) {
        itemText += ` (${item.size})`;
      }
      return itemText;
    }).join('\n');

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Build coupon section
    const couponSection = (coupon && coupon.isApplied) 
      ? `Discount (${coupon.code}): -$${coupon.discountAmount.toFixed(2)}\n` 
      : '';

    const message = `✅ ORDER CONFIRMED!

Hi ${customerName},

Thank you for your order at Sandy's Market!

Order ID: #${orderId}

📦 YOUR ORDER:
${itemsSummary}

${deliveryInfo}

💰 ORDER SUMMARY:
Subtotal: $${subtotal.toFixed(2)}
${couponSection}Total: $${totalAmount.toFixed(2)}

We'll notify you when your order is ready!

Questions? Call us on 989-435-9688.

Sandy's Market ❤️`;

    await sendSms({
      recipients: [customerPhone],
      message
    });

    console.log(`📱 Order confirmation SMS sent to customer for order #${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to send customer confirmation SMS for order #${orderId}:`, error);
    // Don't throw - we don't want SMS failures to break order creation
  }
};

export const sendOrderStatusSms = async (
  customerPhone: string,
  orderId: string,
  status: string,
  customerName: string
): Promise<void> => {
  try {
    if (!API_KEY || !DEVICE_ID) {
      console.warn('⚠️ TextBee API credentials not configured - SMS not sent');
      return;
    }

    const statusMessages: { [key: string]: string } = {
      preparing: '👨‍🍳 Your order is being prepared!',
      ready: '✅ Your order is ready for pickup!',
      delivered: '🎉 Your order has been delivered!'
    };

    const statusMessage = statusMessages[status] || `Order status updated to: ${status}`;

    const message = `Hi ${customerName},

${statusMessage}

Order ID: #${orderId}

Thank you for choosing Sandy Market!`;

    await sendSms({
      recipients: [customerPhone],
      message
    });

    console.log(`📱 Status update SMS sent to customer for order #${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to send status SMS for order #${orderId}:`, error);
    // Don't throw - we don't want SMS failures to break status updates
  }
};
