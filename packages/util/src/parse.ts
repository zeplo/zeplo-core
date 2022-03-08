import { Request } from 'express'
import queryString from 'query-string'
import { Request as ZeploRequest, RequestFeatures, RequestRetryBackoff } from '@zeplo/types/request'
import { Method } from 'axios'
import {
  isArray, isString, toNumber, map, forEach, fromPairs, merge, isPlainObject, isNumber,
} from 'lodash'
import { cleanHeaders, cleanQuery } from './clean'

export function parseRequest (
  id: string,
  workspace: string,
  req: Request,
  originalUrl?: string,
): ZeploRequest {
  const { method } = req
  let { body } = req

  // TODO: error if no URL
  const derivedUrl = originalUrl ?? req.url
  const url = derivedUrl.startsWith('http') ? derivedUrl : `https://${derivedUrl}`
  const urlObj = new URL(url)
  const derivedQuery = merge({}, req.query, queryString.parseUrl(url).query, req.params)

  const received = +(new Date()) / 1000
  const features = getRequestFeatures(derivedQuery, req.headers)
  const headers = parseRawRequestObject(cleanHeaders(req.headers))
  const query = parseRawRequestObject(cleanQuery(derivedQuery, req.headers))
  const start = getStartTimeFromFeatures(features, received)

  if (body && !Buffer.isBuffer(body) && !headers['content-type']) {
    if (isString(body)) headers['content-type'] = 'text/plain'
    if (isArray(body) || isPlainObject(body)) {
      headers['content-type'] = 'application/json'
    }
  }

  body = parseBody(req)

  return {
    ...features,
    id,
    key: features.key ?? 'default',
    workspace,
    received,
    updated: received,
    start: getStartTimeFromFeatures(features, received),
    status: received === start ? 'ACTIVE' : 'PENDING',
    source: 'REQUEST',
    request: {
      url: queryString.stringifyUrl({ url, query }),
      host: urlObj.host,
      path: urlObj.pathname,
      method: (method ?? 'POST') as Method,
      scheme: urlObj.protocol.substring(0, urlObj.protocol.length - 1) as 'https'|'http',
      headers,
      params: query,
      body,
      hasbody: !!body,
      start: received,
    },
  }
}

export function getStartTimeFromFeatures (features: RequestFeatures, start: number): number {
  if (features.delayuntil) return features.delayuntil
  if (features.delay) return features.delay + start
  return start
}

export function getRequestFeatures (query?: Request['query'], headers?: Request['headers']) {
  const {
    delayuntil, delay, retry, cron, interval, requires, timezone, env, key, trace, step,
  } = getRawFeatures(query, headers)

  const features: RequestFeatures = {
    attempts: 0,
    timezone,
    env,
    key,
    trace,
    step,
  }

  if (delayuntil) {
    features.delayuntil = toNumber(delayuntil)
  }

  if (delay) {
    features.delay = toNumber(delay)
  }

  if (retry) {
    const parts = retry.split('|')
    features.retry = {
      max: isString(parts[0]) && !Number.isNaN(toNumber(parts[0])) ? toNumber(parts[0]) : 1,
      backoff: getBackoff(parts[1]),
      time: isString(parts[2]) ? toNumber(parts[2]) : 1,
    }
  }

  if (cron) {
    features.cron = map(cron.split(','), (c) => c.split(/[\s|]/))
  }

  if (interval) {
    features.interval = toNumber(interval)
  }

  if (requires) {
    features.requires = fromPairs(map(requires.split(','), (s) => [s, 'tbc']))
  }

  return features
}

export function getBackoff (backoff?: string): RequestRetryBackoff {
  if (!backoff) return 'FIXED'
  const upper = backoff.toUpperCase()
  if (upper === 'FIXED' || upper === 'EXPONENTIAL' || upper === 'IMMEDIATE') return upper
  return 'FIXED'
}

export function getRawFeatures (query?: Request['query'], headers?: Request['headers']) {
  const noConflict = headers && (headers['x-zeplo-no-conflict'] === '1' || headers['x-ralley-no-conflict'] === '1')
  return {
    key: getValueFromQueryOrHeader('key', query, headers) ?? 'default',
    delay: getValueFromQueryOrHeader('delay', query, headers, noConflict),
    delayuntil: getValueFromQueryOrHeader('delay-until', query, headers, noConflict),
    retry: getValueFromQueryOrHeader('retry', query, headers, noConflict),
    interval: getValueFromQueryOrHeader('interval', query, headers, noConflict),
    cron: getValueFromQueryOrHeader('cron', query, headers, noConflict),
    throttle: getValueFromQueryOrHeader('throttle', query, headers, noConflict),
    timezone: getValueFromQueryOrHeader('timezone', query, headers, noConflict),
    trace: getValueFromQueryOrHeader('trace', query, headers, noConflict),
    env: getValueFromQueryOrHeader('env', query, headers, noConflict),
    requires: getValueFromQueryOrHeader('requires', query, headers, noConflict),
    step: getValueFromQueryOrHeader('step', query, headers, noConflict),
  }
}

// TODO: should we allow object params?!
export function parseRawRequestObject (headers?: Request['headers']|Request['query']): Record<string, string|number> {
  const h: Record<string, string|number> = {}
  forEach(headers, (v, k) => {
    if (isString(v) || isNumber(v)) h[k] = v
  })
  return h
}

export function getValueFromQueryOrHeader (key: string, query?: Request['query'], headers?: Request['headers'], noConflict?: boolean) {
  const value = headers?.[`x-zeplo-${key}`] ?? headers?.[`x-ralley-${key}`] ?? (!noConflict ? query?.[`_${key.replace('-', '_')}`] : undefined)
  if (isString(value) || isNumber(value)) return `${value}`
  if (isArray(value) && isString(value[0])) return value[0]
  return undefined
}

export function createRequestJob (data: any) {
  return JSON.stringify({
    data,
    options: {
      timestamp: Date.now(),
      backoff: {
        strategy: 'fixed',
        delay: 1000,
      },
      retries: 10,
    },
    status: 'created',
  })
}

export function parseBody (req: Request): string|undefined {
  const { body } = req

  if (Buffer.isBuffer(body)) return body?.toString('base64')
  if (isArray(body) || isPlainObject(body) || isNumber(body)) return Buffer.from(JSON.stringify(body)).toString('base64')
  if (isString(body)) return Buffer.from(body, 'utf8').toString('base64')

  return undefined
}