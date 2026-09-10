import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type {
  RegisterFormData,
  RegisterFieldErrors,
} from '../../types/auth';
import { isRegisterSuccessResponse } from '../../types/auth';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateRegisterForm,
  parseRegisterApiError,
} from '../../utils/authValidation';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
  onCancel?: () => void;
}

type FormStatus = 'idle' | 'loading' | 'error' | 'success';

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  onCancel,
}) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [touched, setTouched] = useState<Record<keyof RegisterFormData, boolean>>({
    email: false,
    username: false,
    password: false,
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Reset error for current field as user types
    if (fieldErrors[field] || fieldErrors.general) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        delete updated.general;
        return updated;
      });
    }
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let error: string | null = null;
    if (field === 'email') {
      error = validateEmail(formData.email);
    } else if (field === 'username') {
      error = validateUsername(formData.username);
    } else if (field === 'password') {
      error = validatePassword(formData.password);
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Mark all fields as touched
    setTouched({
      email: true,
      username: true,
      password: true,
    });

    // 2. Client-side validation (Champs contrôlés, validation front)
    const frontErrors = validateRegisterForm(formData);
    if (Object.keys(frontErrors).length > 0) {
      setFieldErrors(frontErrors);
      setStatus('error');
      return;
    }

    // 3. UI State: Loading
    setStatus('loading');
    setFieldErrors({});

    try {
      // Direct call with proxy fallback
      let response: Response;
      const payload = JSON.stringify({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
      });

      try {
        response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      } catch {
        response = await fetch('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      }

      const responseJson: unknown = await response.json();

      if (!response.ok) {
        // Erreurs API affichées champ par champ
        const parsedErrors = parseRegisterApiError(responseJson);
        setFieldErrors(parsedErrors);
        setStatus('error');
        return;
      }

      // Données API validées avant usage via strict type guard
      if (!isRegisterSuccessResponse(responseJson)) {
        setFieldErrors({
          general: 'Réponse inattendue du serveur lors de la validation du compte.',
        });
        setStatus('error');
        return;
      }

      // 4. UI State: Success (Mot de passe jamais réaffiché)
      setStatus('success');
      setSuccessMessage(`Bienvenue @${responseJson.user.username} ! Votre compte a été créé avec succès.`);
      
      // Clear sensitive password field immediately
      setFormData((prev) => ({ ...prev, password: '' }));

      // Authenticate user in session context
      login(responseJson.token, {
        id: responseJson.user.id,
        username: responseJson.user.username,
        email: responseJson.user.email,
      });

      // Brief delay to allow user to visually see success state before closing
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch {
      setStatus('error');
      setFieldErrors({
        general: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
      });
    }
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Créer un compte</h2>
        <p className="text-xs text-gray-500 mt-1">
          Rejoignez Kilogram pour partager vos moments et échanger avec la communauté.
        </p>
      </div>

      {/* 4 États UI : Success State */}
      {isSuccess && successMessage && (
        <div
          role="status"
          className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn"
        >
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 4 États UI : General Error Banner */}
      {fieldErrors.general && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-shake"
        >
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{fieldErrors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Champ : Email */}
        <div>
          <label htmlFor="register-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Adresse email <span className="text-red-500">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            disabled={isLoading || isSuccess}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="alice@exemple.com"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition focus:outline-none focus:ring-2 ${
              fieldErrors.email && touched.email
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 bg-white focus:border-purple-500 focus:ring-purple-500/20'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {fieldErrors.email && touched.email && (
            <p id="register-email-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
              <span aria-hidden="true">•</span>
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Champ : Nom d'utilisateur */}
        <div>
          <label htmlFor="register-username" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Nom d'utilisateur <span className="text-red-500">*</span>
          </label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            disabled={isLoading || isSuccess}
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            onBlur={() => handleBlur('username')}
            placeholder="Ex: alex_dev (au moins 3 caractères)"
            aria-invalid={!!fieldErrors.username}
            aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition focus:outline-none focus:ring-2 ${
              fieldErrors.username && touched.username
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 bg-white focus:border-purple-500 focus:ring-purple-500/20'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {fieldErrors.username && touched.username && (
            <p id="register-username-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
              <span aria-hidden="true">•</span>
              {fieldErrors.username}
            </p>
          )}
        </div>

        {/* Champ : Mot de passe */}
        <div>
          <label htmlFor="register-password" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Mot de passe <span className="text-red-500">*</span>
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            disabled={isLoading || isSuccess}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="Au moins 8 caractères"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition focus:outline-none focus:ring-2 ${
              fieldErrors.password && touched.password
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 bg-white focus:border-purple-500 focus:ring-purple-500/20'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {fieldErrors.password && touched.password ? (
            <p id="register-password-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
              <span aria-hidden="true">•</span>
              {fieldErrors.password}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">8 caractères minimum.</p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {onCancel ? (
            <button
              type="button"
              disabled={isLoading || isSuccess}
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
            disabled={isLoading || isSuccess}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
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
                <span>Création du compte...</span>
              </>
            ) : isSuccess ? (
              <span>Compte créé !</span>
            ) : (
              <span>S'inscrire</span>
            )}
          </button>
        </div>
      </form>

      {/* Critère d'acceptation S1 : Lien vers la connexion */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          Vous avez déjà un compte ?{' '}
          <button
            type="button"
            disabled={isLoading || isSuccess}
            onClick={onSwitchToLogin}
            className="font-semibold text-purple-600 hover:text-purple-700 underline underline-offset-2 transition disabled:opacity-50 cursor-pointer"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
};
