import { useState, useEffect } from 'react';
import './App.css';
import PostsPages from './pages/PostsPages';
import { PostDetailView } from './components/PostDetailView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

type RouteState =
  | { type: 'feed' }
  | { type: 'profile' }
  | { type: 'post-detail'; postId: string };

function parseCurrentRoute(): RouteState {
  const path = window.location.pathname;
  if (path.startsWith('/posts/') || path.startsWith('/post/')) {
    const postId = path.replace(/^\/(posts|post)\//, '');
    if (postId) {
      return { type: 'post-detail', postId };
    }
  }
  if (path === '/profile') {
    return { type: 'profile' };
  }
  return { type: 'feed' };
}

interface HeaderNavProps {
  currentRoute: RouteState;
  onNavigateToFeed: () => void;
  onNavigateToProfile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

function HeaderNav({
  currentRoute,
  onNavigateToFeed,
  onNavigateToProfile,
  isDarkMode,
  onToggleTheme,
}: HeaderNavProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const isFeedActive = currentRoute.type === 'feed' || currentRoute.type === 'post-detail';
  const isProfileActive = currentRoute.type === 'profile';

  return (
    <>
      <nav className="site-navbar">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand & Tab Navigation */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={onNavigateToFeed}
            >
              <span className="brand-gradient-text">Kilogram</span>
            </div>

            {/* Sélecteur d'onglets */}
            <div className="nav-tabs-pill">
              <button
                type="button"
                onClick={onNavigateToFeed}
                className={`nav-tab-btn ${isFeedActive ? 'active' : ''}`}
              >
                Fil d'actualité
              </button>
              <button
                type="button"
                onClick={onNavigateToProfile}
                className={`nav-tab-btn ${isProfileActive ? 'active' : ''}`}
              >
                Profil
              </button>
            </div>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-3">
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
  const [route, setRoute] = useState<RouteState>(() => parseCurrentRoute());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('kilogram-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('kilogram-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Synchronisation avec les boutons Précédent / Suivant du navigateur
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToFeed = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setRoute({ type: 'feed' });
  };

  const navigateToProfile = () => {
    if (window.location.pathname !== '/profile') {
      window.history.pushState({}, '', '/profile');
    }
    setRoute({ type: 'profile' });
  };

  const navigateToPost = (postId: string) => {
    const newPath = `/posts/${postId}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    setRoute({ type: 'post-detail', postId });
  };

  return (
    <div className="min-h-screen">
      <HeaderNav
        currentRoute={route}
        onNavigateToFeed={navigateToFeed}
        onNavigateToProfile={navigateToProfile}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="py-6 px-4">
        {route.type === 'feed' && (
          <PostsPages onSelectPost={navigateToPost} />
        )}
        {route.type === 'post-detail' && (
          <PostDetailView
            postId={route.postId}
            onBack={navigateToFeed}
          />
        )}
        {route.type === 'profile' && <ProfileView />}
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
