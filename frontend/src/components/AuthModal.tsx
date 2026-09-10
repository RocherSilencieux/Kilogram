import React, { useState } from 'react';
import { RegisterForm } from './auth/RegisterForm';
import { LoginForm } from './auth/LoginForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header & Navigation Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
              mode === 'login'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/40'
                : 'text-gray-400 hover:text-gray-700 bg-gray-50/50'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
              mode === 'register'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/40'
                : 'text-gray-400 hover:text-gray-700 bg-gray-50/50'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Modal Content - Modularized per role */}
        {mode === 'register' ? (
          <RegisterForm
            onSuccess={onClose}
            onSwitchToLogin={() => setMode('login')}
            onCancel={onClose}
          />
        ) : (
          <LoginForm
            onSuccess={onClose}
            onSwitchToRegister={() => setMode('register')}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
};
