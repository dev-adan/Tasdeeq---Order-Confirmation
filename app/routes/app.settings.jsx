import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getPlan } from "../config/plans";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  
  // If no shop record, redirect to plans
  if (!shop) {
    return { redirect: '/app/plans' };
  }
  
  const plan = getPlan(shop.planType);
  
  return { 
    shop,
    plan,
    success: new URL(request.url).searchParams.get('success')
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const settings = {
    orderTypeFilter: formData.get("orderTypeFilter"),
    courierProvider: formData.get("courierProvider") || null,
    courierApiKey: formData.get("courierApiKey") || null,
    isActive: formData.get("isActive") === "true",
    merchantEmail: formData.get("merchantEmail") || null,
    merchantPhone: formData.get("merchantPhone") || null
  };
  
  await db.shop.update({
    where: { shopDomain: session.shop },
    data: settings
  });
  
  return { success: true, message: "Settings saved successfully!" };
};

export default function Settings() {
  const data = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  // Handle redirect
  if (data?.redirect) {
    window.location.href = data.redirect;
    return null;
  }
  
  const { shop, plan } = data;
  
  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Success Message */}
      {(actionData?.success || data.success) && (
        <div style={{
          padding: "12px 16px",
          backgroundColor: "#d4edda",
          color: "#155724",
          borderRadius: "4px",
          marginBottom: "20px",
          border: "1px solid #c3e6cb"
        }}>
          ✓ {actionData?.message || "Subscription activated successfully!"}
        </div>
      )}
      
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>Settings</h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Configure your WhatsApp order confirmation preferences
        </p>
      </div>
      
      {/* Subscription Info Card */}
      <div style={{
        backgroundColor: "#f6f6f7",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "30px",
        border: "1px solid #ddd"
      }}>
        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Subscription Status</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Current Plan</p>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>{plan.name}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Monthly Limit</p>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>{shop.monthlyConfirmationLimit} confirmations</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Used This Month</p>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>{shop.confirmationsUsedThisMonth} / {shop.monthlyConfirmationLimit}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Remaining</p>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "#008060" }}>{shop.confirmationsRemaining}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{ marginTop: "15px" }}>
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#ddd",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(shop.confirmationsUsedThisMonth / shop.monthlyConfirmationLimit) * 100}%`,
              height: "100%",
              backgroundColor: shop.confirmationsUsedThisMonth >= shop.monthlyConfirmationLimit ? "#d72c0d" : "#008060",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
        
        <div style={{ marginTop: "15px" }}>
          <a href="/app/plans" style={{ color: "#5c6ac4", textDecoration: "none", fontSize: "14px" }}>
            → Change Plan
          </a>
        </div>
      </div>
      
      {/* Settings Form */}
      <Form method="post">
        {/* App Status */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ddd"
        }}>
          <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>App Status</h2>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={shop.isActive}
              style={{ marginRight: "10px", width: "18px", height: "18px" }}
            />
            <span style={{ fontSize: "14px" }}>Enable WhatsApp Order Confirmations</span>
          </label>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", marginLeft: "28px" }}>
            When enabled, customers will receive WhatsApp messages for order confirmation
          </p>
        </div>
        
        {/* Order Filter Settings */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ddd"
        }}>
          <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Order Filters</h2>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
              Send confirmations for:
            </label>
            <select
              name="orderTypeFilter"
              defaultValue={shop.orderTypeFilter}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="all">All Orders</option>
              <option value="cod">Cash on Delivery (COD) Only</option>
              <option value="prepaid">Prepaid Orders Only</option>
            </select>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
              Choose which types of orders should trigger WhatsApp confirmations
            </p>
          </div>
        </div>
        
        {/* Courier Settings */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ddd"
        }}>
          <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Courier Integration (Optional)</h2>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
              Courier Provider
            </label>
            <select
              name="courierProvider"
              defaultValue={shop.courierProvider || ""}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">None (Manual shipping)</option>
              <option value="dhl">DHL</option>
              <option value="fedex">FedEx</option>
              <option value="ups">UPS</option>
              <option value="usps">USPS</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
              Courier API Key
            </label>
            <input
              type="password"
              name="courierApiKey"
              defaultValue={shop.courierApiKey || ""}
              placeholder="Enter your courier API key"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
              Your API key is encrypted and stored securely
            </p>
          </div>
        </div>
        
        {/* Contact Information */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ddd"
        }}>
          <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Contact Information</h2>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
              Email
            </label>
            <input
              type="email"
              name="merchantEmail"
              defaultValue={shop.merchantEmail || ""}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="merchantPhone"
              defaultValue={shop.merchantPhone || ""}
              placeholder="+1234567890"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
              For support and notifications
            </p>
          </div>
        </div>
        
        {/* Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#008060",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.6 : 1
          }}
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </button>
      </Form>
    </div>
  );
}
