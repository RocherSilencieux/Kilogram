import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateRegisterForm,
  parseRegisterApiError,
} from '../utils/authValidation';

describe('authValidation pure functions', () => {
  describe('validateEmail', () => {
    it('returns error for empty or whitespace-only email', () => {
      expect(validateEmail('')).toMatch(/requise/i);
      expect(validateEmail('   ')).toMatch(/requise/i);
    });

    it('returns error for invalid email formats', () => {
      expect(validateEmail('plainaddress')).toMatch(/valide/i);
      expect(validateEmail('@missingusername.com')).toMatch(/valide/i);
      expect(validateEmail('username@.com')).toMatch(/valide/i);
    });

    it('returns null for valid email formats', () => {
      expect(validateEmail('alice@test.com')).toBeNull();
      expect(validateEmail('user.name+tag@sub.domain.org')).toBeNull();
    });
  });

  describe('validateUsername', () => {
    it('returns error for empty or whitespace-only username', () => {
      expect(validateUsername('')).toMatch(/requis/i);
      expect(validateUsername('  ')).toMatch(/requis/i);
    });

    it('returns error for username shorter than 3 characters', () => {
      expect(validateUsername('a')).toMatch(/au moins 3 caractères/i);
      expect(validateUsername('ab')).toMatch(/au moins 3 caractères/i);
    });

    it('returns error for username longer than 30 characters', () => {
      expect(validateUsername('a'.repeat(31))).toMatch(/ne peut pas dépasser 30/i);
    });

    it('returns error for invalid characters', () => {
      expect(validateUsername('user name with spaces')).toMatch(/uniquement/i);
      expect(validateUsername('user@invalid!')).toMatch(/uniquement/i);
    });

    it('returns null for valid usernames', () => {
      expect(validateUsername('alice')).toBeNull();
      expect(validateUsername('alex_dev-99')).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('returns error for empty password', () => {
      expect(validatePassword('')).toMatch(/requis/i);
    });

    it('returns error for password shorter than 8 characters', () => {
      expect(validatePassword('1234567')).toMatch(/au moins 8 caractères/i);
    });

    it('returns null for password with 8 or more characters', () => {
      expect(validatePassword('12345678')).toBeNull();
      expect(validatePassword('verySecurePassword!2026')).toBeNull();
    });
  });

  describe('validateRegisterForm', () => {
    it('accumulates all validation errors when all fields are empty', () => {
      const errors = validateRegisterForm({ email: '', username: '', password: '' });
      expect(errors.email).toBeDefined();
      expect(errors.username).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it('returns empty errors object when all fields are valid', () => {
      const errors = validateRegisterForm({
        email: 'alice@test.com',
        username: 'alice_01',
        password: 'password123',
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('parseRegisterApiError', () => {
    it('maps Zod details errors to corresponding fields', () => {
      const apiResponse = {
        error: 'invalid data',
        details: {
          email: { _errors: ['Email déjà pris'] },
          username: { _errors: ['Nom trop court'] },
          password: { _errors: ['Mot de passe trop simple'] },
        },
      };

      const parsed = parseRegisterApiError(apiResponse);
      expect(parsed.email).toBe('Email déjà pris');
      expect(parsed.username).toBe('Nom trop court');
      expect(parsed.password).toBe('Mot de passe trop simple');
    });

    it('maps duplicate email string error to email field', () => {
      const parsed = parseRegisterApiError({ error: 'Email déjà utilisé' });
      expect(parsed.email).toBe('Email déjà utilisé');
    });

    it('maps generic error message to general error', () => {
      const parsed = parseRegisterApiError({ error: 'Erreur interne du serveur' });
      expect(parsed.general).toBe('Erreur interne du serveur');
    });

    it('handles unexpected responses gracefully', () => {
      const parsed = parseRegisterApiError(null);
      expect(parsed.general).toBeDefined();
    });
  });
});
