import db from "../db.server";
import { parseCustomerResponse, sendTrackingNumber } from "../services/whatsapp.server";

export const action = async ({ request }) => {
  try {
    const payload = await request.json();
    
    console.log("WhatsApp webhook received:", JSON.stringify(payload, null, 2));

    // WhatsApp webhook verification (first time setup)
    if (request.method === "GET") {
      const url = new URL(request.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("WhatsApp webhook verified");
        return new Response(challenge, { status: 200 });
      }
      
      return new Response("Forbidden", { status: 403 });
    }

    // Process incoming message
    if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = payload.entry[0].changes[0].value.messages[0];
      const from = message.from; // Customer phone number
      const messageText = message.text?.body;
      const messageId = message.id;
      const contextMessageId = message.context?.id; // ID of message customer replied to

      console.log(`Message from ${from}: ${messageText}`);
      console.log(`Context message ID: ${contextMessageId}`);

      if (!messageText) {
        return new Response("No message text", { status: 200 });
      }

      // Parse customer response
      const response = parseCustomerResponse(messageText);
      
      if (!response) {
        console.log("Unknown response, ignoring");
        return new Response("Unknown response", { status: 200 });
      }

      // Find the order by WhatsApp message ID (most accurate)
      let order = null;
      
      if (contextMessageId) {
        // Customer replied to our message - find order by that message ID
        order = await db.order.findFirst({
          where: {
            whatsappMessageId: contextMessageId,
            status: 'pending'
          },
          include: {
            shop: true
          }
        });
      }
      
      // Fallback: Find by phone number (most recent pending order)
      if (!order) {
        order = await db.order.findFirst({
          where: {
            customerPhone: {
              contains: from.slice(-10) // Match last 10 digits
            },
            status: 'pending'
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            shop: true
          }
        });
      }

      if (!order) {
        console.log("No pending order found for this phone number");
        return new Response("No order found", { status: 200 });
      }

      console.log(`Found order #${order.shopifyOrderNumber} for customer`);

      // Update order status
      await db.order.update({
        where: { id: order.id },
        data: {
          status: response,
          customerResponse: response,
          customerRespondedAt: new Date()
        }
      });

      // Update Shopify order with tag and note
      try {
        // We need to get admin API access for this shop
        // For now, we'll just log it
        // TODO: Store shop access token and use it here
        
        console.log(`Order ${response}: #${order.shopifyOrderNumber}`);
        
        // You'll need to implement this with stored shop credentials
        /*
        const tag = response === 'confirmed' ? 'Tasdeeq-Confirmed' : 'Tasdeeq-Cancelled';
        const note = response === 'confirmed' 
          ? `Customer confirmed order via WhatsApp at ${new Date().toLocaleString()}`
          : `Customer cancelled order via WhatsApp at ${new Date().toLocaleString()}`;
        
        // Add tag
        await admin.graphql(`
          mutation addOrderTags($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) {
              node { id }
            }
          }
        `, {
          variables: {
            id: `gid://shopify/Order/${order.shopifyOrderId}`,
            tags: [tag]
          }
        });
        
        // Remove pending tag
        await admin.graphql(`
          mutation removeOrderTags($id: ID!, $tags: [String!]!) {
            tagsRemove(id: $id, tags: $tags) {
              node { id }
            }
          }
        `, {
          variables: {
            id: `gid://shopify/Order/${order.shopifyOrderId}`,
            tags: ['Tasdeeq-Pending']
          }
        });
        */
        
      } catch (error) {
        console.error("Error updating Shopify order:", error);
      }

      // If confirmed and courier is configured, create shipment
      if (response === 'confirmed' && order.shop.courierProvider) {
        console.log("Order confirmed, will create shipment with courier");
        // TODO: Implement courier integration
        // For now, just mark as ready for shipment
      }

      console.log(`Order ${response} successfully`);
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return new Response("Error", { status: 500 });
  }
};

// Handle GET requests for webhook verification
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified via GET");
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response("Forbidden", { status: 403 });
};
