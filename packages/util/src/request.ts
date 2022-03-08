// import { JsonValue } from '#/types/codegen'
import type core from 'express-serve-static-core'
import {
  RequestHandler,
} from 'express'
import expressAsyncHandler from 'express-async-handler'
import {
  isString, isArray, toNumber, mapValues,
} from 'lodash'

export function requestHandler <
P = core.ParamsDictionary,
ResBody = any,
ReqBody = any,
ReqQuery = core.Query,
> (fn: (...args:
  Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
) => Promise<any>) {
  return expressAsyncHandler<P, ResBody, ReqBody, ReqQuery>(async (req, res, next) => {
    const json = await fn(req, res, next)
    res.send(json)
  })
}

export function jsonRequestHandler <
P = core.ParamsDictionary,
ResBody = any,
ReqBody = any,
ReqQuery = core.Query,
> (fn: (...args:
  Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
) => Promise<any>) {
  return expressAsyncHandler<P, ResBody, ReqBody, ReqQuery>(async (req, res, next) => {
    const json = await fn(req, res, next)
    res.json(json)
  })
}

export const queryToString = (param?: core.Query[string], required?: boolean): string|null => {
  if (isArray(param) && isString(param[0])) return param[0]
  if (isString(param)) return param
  if (required) throw new Error('Required parameter missing')
  return null
}

export const queryToNumber = (param?: core.Query[string], required?: boolean): number => {
  return toNumber(queryToString(param, required))
}

export const parseQuery = (query?: core.Query) => {
  return mapValues(query, (val) => (queryToString(val)))
}
