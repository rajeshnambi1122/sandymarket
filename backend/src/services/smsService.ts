import axios from 'axios';
import { LowFuelAlert, TankStatusReportEntry } from '../types/fuelTypes';
import { SendSmsParams, OrderItemForSms, CouponForSms } from '../types/order';
import { PriceComparison } from './gasBuddyService';

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
  }
};

// Send SMS fuel alert — only between 8am and 8pm Detroit (ET) time
export const sendFuelAlertSms = async (lowFuelTanks: LowFuelAlert[]): Promise<void> => {
  try {
    // Check current time in Detroit (America/Detroit = Eastern Time, auto DST)
    const now = new Date();
    const detroitHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Detroit',
        hour: 'numeric',
        hour12: false,
      }).format(now)
    );

    const detroitTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Detroit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now);

    if (detroitHour < 8 || detroitHour >= 20) {
      console.log(`📵 SMS fuel alert skipped — Detroit time is ${detroitTimeStr} (outside 8am–8pm window)`);
      return;
    }

    console.log(`🕐 Detroit time: ${detroitTimeStr} — within SMS window, sending alert...`);

    // Get phone number(s) from env
    const fuelAlertPhone = process.env.FUEL_ALERT_PHONE;
    if (!fuelAlertPhone) {
      console.warn('⚠️ FUEL_ALERT_PHONE not set in .env — SMS skipped');
      return;
    }

    const recipients = fuelAlertPhone.split(',').map(p => p.trim()).filter(Boolean);

    // Build message
    const tankLines = lowFuelTanks.map(alert =>
      `  ${alert.tank.productLabel} (Tank ${alert.tank.tankNumber}): ${alert.tank.volumeGallons.toFixed(0)} gal (threshold: ${alert.threshold} gal)`
    ).join('\n');

    const message =
      `⛽FUEL ALERT - Sandy's Market

${lowFuelTanks.length} tank(s) below threshold:
${tankLines}`;

    await sendSms({ recipients, message });
    console.log(`✅ Fuel alert SMS sent to: ${recipients.join(', ')}`);
  } catch (error: any) {
    console.error('❌ Failed to send fuel alert SMS:', error.message);
    // Don't throw — SMS failure should not block other alerts
  }
};

/**
 * Send fuel delivery SMS notification to FUEL_ALERT_PHONE
 */
export const sendFuelStatusReportSms = async (
  report: TankStatusReportEntry[],
  period: 'Morning' | 'Evening' = 'Morning'
): Promise<void> => {
  try {
    const fuelAlertPhone = process.env.FUEL_ALERT_PHONE;
    if (!fuelAlertPhone) {
      console.warn('FUEL_ALERT_PHONE not set in .env - SMS skipped');
      return;
    }

    const recipients = fuelAlertPhone.split(',').map(p => p.trim()).filter(Boolean);
    const lowCount = report.filter((entry) => entry.isLow).length;
    const tankLines = report.map((entry) =>
      `${entry.tank.productLabel} T${entry.tank.tankNumber}: ${entry.tank.volumeGallons.toFixed(0)} gal (${entry.percentageFull.toFixed(0)}%)${entry.isLow ? ' LOW' : ''}`
    ).join('\n');

    const message = `TANK STATUS REPORT - ${period.toUpperCase()}

${report.length} tank(s) checked${lowCount > 0 ? `, ${lowCount} low` : ', all OK'}

${tankLines}`;

    await sendSms({ recipients, message });
    console.log(`Fuel status report SMS sent to: ${recipients.join(', ')}`);
  } catch (error: any) {
    console.error('Failed to send fuel status report SMS:', error.message);
  }
};

