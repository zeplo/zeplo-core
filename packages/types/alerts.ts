export interface Alert {
  name: string
  search: string
  type: 'all'|'threshold'
  threshold?: {
    count: number
    minutes: number
  }
  notifiers: {
    slack?: { channel: string }
    email?: { email: string }
  }
}

export interface AlertMeta {
  frequency?: string
  threshold?: { count: number, minutes: number }
  search?: string
  filterType?: 'error'|'failure'|'custom'
}

export interface AlertNotifiers {
  email?: {
    email?: string
  }
}