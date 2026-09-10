import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';

// Mock du contexte AuthContext
const mockLogin = vi.fn();
const mockLogout = vi.fn();

const mockAuthContextValue: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: mockLogin,
  logout: mockLogout,
};

function renderRegisterForm(props = {}) {
  const defaultProps = {
    onSuccess: vi.fn(),
    onSwitchToLogin: vi.fn(),
    onCancel: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <RegisterForm {...defaultProps} />
      </AuthContext.Provider>
    ),
    props: defaultProps,
  };
}

describe('Story 1 (S1 — Inscription) Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('1. Formulaire complet : affiche email, nom d\'utilisateur et mot de passe', () => {
    renderRegisterForm();

    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it('2. Mot de passe masqué : l\'input mot de passe est de type "password"', () => {
    renderRegisterForm();

    const passwordInput = screen.getByLabelText(/mot de passe/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('3. Lien vers la connexion : le bouton "Se connecter" bascule bien vers la connexion', async () => {
    const user = userEvent.setup();
    const onSwitchToLogin = vi.fn();
    renderRegisterForm({ onSwitchToLogin });

    const switchBtn = screen.getByRole('button', { name: /se connecter/i });
    expect(switchBtn).toBeInTheDocument();

    await user.click(switchBtn);
    expect(onSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('4. Validation front : bloque l\'envoi et affiche les erreurs si les champs sont vides', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const submitBtn = screen.getByRole('button', { name: /s'inscrire/i });
    await user.click(submitBtn);

    expect(screen.getByText(/l'adresse email est requise/i)).toBeInTheDocument();
    expect(screen.getByText(/le nom d'utilisateur est requis/i)).toBeInTheDocument();
    expect(screen.getByText(/le mot de passe est requis/i)).toBeInTheDocument();
  });

  it('5. Validation front : affiche les erreurs spécifiques si les formats sont invalides', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);

    await user.type(emailInput, 'mauvais-email');
    await user.type(usernameInput, 'ab'); // < 3 chars
    await user.type(passwordInput, '12345'); // < 8 chars

    const submitBtn = screen.getByRole('button', { name: /s'inscrire/i });
    await user.click(submitBtn);

    expect(screen.getByText(/veuillez saisir une adresse email valide/i)).toBeInTheDocument();
    expect(screen.getByText(/au moins 3 caractères/i)).toBeInTheDocument();
    expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument();
  });

  it('6. Erreurs API affichées champ par champ : gère les erreurs détaillées de validation Zod du backend', async () => {
    const user = userEvent.setup();

    // Mock d'une réponse 400 avec format Zod
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'invalid data',
        details: {
          email: { _errors: ['Email format rejeté par le serveur'] },
          username: { _errors: ['Nom d\'utilisateur déjà réservé'] },
          password: { _errors: ['Mot de passe trop vulnérable'] },
        },
      }),
    });

    renderRegisterForm();

    await user.type(screen.getByLabelText(/adresse email/i), 'test@exemple.com');
    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'mon_user');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');

    await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(screen.getByText('Email format rejeté par le serveur')).toBeInTheDocument();
      expect(screen.getByText('Nom d\'utilisateur déjà réservé')).toBeInTheDocument();
      expect(screen.getByText('Mot de passe trop vulnérable')).toBeInTheDocument();
    });
  });

  it('7. Erreurs API champ par champ : associe le message d\'email dupliqué directement sous le champ email', async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Email déjà utilisé',
      }),
    });

    renderRegisterForm();

    await user.type(screen.getByLabelText(/adresse email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'alice_new');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');

    await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      const emailError = screen.getByText('Email déjà utilisé');
      expect(emailError).toBeInTheDocument();
      expect(emailError.id).toBe('register-email-error');
    });
  });

  it('8. État d\'erreur globale : affiche un bandeau clair sans perte de formulaire si le serveur est inaccessible', async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    renderRegisterForm();

    const emailInput = screen.getByLabelText(/adresse email/i);
    await user.type(emailInput, 'valid@test.com');
    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'valid_user');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');

    await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/impossible de contacter le serveur/i)).toBeInTheDocument();
    });

    // Le formulaire n'est pas perdu
    expect(emailInput).toHaveValue('valid@test.com');
  });

  it('9. État de succès : affiche la confirmation, connecte l\'utilisateur et vide le mot de passe', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        token: 'fake-jwt-token-123',
        user: {
          id: 'user-id-999',
          email: 'nouveau@test.com',
          username: 'nouveau_user',
        },
      }),
    });

    renderRegisterForm({ onSuccess });

    const passwordInput = screen.getByLabelText(/mot de passe/i);
    await user.type(screen.getByLabelText(/adresse email/i), 'nouveau@test.com');
    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'nouveau_user');
    await user.type(passwordInput, 'motdepasse123');

    await user.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/votre compte a été créé avec succès/i)).toBeInTheDocument();
    });

    // Login appelé avec token et user (sans mot de passe)
    expect(mockLogin).toHaveBeenCalledWith('fake-jwt-token-123', {
      id: 'user-id-999',
      username: 'nouveau_user',
      email: 'nouveau@test.com',
    });

    // Mot de passe vidé de l'état
    expect(passwordInput).toHaveValue('');
  });
});