export const sendFuelDeliverySms = async (deliveries: {
  tankNumber: number;
  productLabel: string;
  gallonsDelivered: number;
  startVolume: number;
  endVolume: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}[]): Promise<void> => {
  try {
    console.log('📱 Sending fuel delivery SMS...');

    // Send only to FUEL_ALERT_PHONE
    const fuelAlertPhone = process.env.FUEL_ALERT_PHONE;
    if (!fuelAlertPhone) {
      console.warn('⚠️ FUEL_ALERT_PHONE not set in .env — SMS skipped');
      return;
    }

    const recipients = fuelAlertPhone.split(',').map(p => p.trim()).filter(Boolean);

    const totalGallons = deliveries.reduce((sum, d) => sum + d.gallonsDelivered, 0);

    // Format delivery details with before → after volumes
    const deliveryDetails = deliveries.map(d => 
      `${d.productLabel} Tank ${d.tankNumber}:\n  ${d.startVolume.toLocaleString()} gal → ${d.endVolume.toLocaleString()} gal (+${d.gallonsDelivered.toLocaleString()} gal)\n  ${d.startDate} ${d.startTime}`
    ).join('\n\n');

    const message = `⛽ FUEL DELIVERY DETECTED

${deliveries.length} delivery event(s) — ${totalGallons.toLocaleString()} total gallons

${deliveryDetails}

Sandy's Market — ATG Auto-Detection`;

    await sendSms({ recipients, message });
    console.log(`✅ Fuel delivery SMS sent to: ${recipients.join(', ')}`);
  } catch (error: any) {
    console.error('❌ Failed to send fuel delivery SMS:', error.message);
  }
};

/**
 * Send Gas Buddy price comparison SMS to FUEL_ALERT_PHONE only
 */
export const sendGasBuddyPriceSms = async (comparison: PriceComparison, timeOfDay: 'Morning' | 'Afternoon' = 'Morning'): Promise<void> => {
  try {
    console.log('📱 Sending Gas Buddy price comparison SMS...');

    // Send only to FUEL_ALERT_PHONE
    const fuelAlertPhone = process.env.FUEL_ALERT_PHONE;
    if (!fuelAlertPhone) {
      console.warn('⚠️ FUEL_ALERT_PHONE not set in .env — SMS skipped');
      return;
    }

    const recipients = fuelAlertPhone.split(',').map(p => p.trim()).filter(Boolean);

    // Format price with compact time
    const fp = (price: number | null, updated: string | null) => {
      if (!price) return '  N/A  ';
      const time = updated ? updated.replace(' Hours', 'h').replace(' Hour', 'h')
        .replace(' Days', 'd').replace(' Day', 'd')
        .replace(' Minutes', 'm').replace(' Minute', 'm')
        .replace(' Ago', '') : '';
      return `$${price.toFixed(2)}${time ? ' ' + time : ''}`;
    };
    
    // Format difference
    const diff = (s: number | null, b: number | null) => {
      if (!s || !b) return '  -  ';
      const d = s - b;
      if (Math.abs(d) < 0.01) return 'Same';
      if (d > 0) return `+$${d.toFixed(2)}`;
      return `-$${Math.abs(d).toFixed(2)}`;
    };

    const message = `⛽ GAS BUDDY ${timeOfDay.toUpperCase()} PRICE UPDATE

FUEL     SANDY'S      BIG R        DIFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Regular  ${fp(comparison.sandy.regular, comparison.sandy.regularUpdated).padEnd(12)} ${fp(comparison.bigR.regular, comparison.bigR.regularUpdated).padEnd(12)} ${diff(comparison.sandy.regular, comparison.bigR.regular)}
Midgrade ${fp(comparison.sandy.midgrade, comparison.sandy.midgradeUpdated).padEnd(12)} ${fp(comparison.bigR.midgrade, comparison.bigR.midgradeUpdated).padEnd(12)} ${diff(comparison.sandy.midgrade, comparison.bigR.midgrade)}
Premium  ${fp(comparison.sandy.premium, comparison.sandy.premiumUpdated).padEnd(12)} ${fp(comparison.bigR.premium, comparison.bigR.premiumUpdated).padEnd(12)} ${diff(comparison.sandy.premium, comparison.bigR.premium)}
Diesel   ${fp(comparison.sandy.diesel, comparison.sandy.dieselUpdated).padEnd(12)} ${fp(comparison.bigR.diesel, comparison.bigR.dieselUpdated).padEnd(12)} ${diff(comparison.sandy.diesel, comparison.bigR.diesel)}

📅 ${new Date().toLocaleString('en-US', { timeZone: 'America/Detroit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}`;

    await sendSms({ recipients, message });
    console.log(`✅ Gas Buddy price SMS sent to: ${recipients.join(', ')}`);
  } catch (error: any) {
    console.error('❌ Failed to send Gas Buddy price SMS:', error.message);
  }
};
