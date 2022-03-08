import { ERROR_REASONS } from './constants'
import { ApiError, ApiErrorInput } from './ApiError'

export function createError (reason: keyof typeof ERROR_REASONS, other?: ApiErrorInput) {
  return new ApiError(reason, other)
}
