import { useState, useEffect } from 'react';
import './App.css';
import PostsPages from './pages/PostsPages';
import { ProfileView } from './components/profile/ProfileView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

interface HeaderNavProps {
  currentTab: 'feed' | 'profile';
  onTabChange: (tab: 'feed' | 'profile') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

function HeaderNav({ currentTab, onTabChange, isDarkMode, onToggleTheme }: HeaderNavProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <nav className="site-navbar">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand & Tab Navigation */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => onTabChange('feed')}
            >
              <span className="brand-gradient-text">Kilogram</span>
            </div>

            {/* Sélecteur d'onglets au style Orange & Violet */}
            <div className="nav-tabs-pill">
              <button
                type="button"
                onClick={() => onTabChange('feed')}
                className={`nav-tab-btn ${currentTab === 'feed' ? 'active' : ''}`}
              >
                Fil d'actualité
              </button>
              <button
                type="button"
                onClick={() => onTabChange('profile')}
                className={`nav-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
              >
                Profil
              </button>
            </div>
          </div>

          {/* Actions à droite : Thème et Authentification */}
          <div className="flex items-center gap-3">
            {/* Bouton de bascule de Thème (Clair / Sombre) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="theme-toggle-btn"
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Basculer le thème"
            >
              <span>{isDarkMode ? '☀️' : '🌙'}</span>
              <span>{isDarkMode ? 'Clair' : 'Sombre'}</span>
            </button>

            {/* Authentification */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)]">
                  @{user.username}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] px-3 py-1.5 rounded-lg transition"
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="btn-primary-gradient text-xs font-semibold"
                >
                  Inscription
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        key={authMode}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'feed' | 'profile'>('feed');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('kilogram-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('kilogram-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="min-h-screen">
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="py-6 px-4">
        {currentTab === 'feed' ? <PostsPages /> : <ProfileView />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
