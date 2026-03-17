// WhatsApp Business API integration
// This will use your WhatsApp Business API credentials

/**
 * Send order confirmation request via WhatsApp
 */
export async function sendOrderConfirmation({ phone, orderNumber, customerName, orderTotal, items }) {
  // TODO: Replace with your actual WhatsApp API endpoint and credentials
  const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
  const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
  
  // Format phone number (remove + and spaces)
  const formattedPhone = phone.replace(/[^0-9]/g, '');
  
  // Create confirmation message
  const message = `
Hello ${customerName}! 👋

Your order #${orderNumber} has been received.

Order Details:
${items.map(item => `• ${item.quantity}x ${item.name} - $${item.price}`).join('\n')}

Total: $${orderTotal}

Please reply with:
✅ CONFIRM - to confirm your order
❌ CANCEL - to cancel your order

Thank you for shopping with us!
  `.trim();
  
  try {
    // For now, just log (you'll replace this with actual WhatsApp API call)
    console.log('Sending WhatsApp message to:', formattedPhone);
    console.log('Message:', message);
    
    // Example API call (uncomment when you have WhatsApp API credentials)
    /*
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      })
    });
    
    const data = await response.json();
    return {
      success: true,
      messageId: data.messages[0].id
    };
    */
    
    // Mock response for development
    return {
      success: true,
      messageId: `mock_${Date.now()}`
    };
    
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send tracking number via WhatsApp
 */
export async function sendTrackingNumber({ phone, orderNumber, trackingNumber, courierName }) {
  const formattedPhone = phone.replace(/[^0-9]/g, '');
  
  const message = `
🚚 Your order #${orderNumber} has been shipped!

Courier: ${courierName}
Tracking Number: ${trackingNumber}

You can track your order using the tracking number above.

Thank you for your order!
  `.trim();
  
  try {
    console.log('Sending tracking info to:', formattedPhone);
    console.log('Message:', message);
    
    // Mock response for development
    return {
      success: true,
      messageId: `mock_tracking_${Date.now()}`
    };
    
  } catch (error) {
    console.error('WhatsApp tracking send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse customer response
 */
export function parseCustomerResponse(message) {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.includes('confirm') || normalized.includes('yes') || normalized === '1') {
    return 'confirmed';
  }
  
  if (normalized.includes('cancel') || normalized.includes('no') || normalized === '0') {
    return 'cancelled';
  }
  
  return null; // Unknown response
}
