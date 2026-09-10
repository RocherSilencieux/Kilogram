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
      setError("Veuillez fournir votre email et mot de passe.");
      return;
    }

    if (mode === "register" && !username.trim()) {
      setError("Veuillez choisir un nom d'utilisateur.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setLoading(true);
    const endpoint = mode === "login" ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const payload =
      mode === "login"
        ? { email, password }
        : { email, username, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      if (data.token && data.user) {
        login(data.token, data.user);
        onClose();
        resetForm();
      } else {
        throw new Error("Réponse inattendue du serveur.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden relative">
        {/* Ligne d'accent en haut */}
        <div className="h-1 w-full bg-[var(--brand-gradient)]" />

        {/* En-tête de la modal & Onglets */}
        <div className="flex border-b border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-4 text-sm font-bold transition ${
              mode === "login"
                ? "text-[var(--orange-500)] border-b-2 border-[var(--orange-500)] bg-[var(--brand-gradient-soft)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-4 text-sm font-bold transition ${
              mode === "register"
                ? "text-[var(--orange-500)] border-b-2 border-[var(--orange-500)] bg-[var(--brand-gradient-soft)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Corps de la modal */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-1 font-['Outfit']">
            {mode === "login" ? "Bienvenue sur Kilogram" : "Créer un compte"}
          </h2>
          <p className="text-xs text-[var(--text-dim)] mb-6">
            {mode === "login"
              ? "Connectez-vous pour publier et liker des publications."
              : "Rejoignez la communauté Kilogram en quelques secondes."}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: alice@test.com"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--orange-500)] focus:ring-2 focus:ring-orange-500/20 transition placeholder-[var(--text-dim)]"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: alex_dev"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--orange-500)] focus:ring-2 focus:ring-orange-500/20 transition placeholder-[var(--text-dim)]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--orange-500)] focus:ring-2 focus:ring-orange-500/20 transition placeholder-[var(--text-dim)]"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-gradient text-xs font-semibold disabled:opacity-50"
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
