import Stripe from 'stripe'

export interface WorkspaceBilling {
  billday?: number
  createdAt?: number
  paymentMethod?: Stripe.PaymentMethod|null
  status?: 'active'|'cancelled'|'pending'
  subscriptionId?: string
  subscriptionItems?: Stripe.SubscriptionItem[]
  userId: string
}

