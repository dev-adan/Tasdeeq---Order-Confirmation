import { useLoaderData, Form, useNavigation, useActionData, redirect } from "react-router";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";
import { getAllPlans } from "../config/plans";
import db from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get current shop subscription
    const shop = await db.shop.findUnique({
      where: { shopDomain: session.shop }
    });
    
    return {
      plans: getAllPlans(),
      currentPlan: shop?.planType || 'free',
      shop: shop || null
    };
  } catch (error) {
    console.error("Plans loader error:", error);
    throw error;
  }
};

export const action = async ({ request }) => {
  console.log("Action triggered!");
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const selectedPlan = formData.get("plan");
  
  console.log("Selected plan:", selectedPlan);
  
  // If free plan, just update database
  if (selectedPlan === 'free') {
    await db.shop.upsert({
      where: { shopDomain: session.shop },
      update: {
        planType: 'free',
        subscriptionStatus: 'active',
        monthlyConfirmationLimit: 150,
        confirmationsRemaining: 150
      },
      create: {
        shopDomain: session.shop,
        planType: 'free',
        subscriptionStatus: 'active',
        monthlyConfirmationLimit: 150,
        confirmationsRemaining: 150
      }
    });
    
    return redirect('/app');
  }
  
  // For paid plans, create Shopify billing charge
  const planConfig = {
    basic: { price: 9.99, limit: 500 },
    premium: { price: 29.99, limit: 2000 },
    ultra: { price: 79.99, limit: 10000 }
  }[selectedPlan];
  
  console.log("Creating subscription for plan:", planConfig);
  
  const response = await admin.graphql(`
    mutation CreateSubscription($name: String!, $price: Decimal!, $returnUrl: URL!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        test: true
        lineItems: [{
          plan: {
            appRecurringPricingDetails: {
              price: { amount: $price, currencyCode: USD }
              interval: EVERY_30_DAYS
            }
          }
        }]
      ) {
        appSubscription {
          id
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      name: `Tasdeeq ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
      price: planConfig.price,
      returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing/callback?plan=${selectedPlan}&limit=${planConfig.limit}`
    }
  });
  
  const data = await response.json();
  
  console.log("GraphQL response:", data);
  
  if (data.data.appSubscriptionCreate.userErrors.length > 0) {
    console.error("User errors:", data.data.appSubscriptionCreate.userErrors);
    return { error: data.data.appSubscriptionCreate.userErrors[0].message };
  }
  
  const confirmationUrl = data.data.appSubscriptionCreate.confirmationUrl;
  console.log("Confirmation URL:", confirmationUrl);
  
  // Return the confirmation URL to be handled on the client side
  return { confirmationUrl };
};

export default function Plans() {
  const { plans, currentPlan, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  // Handle billing redirect (will be enabled when app goes public)
  useEffect(() => {
    if (actionData?.confirmationUrl) {
      window.open(actionData.confirmationUrl, '_top');
    }
  }, [actionData]);
  
  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Choose Your Plan</h1>
        <p style={{ fontSize: "16px", color: "#666" }}>
          Start with our free plan or upgrade for more confirmations
        </p>
      </div>
      
      {actionData?.error && (
        <div style={{
          padding: "16px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          marginBottom: "20px",
          color: "#991b1b"
        }}>
          {actionData.error}
        </div>
      )}
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: "20px",
        marginBottom: "40px"
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: plan.popular ? "2px solid #008060" : "1px solid #ddd",
              borderRadius: "8px",
              padding: "30px 20px",
              position: "relative",
              backgroundColor: currentPlan === plan.id ? "#f6f6f7" : "white",
              boxShadow: plan.popular ? "0 4px 12px rgba(0,128,96,0.1)" : "none"
            }}
          >
            {plan.popular && (
              <div style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#008060",
                color: "white",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                MOST POPULAR
              </div>
            )}
            
            {currentPlan === plan.id && (
              <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "#008060",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "600"
              }}>
                CURRENT PLAN
              </div>
            )}
            
            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>{plan.name}</h2>
            
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "36px", fontWeight: "bold" }}>
                ${plan.price}
              </span>
              {plan.price > 0 && (
                <span style={{ fontSize: "14px", color: "#666" }}>/month</span>
              )}
            </div>
            
            <ul style={{ 
              listStyle: "none", 
              padding: 0, 
              marginBottom: "30px",
              minHeight: "200px"
            }}>
              {plan.features.map((feature, index) => (
                <li key={index} style={{ 
                  padding: "8px 0", 
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "flex-start"
                }}>
                  <span style={{ color: "#008060", marginRight: "8px" }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            
            <Form method="post">
              <input type="hidden" name="plan" value={plan.id} />
              <button
                type="submit"
                disabled={isSubmitting || currentPlan === plan.id}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: currentPlan === plan.id ? "#ccc" : (plan.popular ? "#008060" : "#5c6ac4"),
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: currentPlan === plan.id ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {currentPlan === plan.id 
                  ? "Current Plan" 
                  : plan.price === 0 
                    ? "Start Free" 
                    : `Subscribe - $${plan.price}/mo`
                }
              </button>
            </Form>
          </div>
        ))}
      </div>
      
      {shop && (
        <div style={{ 
          textAlign: "center", 
          padding: "20px", 
          backgroundColor: "#f6f6f7", 
          borderRadius: "8px" 
        }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            Current Usage: {shop.confirmationsUsedThisMonth} / {shop.monthlyConfirmationLimit} confirmations this month
          </p>
          <div style={{ 
            width: "100%", 
            maxWidth: "400px", 
            height: "8px", 
            backgroundColor: "#ddd", 
            borderRadius: "4px",
            margin: "0 auto",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(shop.confirmationsUsedThisMonth / shop.monthlyConfirmationLimit) * 100}%`,
              height: "100%",
              backgroundColor: "#008060",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
