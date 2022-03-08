export const ERROR_CODES = {
  'invalid-argument': 400,
  'failed-precondition': 400,
  'out-of-range': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  aborted: 409,
  'already-exists': 409,
  'resource-exhausted': 429,
  cancelled: 499,
  unavailable: 500,
  internal: 500,
  'deadline-exceeded': 504,
}

export const ERROR_REASONS = {
  'not-found': { code: 'not-found', message: 'Not found' },
  'server-error': { code: 'internal', message: 'An internal error occured' },
  'required-fields': { code: 'invalid-argument', message: 'Required field is missing' },
  'invalid-argument': { code: 'invalid-argument', message: 'Invalid arguments' },
  'missing-relation': { code: 'internal', message: 'A required relation is missing' },
  'too-many-requests': { code: 'resource-exhausted', message: 'Too many requests' },

  'auth/login-with-email': { code: 'unauthenticated', message: 'Login with email to continue' },
  'auth/password-required': { code: 'unauthenticated', message: 'Password is required to login' },
  'auth/email-not-validated': { code: 'unauthenticated', message: 'E-mail is not validated' },
  'auth/permission-denied': { code: 'permission-denied', message: 'You do not have permission to access this resource' },
  'auth/not-workspace-admin': { code: 'permission-denied', message: 'You must be a workspace admin' },
  'auth/not-workspace-member': { code: 'permission-denied', message: 'You must be a workspace member' },
  'auth/unauthenticated': { code: 'unauthenticated', message: 'You must be logged in to perform this action' },
  'auth/invalid-token': { code: 'unauthenticated', message: 'Authentication token provided is invalid' },
  'auth/email-already-exists': { code: 'already-exists', message: 'User already exists' },
  'auth/invalid-password': { code: 'invalid-argument', message: 'Password is incorrect' },
  'auth/invalid-email': { code: 'invalid-argument', message: 'Email is incorrectly formatted' },
  'auth/user-not-found': { code: 'not-found', message: 'User not found' },

  'workspace/workspace-required': { code: 'invalid-argument', message: 'Workspace is required query parameter' },
  'workspace/id-already-exists': { code: 'already-exists', message: 'Workspace ID taken, please try another' },
  'workspace/last-admin': { code: 'failed-precondition', message: 'Removing the last admin for a workspace is not allowed. Delete the workspace instead.' },

  'billing/no-subscription': { code: 'not-found', message: 'No active subscription is present for workspace' },
  'billing/not-card-owner': { code: 'failed-precondition', message: 'You do not own this card' },
  'billing/card-declined': { code: 'failed-precondition', message: 'Card declined' },

  'invites/token-already-used': { code: 'failed-precondition', message: 'Token has already been used' },
  'invites/token-revoked': { code: 'failed-precondition', message: 'Token has been revoked }' },
  'invites/token-expired': { code: 'failed-precondition', message: 'Token has expired' },
  'invites/email-mismatch': { code: 'invalid-argument', message: 'E-mail does not match invited e-mail' },

  'codes/invalid-code-type': { code: 'failed-precondition', message: 'Code was used in the incorrect context' },
  'codes/already-used': { code: 'failed-precondition', message: 'Code can only be used once, and it has already been used' },
  'codes/expired': { code: 'failed-precondition', message: 'Code has expired, please request a new code' },

  'requests/invalid-state': { code: 'failed-precondition', message: 'Request state is invalid' },

  'steps/all-steps-have-requires': { code: 'invalid-argument', message: 'At least one step must have no requires parameter, as that is the starting step' },
  'steps/cyclical-dependencies': { code: 'invalid-argument', message: 'Cyclical dependencies in steps (e.g. a -> b -> a)' },
  'steps/missing-step': { code: 'invalid-argument', message: 'Step is required by another step, but not provided' },
  'steps/duplicate-step-name': { code: 'invalid-argument', message: 'Two or more steps have the same name, all step names must be unique' },
}
