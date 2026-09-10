import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please provide your email address and password.");
      return;
    }

    if (mode === "register" && !username.trim()) {
      setError("Please provide a username.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const endpoint = mode === "login" ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const payload =
      mode === "login"
        ? { email, password }
        : { email, username, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.message || "Authentication request failed.");
      }

      if (data.token && data.user) {
        login(data.token, data.user);
        onClose();
        resetForm();
      } else {
        throw new Error("Invalid response structure from backend.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setError(null);
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Modal Header & Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              mode === "login"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/30"
                : "text-gray-500 hover:text-gray-700 bg-gray-50/50"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              mode === "register"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/30"
                : "text-gray-500 hover:text-gray-700 bg-gray-50/50"
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {mode === "login" ? "Bienvenue sur Kilogram" : "Créer un compte"}
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            {mode === "login"
              ? "Connectez-vous pour publier et liker des publications."
              : "Rejoignez la communauté Kilogram en quelques secondes."}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: alice@test.com"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: alex_dev"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-sm"
              >
                {loading
                  ? "Chargement..."
                  : mode === "login"
                  ? "Se connecter"
                  : "S'inscrire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
