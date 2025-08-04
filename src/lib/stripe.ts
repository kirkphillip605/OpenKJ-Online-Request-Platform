import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const formatAmountForDisplay = (amount: number, currency: string): string => {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  return numberFormat.format(amount / 100)
}

export const formatAmountFromStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(amount / 100)
  return parseFloat(parts.map(part => part.value).join('').replace(/[^0-9.-]+/g, ''))
}