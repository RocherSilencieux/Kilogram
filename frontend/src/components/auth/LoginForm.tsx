import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { FormField } from '../common/FormField';
import { loginUser, AuthApiError } from '../../services/auth.service';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onCancel?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onCancel,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Veuillez fournir votre email et votre mot de passe.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(trimmedEmail, password);
      login(data.token, {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        setError(err.fieldErrors.general || err.message);
      } else {
        setError('Impossible de joindre le serveur. Veuillez réessayer ultérieurement.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Connexion</h2>
        <p className="text-xs text-gray-500 mt-1">
          Connectez-vous pour accéder à votre fil d'actualité et interagir.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-shake"
        >
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="login-email"
          label="Adresse email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="alice@test.com"
          autoComplete="email"
          required
          disabled={loading}
        />

        <FormField
          id="login-password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={loading}
        />

        <div className="pt-2 flex items-center justify-between gap-3">
          {onCancel ? (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 transition"
            >
              Annuler
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Connexion en cours...</span>
              </>
            ) : (
              <span>Se connecter</span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          Pas encore de compte ?{' '}
          <button
            type="button"
            disabled={loading}
            onClick={onSwitchToRegister}
            className="font-semibold text-purple-600 hover:text-purple-700 underline underline-offset-2 transition disabled:opacity-50 cursor-pointer"
          >
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  );
};
