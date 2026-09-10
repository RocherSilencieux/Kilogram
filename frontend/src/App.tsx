import { useState } from 'react';
import './App.css';
import PostsPages from './pages/PostsPages';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

function HeaderNav() {
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
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-gray-900 text-lg tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              Kilogram
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                  {user.username}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="text-xs font-semibold text-gray-700 hover:text-purple-600 px-3 py-1.5 rounded-lg transition"
                >
                  Connexion
                </button>
                <button
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
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav />
      <PostsPages />
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
