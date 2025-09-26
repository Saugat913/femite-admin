export enum SessionErrorCode {
  SESSION_MISSING = 'SESSION_MISSING',
  SESSION_INVALID = 'SESSION_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_MALFORMED = 'SESSION_MALFORMED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

export interface SessionError {
  code: SessionErrorCode
  message: string
  timestamp: string
  requiresReauth?: boolean
}

export class SessionErrorBuilder {
  static missing(): SessionError {
    return {
      code: SessionErrorCode.SESSION_MISSING,
      message: 'Authentication required. Please log in to continue.',
      timestamp: new Date().toISOString(),
      requiresReauth: true
    }
  }

  static invalid(): SessionError {
    return {
      code: SessionErrorCode.SESSION_INVALID,
      message: 'Invalid session. Please log in again.',
      timestamp: new Date().toISOString(),
      requiresReauth: true
    }
  }

  static expired(): SessionError {
    return {
      code: SessionErrorCode.SESSION_EXPIRED,
      message: 'Your session has expired. Please log in again.',
      timestamp: new Date().toISOString(),
      requiresReauth: true
    }
  }

  static malformed(): SessionError {
    return {
      code: SessionErrorCode.SESSION_MALFORMED,
      message: 'Session data is corrupted. Please log in again.',
      timestamp: new Date().toISOString(),
      requiresReauth: true
    }
  }

  static userNotFound(): SessionError {
    return {
      code: SessionErrorCode.USER_NOT_FOUND,
      message: 'User account not found. Please contact support.',
      timestamp: new Date().toISOString(),
      requiresReauth: true
    }
  }

  static insufficientPermissions(): SessionError {
    return {
      code: SessionErrorCode.INSUFFICIENT_PERMISSIONS,
      message: 'You do not have permission to perform this action.',
      timestamp: new Date().toISOString(),
      requiresReauth: false
    }
  }
}

export interface SessionValidationResult {
  success: boolean
  session?: any
  error?: SessionError
}

export class SessionValidator {
  static success(session: any): SessionValidationResult {
    return {
      success: true,
      session
    }
  }

  static failure(error: SessionError): SessionValidationResult {
    return {
      success: false,
      error
    }
  }
}
