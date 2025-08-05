import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    logger.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log the webhook event
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        payload: event as any,
        receivedAt: new Date(),
      },
    })
  } catch (error) {
    logger.error('Failed to log webhook event:', error)
  }

  logger.info(`Stripe webhook received: ${event.type}`)

  try {
    switch (event.type) {
      // Customer events
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        
        await prisma.customer.upsert({
          where: { stripeCustomerId: customer.id },
          update: {
            // Customer data is managed through NextAuth/Prisma
          },
          create: {
            // This should not happen as customers are created in NextAuth callback
            stripeCustomerId: customer.id,
            id: customer.metadata?.userId || '',
          },
        })
        break
      }

      // Product events
      case 'product.created':
      case 'product.updated': {
        const product = event.data.object as Stripe.Product
        
        await prisma.product.upsert({
          where: { id: product.id },
          update: {
            active: product.active,
            name: product.name,
            description: product.description,
            image: product.images?.[0],
            metadata: product.metadata as any,
          },
          create: {
            id: product.id,
            active: product.active,
            name: product.name,
            description: product.description,
            image: product.images?.[0],
            metadata: product.metadata as any,
          },
        })
        break
      }

      case 'product.deleted': {
        const product = event.data.object as Stripe.Product
        await prisma.product.update({
          where: { id: product.id },
          data: { active: false }
        })
        break
      }

      // Price events
      case 'price.created':
      case 'price.updated': {
        const price = event.data.object as Stripe.Price
        
        await prisma.price.upsert({
          where: { id: price.id },
          update: {
            active: price.active,
            currency: price.currency,
            unitAmount: price.unit_amount ? BigInt(price.unit_amount) : null,
            type: price.type === 'recurring' ? 'recurring' : 'one_time',
            interval: price.recurring?.interval as any,
            intervalCount: price.recurring?.interval_count,
            trialPeriodDays: price.recurring?.trial_period_days,
            metadata: price.metadata as any,
          },
          create: {
            id: price.id,
            productId: price.product as string,
            active: price.active,
            currency: price.currency,
            unitAmount: price.unit_amount ? BigInt(price.unit_amount) : null,
            type: price.type === 'recurring' ? 'recurring' : 'one_time',
            interval: price.recurring?.interval as any,
            intervalCount: price.recurring?.interval_count,
            trialPeriodDays: price.recurring?.trial_period_days,
            metadata: price.metadata as any,
          },
        })
        break
      }

      case 'price.deleted': {
        const price = event.data.object as Stripe.Price
        await prisma.price.update({
          where: { id: price.id },
          data: { active: false }
        })
        break
      }

      // Coupon events
      case 'coupon.created':
      case 'coupon.updated': {
        const coupon = event.data.object as Stripe.Coupon
        
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
            metadata: coupon.metadata as any,
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
            metadata: coupon.metadata as any,
          },
        })
        break
      }

      case 'coupon.deleted': {
        const coupon = event.data.object as Stripe.Coupon
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { valid: false }
        })
        break
      }

      // Promotion Code events
      case 'promotion_code.created':
      case 'promotion_code.updated': {
        const promotionCode = event.data.object as Stripe.PromotionCode
        
        await prisma.promotionCode.upsert({
          where: { id: promotionCode.id },
          update: {
            code: promotionCode.code,
            active: promotionCode.active,
            maxRedemptions: promotionCode.max_redemptions,
            timesRedeemed: promotionCode.times_redeemed,
            expiresAt: promotionCode.expires_at ? new Date(promotionCode.expires_at * 1000) : null,
            metadata: promotionCode.metadata as any,
          },
          create: {
            id: promotionCode.id,
            couponId: promotionCode.coupon.id,
            code: promotionCode.code,
            active: promotionCode.active,
            maxRedemptions: promotionCode.max_redemptions,
            timesRedeemed: promotionCode.times_redeemed,
            expiresAt: promotionCode.expires_at ? new Date(promotionCode.expires_at * 1000) : null,
            metadata: promotionCode.metadata as any,
          },
        })
        break
      }

      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (!customer) {
          logger.error('Customer not found for subscription:', subscription.id)
          break
        }

        await prisma.subscription.upsert({
          where: { id: subscription.id },
          update: {
            status: subscription.status as any,
            priceId: subscription.items.data[0]?.price.id,
            quantity: subscription.items.data[0]?.quantity || 1,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
            cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            metadata: subscription.metadata as any,
          },
          create: {
            id: subscription.id,
            userId: customer.id,
            status: subscription.status as any,
            priceId: subscription.items.data[0]?.price.id,
            quantity: subscription.items.data[0]?.quantity || 1,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: new Date(subscription.created * 1000),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
            cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            metadata: subscription.metadata as any,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await prisma.subscription.delete({
          where: { id: subscription.id },
        })
        break
      }

      // Invoice events
      case 'invoice.created':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: invoice.customer as string },
        })

        if (!customer) {
          logger.error('Customer not found for invoice:', invoice.id)
          break
        }

        await prisma.invoice.upsert({
          where: { id: invoice.id },
          update: {
            status: invoice.status || '',
            amountDue: invoice.amount_due ? BigInt(invoice.amount_due) : null,
            amountPaid: invoice.amount_paid ? BigInt(invoice.amount_paid) : null,
            amountRemaining: invoice.amount_remaining ? BigInt(invoice.amount_remaining) : null,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          },
          create: {
            id: invoice.id,
            customerId: customer.id,
            stripeCustomerId: invoice.customer as string,
            subscriptionId: invoice.subscription as string | null,
            status: invoice.status || '',
            amountDue: invoice.amount_due ? BigInt(invoice.amount_due) : null,
            amountPaid: invoice.amount_paid ? BigInt(invoice.amount_paid) : null,
            amountRemaining: invoice.amount_remaining ? BigInt(invoice.amount_remaining) : null,
            currency: invoice.currency,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            metadata: invoice.metadata as any,
          },
        })
        break
      }

      // Payment Intent events
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: paymentIntent.customer as string },
        })

        if (!customer) {
          logger.error('Customer not found for payment intent:', paymentIntent.id)
          break
        }

        await prisma.stripePaymentIntent.upsert({
          where: { id: paymentIntent.id },
          update: {
            amount: paymentIntent.amount ? BigInt(paymentIntent.amount) : null,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            captureMethod: paymentIntent.capture_method,
            metadata: paymentIntent.metadata as any,
          },
          create: {
            id: paymentIntent.id,
            customerId: customer.id,
            amount: paymentIntent.amount ? BigInt(paymentIntent.amount) : null,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            captureMethod: paymentIntent.capture_method,
            metadata: paymentIntent.metadata as any,
          },
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: paymentIntent.customer as string },
        })

        if (!customer) {
          logger.error('Customer not found for payment intent:', paymentIntent.id)
          break
        }

        await prisma.stripePaymentIntent.upsert({
          where: { id: paymentIntent.id },
          update: {
            status: paymentIntent.status,
            metadata: paymentIntent.metadata as any,
          },
          create: {
            id: paymentIntent.id,
            customerId: customer.id,
            amount: paymentIntent.amount ? BigInt(paymentIntent.amount) : null,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            captureMethod: paymentIntent.capture_method,
            metadata: paymentIntent.metadata as any,
          },
        })
        break
      }

      // Payment Method events
      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod
        
        await prisma.paymentMethod.upsert({
          where: { id: paymentMethod.id },
          update: {
            type: paymentMethod.type,
            cardBrand: paymentMethod.card?.brand,
            cardLast4: paymentMethod.card?.last4,
            cardExpMonth: paymentMethod.card?.exp_month,
            cardExpYear: paymentMethod.card?.exp_year,
            billingDetails: paymentMethod.billing_details as any,
            metadata: paymentMethod.metadata as any,
          },
          create: {
            id: paymentMethod.id,
            stripeCustomerId: paymentMethod.customer as string,
            type: paymentMethod.type,
            cardBrand: paymentMethod.card?.brand,
            cardLast4: paymentMethod.card?.last4,
            cardExpMonth: paymentMethod.card?.exp_month,
            cardExpYear: paymentMethod.card?.exp_year,
            billingDetails: paymentMethod.billing_details as any,
            metadata: paymentMethod.metadata as any,
          },
        })
        break
      }

      // Checkout events
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: session.customer as string },
        })

        if (!customer) {
          logger.error('Customer not found for checkout session:', session.id)
          break
        }

        await prisma.stripeCheckoutSession.upsert({
          where: { id: session.id },
          update: {
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total ? BigInt(session.amount_total) : null,
          },
          create: {
            id: session.id,
            customerId: customer.id,
            paymentStatus: session.payment_status,
            mode: session.mode,
            amountTotal: session.amount_total ? BigInt(session.amount_total) : null,
            currency: session.currency || 'usd',
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
            url: session.url,
            metadata: session.metadata as any,
          },
        })
        break
      }

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`)
    }

    // Mark webhook as processed
    await prisma.stripeWebhookEvent.updateMany({
      where: { eventId: event.id },
      data: { 
        processed: true, 
        processedAt: new Date() 
      },
    })

  } catch (error) {
    logger.error(`Error processing webhook ${event.type}:`, error)
    
    // Mark webhook as failed
    await prisma.stripeWebhookEvent.updateMany({
      where: { eventId: event.id },
      data: { 
        processed: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      },
    })

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}