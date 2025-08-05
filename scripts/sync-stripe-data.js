const Stripe = require('stripe')
const { PrismaClient } = require('@prisma/client')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

const prisma = new PrismaClient()

async function syncStripeProducts() {
  console.log('📦 Syncing Stripe products...')
  
  const products = await stripe.products.list({ limit: 100, active: true })
  
  for (const product of products.data) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        active: product.active,
        name: product.name,
        description: product.description,
        image: product.images?.[0],
        metadata: product.metadata || {},
      },
      create: {
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description,
        image: product.images?.[0],
        metadata: product.metadata || {},
      },
    })
    console.log(`  ✅ Product synced: ${product.name} (${product.id})`)
  }
}

async function syncStripePrices() {
  console.log('💰 Syncing Stripe prices...')
  
  const prices = await stripe.prices.list({ limit: 100, active: true })
  
  for (const price of prices.data) {
    await prisma.price.upsert({
      where: { id: price.id },
      update: {
        active: price.active,
        currency: price.currency,
        unitAmount: price.unit_amount ? BigInt(price.unit_amount) : null,
        type: price.type === 'recurring' ? 'recurring' : 'one_time',
        interval: price.recurring?.interval || null,
        intervalCount: price.recurring?.interval_count || null,
        trialPeriodDays: price.recurring?.trial_period_days || null,
        metadata: price.metadata || {},
      },
      create: {
        id: price.id,
        productId: price.product,
        active: price.active,
        currency: price.currency,
        unitAmount: price.unit_amount ? BigInt(price.unit_amount) : null,
        type: price.type === 'recurring' ? 'recurring' : 'one_time',
        interval: price.recurring?.interval || null,
        intervalCount: price.recurring?.interval_count || null,
        trialPeriodDays: price.recurring?.trial_period_days || null,
        metadata: price.metadata || {},
      },
    })
    
    const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free'
    const interval = price.recurring ? `/${price.recurring.interval}` : ''
    console.log(`  ✅ Price synced: ${amount}${interval} (${price.id})`)
  }
}

async function syncStripeCoupons() {
  console.log('🎫 Syncing Stripe coupons...')
  
  const coupons = await stripe.coupons.list({ limit: 100 })
  
  for (const coupon of coupons.data) {
    await prisma.coupon.upsert({
      where: { id: coupon.id },
      update: {
        name: coupon.name,
        amountOff: coupon.amount_off ? BigInt(coupon.amount_off) : null,
        currency: coupon.currency,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
        maxRedemptions: coupon.max_redemptions,
        percentOff: coupon.percent_off,
        redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : null,
        timesRedeemed: coupon.times_redeemed,
        valid: coupon.valid,
        metadata: coupon.metadata || {},
      },
      create: {
        id: coupon.id,
        name: coupon.name,
        amountOff: coupon.amount_off ? BigInt(coupon.amount_off) : null,
        currency: coupon.currency,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
        maxRedemptions: coupon.max_redemptions,
        percentOff: coupon.percent_off,
        redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : null,
        timesRedeemed: coupon.times_redeemed,
        valid: coupon.valid,
        metadata: coupon.metadata || {},
      },
    })
    
    const discount = coupon.percent_off ? `${coupon.percent_off}% off` : `$${(coupon.amount_off! / 100).toFixed(2)} off`
    )
    console.log(`  ✅ Coupon synced: ${coupon.name || coupon.id} (${discount})`)
  }
  }
}

async function syncStripePromotionCodes() {
  console.log('🏷️  Syncing Stripe promotion codes...')
  
  const promotionCodes = await stripe.promotionCodes.list({ limit: 100 })
  
  for (const promoCode of promotionCodes.data) {
    await prisma.promotionCode.upsert({
      where: { id: promoCode.id },
      update: {
        code: promoCode.code,
        active: promoCode.active,
        maxRedemptions: promoCode.max_redemptions,
        timesRedeemed: promoCode.times_redeemed,
        expiresAt: promoCode.expires_at ? new Date(promoCode.expires_at * 1000) : null,
        metadata: promoCode.metadata || {},
      },
      create: {
        id: promoCode.id,
        couponId: promoCode.coupon.id,
        code: promoCode.code,
        active: promoCode.active,
        maxRedemptions: promoCode.max_redemptions,
        timesRedeemed: promoCode.times_redeemed,
        expiresAt: promoCode.expires_at ? new Date(promoCode.expires_at * 1000) : null,
        metadata: promoCode.metadata || {},
      },
    })
    console.log(`  ✅ Promotion code synced: ${promoCode.code} (${promoCode.id})`)
  }
}

async function main() {
  console.log('🔄 Starting Stripe data synchronization...')
  console.log('=' * 50)

  try {
    // Verify Stripe connection
    console.log('🔑 Verifying Stripe connection...')
    const account = await stripe.accounts.retrieve()
    console.log(\`✅ Connected to Stripe account: ${account.display_name || account.id}`)

    // Sync all data
    await syncStripeProducts()
    await syncStripePrices()
    await syncStripeCoupons()
    await syncStripePromotionCodes()

    console.log('=' * 50)
    console.log('🎉 Stripe data synchronization completed successfully!')
    
    // Summary
    const productCount = await prisma.product.count()
    const priceCount = await prisma.price.count()
    const couponCount = await prisma.coupon.count()
    const promoCodeCount = await prisma.promotionCode.count()
    
    console.log('\n📊 Database Summary:')
    console.log(\`  • Products: ${productCount}`)
    console.log(\`  • Prices: ${priceCount}`)
    console.log(\`  • Coupons: ${couponCount}`)
    console.log(\`  • Promotion Codes: ${promoCodeCount}`)

  } catch (error) {
    console.error('❌ Error during synchronization:', error.message)
    console.error('\nDetails:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to validate environment
function validateEnvironment() {
  const requiredEnvVars = ['STRIPE_SECRET_KEY', 'DATABASE_URL']
  const missing = requiredEnvVars.filter(env => !process.env[env])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(env => console.error(\`  • ${env}`))
    console.error('\nPlease set these in your .env file and try again.')
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  validateEnvironment()
  main()
    .then(() => {
      console.log('\n✨ Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { main }
}