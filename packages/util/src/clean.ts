import { Request } from 'express'
import { omit } from 'lodash'

export function cleanQuery (query?: Request['query'], headers?: Request['headers']) {
  if (headers && (headers['x-zeplo-no-conflict'] === '1' || headers['x-ralley-no-conflict'] === '1')) return query
  return omit(query, [
    '_key',
    '_delay',
    '_delay_until',
    '_retry',
    '_interval',
    '_cron',
    '_throttle',
    '_timezone',
    '_trace',
    '_token',
    '_env',
    '_requires',
    '_step',
    '_index',
    '_source',
  ])
}

export function cleanHeaders (headers?: Request['headers']) {
  return omit(headers ?? {}, [
    'host',
    'connection',
    'accept-encoding',

    // Zeplo keys
    'x-zeplo-key',
    'x-zeplo-delay',
    'x-zeplo-delay-until',
    'x-zeplo-retry',
    'x-zeplo-interval',
    'x-zeplo-cron',
    'x-zeplo-throttle',
    'x-zeplo-timezone',
    'x-zeplo-trace',
    'x-zeplo-token',
    'x-zeplo-env',
    'x-zeplo-requires',
    'x-zeplo-step',
    'x-zeplo-no-conflict',
    'x-zeplo-index',
    'x-zeplo-source',

    // Ralley keys
    'x-ralley-key',
    'x-ralley-delay',
    'x-ralley-delay-until',
    'x-ralley-retry',
    'x-ralley-interval',
    'x-ralley-cron',
    'x-ralley-throttle',
    'x-ralley-timezone',
    'x-ralley-trace',
    'x-ralley-token',
    'x-ralley-env',
    'x-ralley-requires',
    'x-ralley-step',
    'x-ralley-no-conflict',

    // GCP headers
    'x-envoy-decorator-operation',
    'x-envoy-expected-rq-timeout-ms',
    'x-cloud-trace-context',
    'x-b3-traceid',
    'forwarded',
    'x-b3-spanid',
    'x-b3-sampled',
    'x-request-id',
    'k-proxy-request',
    'x-forwarded-proto',
    'x-forwarded-for',
    'x-envoy-external-address',
    'x-b3-parentspanid',

    // AWS headers
    'x-amzn-trace-id',
    'x-forwarded-port',
  ])
}
