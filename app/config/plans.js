// Subscription Plans Configuration

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    interval: 'FREE',
    dailyLimit: 5,           // 5 orders per day
    monthlyLimit: 150,       // ~5 orders × 30 days
    features: [
      '5 order confirmations per day',
      'WhatsApp notifications',
      'Basic support',
      'Perfect for testing'
    ],
    popular: false
  },
  
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'EVERY_30_DAYS',
    dailyLimit: null,        // No daily limit
    monthlyLimit: 500,       // 500 orders per month
    features: [
      '500 order confirmations/month',
      'WhatsApp notifications',
      'Courier integration',
      'Email support',
      'Order analytics'
    ],
    popular: false
  },
  
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    price: 29.99,
    interval: 'EVERY_30_DAYS',
    dailyLimit: null,
    monthlyLimit: 2000,      // 2000 orders per month
    features: [
      '2000 order confirmations/month',
      'WhatsApp notifications',
      'Courier integration',
      'Priority email support',
      'Order analytics',
      'Custom message templates'
    ],
    popular: true            // Most popular badge
  },
  
  ultra: {
    id: 'ultra',
    name: 'Ultra Plan',
    price: 79.99,
    interval: 'EVERY_30_DAYS',
    dailyLimit: null,
    monthlyLimit: 10000,     // 10,000 orders per month
    features: [
      '10,000 order confirmations/month',
      'WhatsApp notifications',
      'Courier integration',
      'Priority support (24/7)',
      'Order analytics',
      'Custom message templates',
      'Dedicated account manager',
      'API access'
    ],
    popular: false
  }
};

// Helper function to get plan by ID
export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

// Helper function to check if user can process order
export function canProcessOrder(shop) {
  const plan = getPlan(shop.planType);
  
  // Check monthly limit
  if (shop.confirmationsUsedThisMonth >= shop.monthlyConfirmationLimit) {
    return {
      allowed: false,
      reason: 'monthly_limit_reached',
      message: `You've reached your monthly limit of ${shop.monthlyConfirmationLimit} confirmations. Please upgrade your plan.`
    };
  }
  
  // Check daily limit (only for free plan)
  if (plan.dailyLimit && shop.confirmationsUsedToday >= plan.dailyLimit) {
    return {
      allowed: false,
      reason: 'daily_limit_reached',
      message: `You've reached your daily limit of ${plan.dailyLimit} confirmations. Upgrade to remove daily limits.`
    };
  }
  
  return {
    allowed: true,
    remaining: shop.monthlyConfirmationLimit - shop.confirmationsUsedThisMonth
  };
}

// Get all plans as array for display
export function getAllPlans() {
  return Object.values(PLANS);
}
