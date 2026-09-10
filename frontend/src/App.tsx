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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand & Tab Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-black text-gray-900 text-lg tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                Kilogram
              </span>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onTabChange('feed')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  currentTab === 'feed'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => onTabChange('profile')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  currentTab === 'profile'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profil
              </button>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Basculer le thème"
            >
              {isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
            </button>

            {/* Authentication Buttons / User Badge */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                  {user.username}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="text-xs font-semibold text-gray-700 hover:text-purple-600 px-3 py-1.5 rounded-lg transition"
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 px-3.5 py-1.5 rounded-lg shadow-sm transition"
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="app-main">
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
