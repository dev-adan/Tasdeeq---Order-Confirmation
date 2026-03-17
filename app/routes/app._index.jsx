import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getPlan } from "../config/plans";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // Check if shop exists in database
  let shop = await db.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  
  // If no shop record, create one with free plan
  if (!shop) {
    shop = await db.shop.create({
      data: {
        shopDomain: session.shop,
        planType: 'free',
        subscriptionStatus: 'active',
        monthlyConfirmationLimit: 150,
        confirmationsRemaining: 150
      }
    });
  }
  
  const plan = getPlan(shop.planType);
  
  // Get order statistics
  const totalOrders = await db.order.count({
    where: { shopId: shop.id }
  });
  
  const pendingOrders = await db.order.count({
    where: { 
      shopId: shop.id,
      status: "pending"
    }
  });
  
  const confirmedOrders = await db.order.count({
    where: { 
      shopId: shop.id,
      status: "confirmed"
    }
  });
  
  const shippedOrders = await db.order.count({
    where: { 
      shopId: shop.id,
      status: "shipped"
    }
  });
  
  // Get recent orders
  const recentOrders = await db.order.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  return {
    shop,
    plan,
    stats: {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      shipped: shippedOrders
    },
    recentOrders
  };
};

export default function Index() {
  const { shop, plan, stats, recentOrders } = useLoaderData();
  
  const usagePercentage = (shop.confirmationsUsedThisMonth / shop.monthlyConfirmationLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          Welcome to Tasdeeq 👋
        </h1>
        <p style={{ fontSize: "16px", color: "#666" }}>
          WhatsApp Order Confirmation & Courier Integration
        </p>
      </div>
      
      {/* Warning if near limit */}
      {isNearLimit && (
        <div style={{
          padding: "16px",
          backgroundColor: "#fff4e6",
          border: "1px solid #ffa500",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <p style={{ margin: 0, color: "#cc7a00" }}>
            ⚠️ You've used {usagePercentage.toFixed(0)}% of your monthly confirmations. 
            <a href="/app/plans" style={{ color: "#5c6ac4", marginLeft: "8px" }}>
              Upgrade your plan →
            </a>
          </p>
        </div>
      )}
      
      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        {/* Confirmations Used */}
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            Confirmations This Month
          </p>
          <p style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px" }}>
            {shop.confirmationsUsedThisMonth}
          </p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            of {shop.monthlyConfirmationLimit} ({shop.confirmationsRemaining} remaining)
          </p>
          <div style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#f0f0f0",
            borderRadius: "3px",
            marginTop: "12px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${usagePercentage}%`,
              height: "100%",
              backgroundColor: isNearLimit ? "#ffa500" : "#008060",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
        
        {/* Total Orders */}
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            Total Orders Processed
          </p>
          <p style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px" }}>
            {stats.total}
          </p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            All-time orders
          </p>
        </div>
        
        {/* Pending Confirmations */}
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            Pending Confirmations
          </p>
          <p style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px", color: "#ffa500" }}>
            {stats.pending}
          </p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            Awaiting customer response
          </p>
        </div>
        
        {/* Confirmed Orders */}
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            Confirmed Orders
          </p>
          <p style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px", color: "#008060" }}>
            {stats.confirmed}
          </p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            Ready for shipment
          </p>
        </div>
      </div>
      
      {/* Current Plan Card */}
      <div style={{
        backgroundColor: "#f6f6f7",
        padding: "24px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        marginBottom: "30px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>Current Plan: {plan.name}</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {plan.price === 0 ? "Free forever" : `$${plan.price}/month`}
            </p>
          </div>
          <a
            href="/app/plans"
            style={{
              padding: "10px 20px",
              backgroundColor: "#5c6ac4",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            {plan.price === 0 ? "Upgrade Plan" : "Change Plan"}
          </a>
        </div>
        <ul style={{ 
          listStyle: "none", 
          padding: 0, 
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "8px"
        }}>
          {plan.features.map((feature, index) => (
            <li key={index} style={{ fontSize: "14px", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#008060", marginRight: "8px" }}>✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Quick Actions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px"
      }}>
        <a
          href="/app/settings"
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "inherit",
            transition: "box-shadow 0.2s",
            display: "block"
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>⚙️ Settings</h3>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            Configure order filters, courier integration, and app preferences
          </p>
        </a>
        
        <a
          href="/app/plans"
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "inherit",
            transition: "box-shadow 0.2s",
            display: "block"
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>💳 Billing & Plans</h3>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            View your subscription, upgrade your plan, or manage billing
          </p>
        </a>
      </div>
      
      {/* How It Works */}
      <div style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        marginTop: "30px"
      }}>
        <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>How It Works</h2>
        <ol style={{ paddingLeft: "20px", margin: 0 }}>
          <li style={{ marginBottom: "12px", fontSize: "14px" }}>
            Customer places an order on your Shopify store
          </li>
          <li style={{ marginBottom: "12px", fontSize: "14px" }}>
            WhatsApp message is automatically sent to customer for confirmation
          </li>
          <li style={{ marginBottom: "12px", fontSize: "14px" }}>
            Customer replies with CONFIRM or CANCEL
          </li>
          <li style={{ marginBottom: "12px", fontSize: "14px" }}>
            Order status is updated in Shopify based on response
          </li>
          <li style={{ marginBottom: "12px", fontSize: "14px" }}>
            Shipment is created with your courier (if configured)
          </li>
          <li style={{ marginBottom: "0", fontSize: "14px" }}>
            Tracking number is sent to customer via WhatsApp
          </li>
        </ol>
      </div>
    </div>
  );
}
