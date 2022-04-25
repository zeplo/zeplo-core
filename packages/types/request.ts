import { Method } from 'axios'

export type RequestStatus = 'ACTIVE'|'PENDING'|'ERROR'|'SUCCESS'|'INACTIVE'
export type RequestSource = 'REQUEST'|'SCHEDULE'|'RETRY'|'STEP'

export interface Request extends RequestFeatures {
  /**
   * Unique ID in format <uuidv4>-<3-letter-zone>
   *
   * @minimum 0
   * @TJS-type string
   */
  id: string
  key: string
  workspace: string
  status: RequestStatus
  source: RequestSource
  message?: string
  start: number
  end?: number
  duration?: number
  request: RequestRequest
  response?: RequestResponse
  ignored?: boolean
  received: number
  updated: number
  worker?: string
  _source?: RequestFeatures
}

export interface RequestRequest {
  method: Method
  url: string
  headers?: Record<string, string|number>
  scheme: 'http' | 'https'
  host: string
  path: string
  params?: Record<string, string|number>
  body?: string
  hasbody?: boolean
  start: number
}

export interface RequestResponse {
  status: number
  statustext: string
  headers: any
  body?: any
  start?: number
  end?: number
  hasbody?: boolean
}

export interface RequestFeatures {
  key?: string
  trace?: string
  retry?: RequestRetry
  delay?: number
  delayuntil?: number
  interval?: number
  cron?: string[][]
  attempts: number
  timezone?: string
  /** Name of this requests step - user provided. Defaults to the request UUID */
  step?: string
  requires?: Record<string, string>
  /** Map of step names (user provided) to steps */
  steps?: Record<string, RequestStep>
  env?: string 

}

export interface RequestStep {
  /** UUID of the job/request, this job will be logged in the system, but will be pending */
  id: string
  /** Marked as 1 when the job is complete, this is used to determine what can run next */
  complete?: 1
  /** Determines whether all require dependencies have completed */
  started?: 1
  /** The name of the step, as provided by the user */
  step?: string
  /** Delay before running the step */
  delay?: number
  /** Map of step dependencies names */
  requires?: Record<string, 1>
}

export type RequestRetryBackoff = 'FIXED'|'EXPONENTIAL'|'IMMEDIATE'

export interface RequestRetry {
  max: number
  backoff?: RequestRetryBackoff|null
  time?: number|null
  exhausted?: boolean
}

