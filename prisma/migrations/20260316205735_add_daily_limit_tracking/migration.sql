-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopDomain" TEXT NOT NULL,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
    "planType" TEXT NOT NULL DEFAULT 'free',
    "shopifyChargeId" TEXT,
    "trialEndsAt" DATETIME,
    "subscriptionStartedAt" DATETIME,
    "subscriptionEndsAt" DATETIME,
    "billingCycleStart" DATETIME,
    "billingCycleEnd" DATETIME,
    "monthlyConfirmationLimit" INTEGER NOT NULL DEFAULT 150,
    "confirmationsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "confirmationsUsedToday" INTEGER NOT NULL DEFAULT 0,
    "confirmationsRemaining" INTEGER NOT NULL DEFAULT 150,
    "lastDailyReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalConfirmationsSent" INTEGER NOT NULL DEFAULT 0,
    "totalOrdersProcessed" INTEGER NOT NULL DEFAULT 0,
    "courierProvider" TEXT,
    "courierApiKey" TEXT,
    "orderTypeFilter" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "merchantEmail" TEXT,
    "merchantPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastBillingReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Shop" ("billingCycleEnd", "billingCycleStart", "confirmationsRemaining", "confirmationsUsedThisMonth", "courierApiKey", "courierProvider", "createdAt", "id", "isActive", "lastBillingReset", "merchantEmail", "merchantPhone", "monthlyConfirmationLimit", "orderTypeFilter", "planType", "shopDomain", "shopifyChargeId", "subscriptionEndsAt", "subscriptionStartedAt", "subscriptionStatus", "totalConfirmationsSent", "totalOrdersProcessed", "trialEndsAt", "updatedAt") SELECT "billingCycleEnd", "billingCycleStart", "confirmationsRemaining", "confirmationsUsedThisMonth", "courierApiKey", "courierProvider", "createdAt", "id", "isActive", "lastBillingReset", "merchantEmail", "merchantPhone", "monthlyConfirmationLimit", "orderTypeFilter", "planType", "shopDomain", "shopifyChargeId", "subscriptionEndsAt", "subscriptionStartedAt", "subscriptionStatus", "totalConfirmationsSent", "totalOrdersProcessed", "trialEndsAt", "updatedAt" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
