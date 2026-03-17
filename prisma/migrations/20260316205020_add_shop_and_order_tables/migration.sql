-- CreateTable
CREATE TABLE "Shop" (
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
    "monthlyConfirmationLimit" INTEGER NOT NULL DEFAULT 50,
    "confirmationsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "confirmationsRemaining" INTEGER NOT NULL DEFAULT 50,
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

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopId" INTEGER NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "shopifyOrderNumber" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "orderTotal" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "whatsappMessageSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappMessageId" TEXT,
    "whatsappSentAt" DATETIME,
    "customerResponse" TEXT,
    "customerRespondedAt" DATETIME,
    "trackingNumber" TEXT,
    "courierName" TEXT,
    "shipmentCreated" BOOLEAN NOT NULL DEFAULT false,
    "shipmentCreatedAt" DATETIME,
    "trackingSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Order_shopifyOrderId_key" ON "Order"("shopifyOrderId");
