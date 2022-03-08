import Stripe from 'stripe'

export type WorkspaceAuthRole = 'admin'|'write'|'read,write'

export interface UserAuth {
  id: string
  type: 'workspace'|'user'
  role?: 'admin'|'write'|'read,write'|'read'
  admin?: boolean
  beta?: boolean
  email?: string
  workspaces: {
    [key: string]: 1|2
  }
}

export interface User {
  id?: string
  name: string
  email: string
  activeWorkspaceId: string
  workspaces: {
    [key: string]: {
      search: string
      table: {
        [key: string]: { 
          width?: number
        }
      }
    }
  }
}

export interface UserBilling {
  customerId?: string
  defaultPaymentMethodId?: string
  paymentMethods?: {
    [key: string]: Stripe.PaymentMethod
  }
}