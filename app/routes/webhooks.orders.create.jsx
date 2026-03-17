import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendOrderConfirmation } from "../services/whatsapp.server";

export const action = async ({ request }) => {
  try {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    if (!payload) {
      console.error("No payload received");
      return new Response("No payload", { status: 400 });
    }

    // Get shop settings
    const shopRecord = await db.shop.findUnique({
      where: { shopDomain: shop }
    });

    if (!shopRecord) {
      console.log("Shop not found in database, creating...");
      // Create shop record if it doesn't exist
      await db.shop.create({
        data: {
          shopDomain: shop,
          planType: 'free',
          subscriptionStatus: 'active',
          monthlyConfirmationLimit: 150,
          confirmationsRemaining: 150
        }
      });
      return new Response("Shop created, order will be processed on next order", { status: 200 });
    }

    // Check if shop is active
    if (!shopRecord.isActive) {
      console.log("Shop is not active");
      return new Response("Shop not active", { status: 200 });
    }

    // Check if shop has confirmations remaining
    if (shopRecord.confirmationsRemaining <= 0) {
      console.log("No confirmations remaining");
      return new Response("No confirmations remaining", { status: 200 });
    }

    // Check order type filter
    const isCOD = payload.payment_gateway_names?.some(gateway => 
      gateway.toLowerCase().includes('cod') || 
      gateway.toLowerCase().includes('cash on delivery')
    );
    
    const shouldProcess = 
      shopRecord.orderTypeFilter === 'all' ||
      (shopRecord.orderTypeFilter === 'cod' && isCOD) ||
      (shopRecord.orderTypeFilter === 'prepaid' && !isCOD);

    if (!shouldProcess) {
      console.log(`Order type filter mismatch. Filter: ${shopRecord.orderTypeFilter}, isCOD: ${isCOD}`);
      return new Response("Order type filtered", { status: 200 });
    }

    // Extract customer phone
    let customerPhone = payload.customer?.phone || payload.shipping_address?.phone || payload.billing_address?.phone;
    
    if (!customerPhone) {
      console.log("No customer phone found");
      return new Response("No phone number", { status: 200 });
    }

    // Check if order already exists
    const existingOrder = await db.order.findUnique({
      where: { shopifyOrderId: payload.id.toString() }
    });

    if (existingOrder) {
      console.log("Order already processed");
      return new Response("Order already exists", { status: 200 });
    }

    // Create order record
    const order = await db.order.create({
      data: {
        shopId: shopRecord.id,
        shopifyOrderId: payload.id.toString(),
        shopifyOrderNumber: payload.order_number.toString(),
        customerPhone: customerPhone,
        customerName: payload.customer?.first_name + ' ' + payload.customer?.last_name || 'Customer',
        orderTotal: payload.total_price,
        paymentMethod: isCOD ? 'COD' : 'Prepaid',
        status: 'pending'
      }
    });

    console.log("Order created in database:", order.id);

    // Prepare line items for WhatsApp message
    const items = payload.line_items?.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })) || [];

    // Send WhatsApp confirmation
    const whatsappResult = await sendOrderConfirmation({
      phone: customerPhone,
      orderNumber: payload.order_number,
      customerName: payload.customer?.first_name || 'Customer',
      orderTotal: payload.total_price,
      items: items
    });

    if (whatsappResult.success) {
      // Update order with WhatsApp message ID
      await db.order.update({
        where: { id: order.id },
        data: {
          whatsappMessageSent: true,
          whatsappMessageId: whatsappResult.messageId,
          whatsappSentAt: new Date()
        }
      });

      // Decrement confirmations remaining
      await db.shop.update({
        where: { id: shopRecord.id },
        data: {
          confirmationsRemaining: shopRecord.confirmationsRemaining - 1,
          confirmationsUsedThisMonth: shopRecord.confirmationsUsedThisMonth + 1,
          confirmationsUsedToday: shopRecord.confirmationsUsedToday + 1,
          totalConfirmationsSent: shopRecord.totalConfirmationsSent + 1,
          totalOrdersProcessed: shopRecord.totalOrdersProcessed + 1
        }
      });

      // TODO: Add tag to Shopify order (requires storing shop access token)
      // For now, tags will be added when customer responds via WhatsApp webhook

      console.log("WhatsApp message sent successfully");
    } else {
      console.error("Failed to send WhatsApp message:", whatsappResult.error);
    }

    return new Response("Order processed", { status: 200 });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
