// syncStripeData.js
// Synchronizes Stripe products, prices, coupons, and promotion codes
// with a local database using Prisma.
// Requirements: Set STRIPE_SECRET_KEY and DATABASE_URL in environment variables.

'use strict';

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

// Validate required environment variables
function validateEnvironment() {
  const requiredEnvVars = ['STRIPE_SECRET_KEY', 'DATABASE_URL'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`  • ${env}`));
    process.exit(1);
  }
}

validateEnvironment();

// Initialize Stripe and Prisma
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});
const prisma = new PrismaClient();

// Utility for logging separators
const LOG_SEPARATOR = '='.repeat(50);

/**
 * Upsert Stripe products into the database, handling pagination.
 */
async function syncStripeProducts() {
  console.log('📦 Syncing Stripe products...');

  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const { data, has_more: has_more } = await stripe.products.list({
      limit: 100,
      active: true,
      starting_after: startingAfter,
    });

    for (const product of data) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          active: product.active,
          name: product.name,
          description: product.description,
          image: product.images?.[0] || null,
          metadata: product.metadata || {},
        },
        create: {
          id: product.id,
          active: product.active,
          name: product.name,
          description: product.description,
          image: product.images?.[0] || null,
          metadata: product.metadata || {},
        },
      });
      console.log(`  ✅ Product synced: ${product.name || product.id} (${product.id})`);
    }

    hasMore = has_more;
    startingAfter = data.length > 0 ? data[data.length - 1].id : undefined;
  }
}

/**
 * Upsert Stripe prices into the database, handling pagination.
 */
async function syncStripePrices() {
  console.log('💰 Syncing Stripe prices...');

  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const { data, has_more: has_more } = await stripe.prices.list({
      limit: 100,
      active: true,
      starting_after: startingAfter,
    });

    for (const price of data) {
      await prisma.price.upsert({
        where: { id: price.id },
        update: {
          active: price.active,
          currency: price.currency,
          unitAmount: price.unit_amount != null ? BigInt(price.unit_amount) : null,
          type: price.type === 'recurring' ? 'recurring' : 'one_time',
          interval: price.recurring?.interval || null,
          intervalCount: price.recurring?.interval_count || null,
          trialPeriodDays: price.recurring?.trial_period_days || null,
          metadata: price.metadata || {},
        },
        create: {
          id: price.id,
          productId: typeof price.product === 'string' ? price.product : price.product.id,
          active: price.active,
          currency: price.currency,
          unitAmount: price.unit_amount != null ? BigInt(price.unit_amount) : null,
          type: price.type === 'recurring' ? 'recurring' : 'one_time',
          interval: price.recurring?.interval || null,
          intervalCount: price.recurring?.interval_count || null,
          trialPeriodDays: price.recurring?.trial_period_days || null,
          metadata: price.metadata || {},
        },
      });

      const amount = price.unit_amount != null ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
      const interval = price.recurring?.interval ? `/${price.recurring.interval}` : '';
      console.log(`  ✅ Price synced: ${amount}${interval} (${price.id})`);
    }

    hasMore = has_more;
    startingAfter = data.length > 0 ? data[data.length - 1].id : undefined;
  }
}

/**
 * Upsert Stripe coupons into the database, handling pagination.
 */
async function syncStripeCoupons() {
  console.log('🎫 Syncing Stripe coupons...');

  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const { data, has_more: has_more } = await stripe.coupons.list({
      limit: 100,
      starting_after: startingAfter,
    });

    for (const coupon of data) {
      await prisma.coupon.upsert({
        where: { id: coupon.id },
        update: {
          name: coupon.name || null,
          amountOff: coupon.amount_off != null ? BigInt(coupon.amount_off) : null,
          currency: coupon.currency || null,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months || null,
          maxRedemptions: coupon.max_redemptions || null,
          percentOff: coupon.percent_off || null,
          redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : null,
          timesRedeemed: coupon.times_redeemed || 0,
          valid: coupon.valid,
          metadata: coupon.metadata || {},
        },
        create: {
          id: coupon.id,
          name: coupon.name || null,
          amountOff: coupon.amount_off != null ? BigInt(coupon.amount_off) : null,
          currency: coupon.currency || null,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months || null,
          maxRedemptions: coupon.max_redemptions || null,
          percentOff: coupon.percent_off || null,
          redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : null,
          timesRedeemed: coupon.times_redeemed || 0,
          valid: coupon.valid,
          metadata: coupon.metadata || {},
        },
      });

      const discount = coupon.percent_off != null
        ? `${coupon.percent_off}% off`
        : `$${((coupon.amount_off ?? 0) / 100).toFixed(2)} off`;
      console.log(`  ✅ Coupon synced: ${coupon.name || coupon.id} (${discount})`);
    }

    hasMore = has_more;
    startingAfter = data.length > 0 ? data[data.length - 1].id : undefined;
  }
}

/**
 * Upsert Stripe promotion codes into the database, handling pagination.
 */
async function syncStripePromotionCodes() {
  console.log('🏷️  Syncing Stripe promotion codes...');

  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const { data, has_more: has_more } = await stripe.promotionCodes.list({
      limit: 100,
      starting_after: startingAfter,
    });

    for (const promoCode of data) {
      const couponId = typeof promoCode.coupon === 'string'
        ? promoCode.coupon
        : promoCode.coupon?.id;

      await prisma.promotionCode.upsert({
        where: { id: promoCode.id },
        update: {
          couponId,
          code: promoCode.code,
          active: promoCode.active,
          maxRedemptions: promoCode.max_redemptions || null,
          timesRedeemed: promoCode.times_redeemed || 0,
          expiresAt: promoCode.expires_at ? new Date(promoCode.expires_at * 1000) : null,
          metadata: promoCode.metadata || {},
        },
        create: {
          id: promoCode.id,
          couponId,
          code: promoCode.code,
          active: promoCode.active,
          maxRedemptions: promoCode.max_redemptions || null,
          timesRedeemed: promoCode.times_redeemed || 0,
          expiresAt: promoCode.expires_at ? new Date(promoCode.expires_at * 1000) : null,
          metadata: promoCode.metadata || {},
        },
      });
      console.log(`  ✅ Promotion code synced: ${promoCode.code} (${promoCode.id})`);
    }

    hasMore = has_more;
    startingAfter = data.length > 0 ? data[data.length - 1].id : undefined;
  }
}

/**
 * Main entry point: verifies Stripe connection and synchronizes all data.
 */
async function main() {
  console.log('🔄 Starting Stripe data synchronization...');
  console.log(LOG_SEPARATOR);

  try {
    console.log('🔑 Verifying Stripe connection...');
    const account = await stripe.account.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.settings.dashboard.display_name || account.id}`);

    await syncStripeProducts();
    await syncStripePrices();
    await syncStripeCoupons();
    await syncStripePromotionCodes();

    console.log(LOG_SEPARATOR);
    console.log('🎉 Stripe data synchronization completed successfully!');

    // Summary
    const [productCount, priceCount, couponCount, promoCodeCount] = await Promise.all([
      prisma.product.count(),
      prisma.price.count(),
      prisma.coupon.count(),
      prisma.promotionCode.count(),
    ]);

    console.log('\n📊 Database Summary:');
    console.log(`  • Products: ${productCount}`);
    console.log(`  • Prices: ${priceCount}`);
    console.log(`  • Coupons: ${couponCount}`);
    console.log(`  • Promotion Codes: ${promoCodeCount}`);
  } catch (error) {
    console.error('❌ Error during synchronization:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute only when run directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
