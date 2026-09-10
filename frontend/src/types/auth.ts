export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
}

export interface RegisterFieldErrors {
  email?: string;
  username?: string;
  password?: string;
  general?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

export interface RegisterSuccessResponse {
  token: string;
  user: AuthUser;
}

export interface ZodFieldErrorItem {
  _errors?: unknown;
}

/**
 * Type guard to check if a value is a non-null object record.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to validate that an API response matches the RegisterSuccessResponse schema.
 */
export function isRegisterSuccessResponse(data: unknown): data is RegisterSuccessResponse {
  if (!isRecord(data)) {
    return false;
  }

  const { token, user } = data;
  if (typeof token !== 'string' || token.trim() === '') {
    return false;
  }

  if (!isRecord(user)) {
    return false;
  }

  const { id, username } = user;
  if (typeof id !== 'string' || typeof username !== 'string') {
    return false;
  }

  return true;
}
