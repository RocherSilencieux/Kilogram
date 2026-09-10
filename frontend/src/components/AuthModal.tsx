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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-sketch-pop">
      <div className="sketch-card w-full max-w-md border-3 border-black shadow-[8px_8px_0px_0px_#000] bg-[var(--bg-paper)] overflow-hidden relative">
        
        {/* En-tête des Onglets Crayonnés */}
        <div className="flex border-b-2 border-black bg-[var(--bg-input)]">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-3 text-base font-extrabold font-hand transition ${
              mode === "login"
                ? "bg-[var(--omori-purple)] text-white border-b-2 border-black"
                : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
            }`}
          >
            ✏️ Connexion
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-3 text-base font-extrabold font-hand transition ${
              mode === "register"
                ? "bg-[var(--omori-red)] text-white border-b-2 border-black"
                : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
            }`}
          >
            📌 Inscription
          </button>
        </div>

        {/* Corps de la modal */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-black font-hand text-[var(--text-main)] mb-1">
              {mode === "login" ? "Bienvenue sur Kilogram ✏️" : "Créer votre fiche"}
            </h2>
            <p className="text-xs font-hand font-bold text-[var(--text-dim)]">
              {mode === "login"
                ? "Connectez-vous pour publier et liker des croquis."
                : "Rejoignez le carnet de croquis Kilogram en quelques secondes."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border-2 border-black text-rose-500 text-xs font-bold rounded-xl shadow-[2px_2px_0px_0px_#000]">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-hand text-[var(--text-main)] mb-1">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: alice@test.com"
                required
                className="w-full px-3.5 py-2 text-sm bg-[var(--bg-card)] border-2 border-black rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[var(--text-dim)] shadow-[2px_2px_0px_0px_#000]"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold font-hand text-[var(--text-main)] mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: alex_dev"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-[var(--bg-card)] border-2 border-black rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[var(--text-dim)] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold font-hand text-[var(--text-main)] mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-sm bg-[var(--bg-card)] border-2 border-black rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[var(--text-dim)] shadow-[2px_2px_0px_0px_#000]"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="sketch-btn text-xs px-3 py-1.5"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="sketch-btn sketch-btn-primary text-xs px-5 py-2 disabled:opacity-50"
              >
                {loading
                  ? "Chargement..."
                  : mode === "login"
                  ? "Se connecter ✏️"
                  : "S'inscrire ✏️"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
