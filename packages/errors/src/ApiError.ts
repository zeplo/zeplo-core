import { ERROR_CODES, ERROR_REASONS } from './constants'

export interface ApiErrorBase {
  /** The status code or error group */
  code?: keyof typeof ERROR_CODES

  /** Status code */
  statusCode?: number

  /** Whether the error is loggable */
  log?: boolean

  /** Data that can be presented to the user */
  data?: any

  /** Internal data, not to be shared externally */
  internal?: any

  /** Original error message before normalization */
  originalError?: { name: string, message: string, stack: string }
}

export interface ApiErrorObject extends ApiErrorBase {
  /** A specific pre-defined reason for the error */
  reason: keyof typeof ERROR_REASONS

  /** Message that can be presented to the user */
  message?: string

  /** Stack trace for the error */
  stack?: string
}

export interface ApiErrorInput extends Omit<ApiErrorBase, 'originalError'> {
  /** Original error, before normalized */
  originalError?: any

  /** Message that can be presented to the user */
  message?: string
}

export class ApiError extends Error {
  error?: ApiErrorBase

  reason: keyof typeof ERROR_REASONS

  constructor (
    reason: keyof typeof ERROR_REASONS,
    input?: ApiErrorInput,
  ) {
    super(`${reason} error`)
    this.reason = reason

    const { originalError, ...error } = input ?? {}
    const { code, message, ...restReasonData } = ERROR_REASONS[reason] ?? null

    this.message = message
    this.error = ({
      statusCode: 500,
      ...(restReasonData ?? {}),
      ...(error ?? {}),
    })

    if (this.error && !this.error.code && code) {
      this.error.code = code as keyof typeof ERROR_CODES
      this.error.statusCode = ERROR_CODES[this.error.code]
    }

    if (originalError) {
      this.stack = originalError.stack
      this.error.originalError = {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack,
      }
    }

    if (input?.message) {
      this.message = input.message
    }
  }

  toJSON = (): ApiErrorObject => {
    return {
      ...this.error,
      reason: this.reason,
      message: this.message,
      stack: this.stack,
    }
  }

  toPublicJSON = () => {
    return {
      reason: this.reason,
      message: this.message,
      data: this.error?.data,
    }
  }

  static fromJSON = (err: ApiErrorObject): ApiError => {
    const { reason, ...rest } = err
    return new ApiError(reason, rest)
  }
}
