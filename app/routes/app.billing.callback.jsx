import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getPlan } from "../config/plans";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const planType = url.searchParams.get("plan");
  const chargeId = url.searchParams.get("charge_id");
  
  if (!planType) {
    return redirect("/app/plans");
  }
  
  // Get plan configuration
  const plan = getPlan(planType);
  
  // If charge_id exists, verify the charge was approved
  if (chargeId) {
    const response = await admin.graphql(`
      query GetSubscription($id: ID!) {
        node(id: $id) {
          ... on AppSubscription {
            id
            name
            status
            currentPeriodEnd
          }
        }
      }
    `, {
      variables: {
        id: chargeId
      }
    });
    
    const data = await response.json();
    const subscription = data.data.node;
    
    // Check if subscription is active
    if (subscription && subscription.status === "ACTIVE") {
      // Update shop with subscription details
      await db.shop.upsert({
        where: { shopDomain: session.shop },
        update: {
          planType: planType,
          subscriptionStatus: "active",
          shopifyChargeId: chargeId,
          subscriptionStartedAt: new Date(),
          billingCycleStart: new Date(),
          billingCycleEnd: new Date(subscription.currentPeriodEnd),
          monthlyConfirmationLimit: plan.monthlyLimit,
          confirmationsRemaining: plan.monthlyLimit,
          confirmationsUsedThisMonth: 0,
          confirmationsUsedToday: 0
        },
        create: {
          shopDomain: session.shop,
          planType: planType,
          subscriptionStatus: "active",
          shopifyChargeId: chargeId,
          subscriptionStartedAt: new Date(),
          billingCycleStart: new Date(),
          billingCycleEnd: new Date(subscription.currentPeriodEnd),
          monthlyConfirmationLimit: plan.monthlyLimit,
          confirmationsRemaining: plan.monthlyLimit,
          confirmationsUsedThisMonth: 0,
          confirmationsUsedToday: 0
        }
      });
      
      // Redirect to settings page
      return redirect("/app/settings?success=subscription");
    } else {
      // Subscription not active, redirect back to plans
      return redirect("/app/plans?error=subscription_failed");
    }
  }
  
  // No charge_id means user cancelled or something went wrong
  return redirect("/app/plans?error=cancelled");
};

export default function BillingCallback() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh" 
    }}>
      <div style={{ textAlign: "center" }}>
        <h2>Processing your subscription...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    </div>
  );
}
