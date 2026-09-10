import type { RegisterFormData, RegisterSuccessResponse, RegisterFieldErrors } from '../types/auth';
import { isRecord, isRegisterSuccessResponse } from '../types/auth';
import { parseRegisterApiError } from '../utils/authValidation';

export class AuthApiError extends Error {
  public fieldErrors: RegisterFieldErrors;

  constructor(message: string, fieldErrors: RegisterFieldErrors = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.fieldErrors = fieldErrors;
  }
}

async function requestWithFallback(
  path: string,
  options: RequestInit
): Promise<Response> {
  try {
    return await fetch(`/api${path}`, options);
  } catch {
    return await fetch(`http://localhost:3000${path}`, options);
  }
}

/**
 * Registers a new user via API and validates the received response.
 */
export async function registerUser(
  data: RegisterFormData
): Promise<RegisterSuccessResponse> {
  const payload = JSON.stringify({
    email: data.email.trim(),
    username: data.username.trim(),
    password: data.password,
  });

  const response = await requestWithFallback('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  const responseJson: unknown = await response.json();

  if (!response.ok) {
    const parsedErrors = parseRegisterApiError(responseJson);
    throw new AuthApiError(
      parsedErrors.general ?? 'Registration failed',
      parsedErrors
    );
  }

  if (isRecord(responseJson) && typeof responseJson['error'] === 'string') {
    throw new AuthApiError(responseJson['error'], {
      general: responseJson['error'],
    });
  }

  if (!isRegisterSuccessResponse(responseJson)) {
    throw new AuthApiError('Réponse inattendue du serveur lors de la validation du compte.', {
      general: 'Réponse inattendue du serveur lors de la validation du compte.',
    });
  }

  return responseJson;
}

/**
 * Logs in a user via API and validates the received response.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<RegisterSuccessResponse> {
  const payload = JSON.stringify({
    email: email.trim(),
    password,
  });

  const response = await requestWithFallback('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  const responseJson: unknown = await response.json();

  if (!response.ok) {
    const parsedErrors = parseRegisterApiError(responseJson);
    throw new AuthApiError(
      parsedErrors.general ?? 'Identifiants invalides ou erreur de connexion.',
      parsedErrors
    );
  }

  if (isRecord(responseJson) && typeof responseJson['error'] === 'string') {
    throw new AuthApiError(responseJson['error'], {
      general: responseJson['error'],
    });
  }

  if (!isRegisterSuccessResponse(responseJson)) {
    throw new AuthApiError('Format de réponse invalide du serveur.', {
      general: 'Format de réponse invalide du serveur.',
    });
  }

  return responseJson;
}
