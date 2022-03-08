
/**
 * A plan that a workspace can subscribe to.
 */
 export interface Plan {
  /**
   * Unique plan ID - not to be reused.
   */
  id: string

  /**
   * The type of plan. There should be only one 
   * free plan (and changing to a free plan is 
   * seen as a cancellation. Only plans that are 100%
   * free should be marked as free.) 
   */
  type: 'free'|'selfserve'|'sales'

   /**
   * ID assigned by Stripe
   */
  stripeId?: string[]

  /**
   * ID assigned by Stripe
   */
  stripeTestId?: string[]

  /**
   * Name of the plan will be displayed to the user
   */
  name: string

  /**
   * Used to determine whether a plan is an upgrade/downgrade 
   * from the current plan.
   */
  rank?: number

  /**
   * The price of the plan in dollars (can include decimal places).
   * @deprecated: this should be added under items.base.price
   */
  price?: number|string

  trial?: number,

  items?: {
    [key: string]: {
      type: 'fixed'|'metered',
      price?: number
      priceId?: string
      testPriceId?: string
      roundup?: number
      included?: number
      limit?: number
      period?: 'day'|'month'|'year'
      tiers?: {
        upto: number
        price: number
      }[]
    }
  }

  /**
   * Date the price plan was added (in format 2022-01-01)
   */
  created?: string
}

