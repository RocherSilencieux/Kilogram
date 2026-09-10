import type { RegisterFormData, RegisterFieldErrors } from '../types/auth';
import { isRecord } from '../types/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Validates email format on the client side.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "L'adresse email est requise.";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Veuillez saisir une adresse email valide.";
  }
  return null;
}

/**
 * Validates username length and format on the client side.
 */
export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) {
    return "Le nom d'utilisateur est requis.";
  }
  if (trimmed.length < 3) {
    return "Le nom d'utilisateur doit contenir au moins 3 caractères.";
  }
  if (trimmed.length > 30) {
    return "Le nom d'utilisateur ne peut pas dépasser 30 caractères.";
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Lettres, chiffres, points, tirets et underscores uniquement.";
  }
  return null;
}

/**
 * Validates password length and security on the client side.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return "Le mot de passe est requis.";
  }
  if (password.length < 8) {
    return "Le mot de passe doit comporter au moins 8 caractères.";
  }
  return null;
}

/**
 * Validates all fields of the registration form.
 */
export function validateRegisterForm(data: RegisterFormData): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  const usernameError = validateUsername(data.username);
  if (usernameError) {
    errors.username = usernameError;
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

/**
 * Extracts a readable error string from unknown Zod-like error nodes.
 */
function extractFirstError(fieldNode: unknown): string | undefined {
  if (!isRecord(fieldNode)) {
    return undefined;
  }

  const errorsList = fieldNode['_errors'];
  if (Array.isArray(errorsList) && errorsList.length > 0) {
    const first = errorsList[0];
    if (typeof first === 'string') {
      return first;
    }
  }

  return undefined;
}

/**
 * Parses API error response and maps validation errors field-by-field.
 */
export function parseRegisterApiError(responseData: unknown): RegisterFieldErrors {
  const fieldErrors: RegisterFieldErrors = {};

  if (!isRecord(responseData)) {
    fieldErrors.general = "Une erreur imprévue est survenue lors de l'inscription.";
    return fieldErrors;
  }

  // Handle detailed Zod formatted errors: details: { email: { _errors: [...] }, ... }
  const details = responseData['details'];
  if (isRecord(details)) {
    const emailErr = extractFirstError(details['email']);
    if (emailErr) {
      fieldErrors.email = emailErr;
    }

    const usernameErr = extractFirstError(details['username']);
    if (usernameErr) {
      fieldErrors.username = usernameErr;
    }

    const passwordErr = extractFirstError(details['password']);
    if (passwordErr) {
      fieldErrors.password = passwordErr;
    }
  }

  // Handle high-level message or error string
  const rawError = responseData['error'] ?? responseData['message'];
  if (typeof rawError === 'string' && rawError.trim().length > 0) {
    const lower = rawError.toLowerCase();

    // Map common domain messages directly to their appropriate fields if not already populated
    if (lower.includes('email') && !fieldErrors.email) {
      fieldErrors.email = rawError;
    } else if ((lower.includes('username') || lower.includes('utilisateur')) && !fieldErrors.username) {
      fieldErrors.username = rawError;
    } else if ((lower.includes('password') || lower.includes('mot de passe')) && !fieldErrors.password) {
      fieldErrors.password = rawError;
    } else if (!fieldErrors.email && !fieldErrors.username && !fieldErrors.password) {
      fieldErrors.general = rawError;
    }
  }

  if (
    !fieldErrors.email &&
    !fieldErrors.username &&
    !fieldErrors.password &&
    !fieldErrors.general
  ) {
    fieldErrors.general = "Échec de l'inscription. Veuillez vérifier les informations saisies.";
  }

  return fieldErrors;
}
