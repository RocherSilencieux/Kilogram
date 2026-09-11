import { useState, useEffect } from 'react';
import './App.css';
import PostsPages from './pages/PostsPages';
import { PostDetailView } from './components/PostDetailView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

type RouteState =
  | { type: 'feed' }
  | { type: 'profile'; userId?: string }
  | { type: 'post-detail'; postId: string };

function parseCurrentRoute(): RouteState {
  const path = window.location.pathname;
  if (path.startsWith('/posts/') || path.startsWith('/post/')) {
    const postId = path.replace(/^\/(posts|post)\//, '');
    if (postId) {
      return { type: 'post-detail', postId };
    }
  }
  if (path.startsWith('/profile')) {
    const parts = path.split('/').filter(Boolean);
    const userId = parts[1];
    return { type: 'profile', userId };
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
      <nav className="site-navbar" aria-label="Navigation principale">
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo — titre du cahier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button className="brand-sketch-text" onClick={onNavigateToFeed} aria-label="Post it — Accueil">
              Post it ✏️
            </button>

            {/* Onglets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                className={`nav-tab ${isFeedActive ? 'active' : ''}`}
                onClick={onNavigateToFeed}
                role="tab" aria-selected={isFeedActive}
              >
                📜 Fil d'actualité
              </button>
              <button
                className={`nav-tab ${isProfileActive ? 'active' : ''}`}
                onClick={onNavigateToProfile}
                role="tab" aria-selected={isProfileActive}
              >
                👤 Mon profil
              </button>
            </div>
          </div>

          {/* Actions droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="nav-pill nav-pill-ghost"
              onClick={onToggleTheme}
              title={isDarkMode ? 'Mode Papier Clair' : 'Mode Black Space'}
              aria-label="Changer de thème"
            >
              {isDarkMode ? '☀️ clair' : '🌙 sombre'}
            </button>

            {isAuthenticated && user ? (
              <>
                <span style={{
                  fontFamily: 'var(--font-caveat)', fontSize: 15, color: 'rgba(240,234,255,0.7)',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4, padding: '3px 10px', letterSpacing: 0.3,
                }}>
                  @{user.username}
                </span>
                <button
                  className="nav-pill nav-pill-ghost"
                  onClick={logout}
                  style={{ color: '#ff7090', borderColor: 'rgba(255,70,100,0.4)' }}
                >
                  déconnexion
                </button>
              </>
            ) : (
              <>
                <button className="nav-pill nav-pill-ghost" onClick={() => openAuth('login')}>
                  connexion
                </button>
                <button className="nav-pill" onClick={() => openAuth('register')}>
                  inscription
                </button>
              </>
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
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('kilogram-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Synchronisation avec les boutons Précédent / Suivant
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

  const navigateToProfile = (targetUserId?: string) => {
    const newPath = targetUserId ? `/profile/${targetUserId}` : '/profile';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    setRoute({ type: 'profile', userId: targetUserId });
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
        onNavigateToProfile={() => navigateToProfile()}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="pt-6">
        {route.type === 'feed' && (
          <PostsPages onSelectPost={navigateToPost} onSelectAuthor={navigateToProfile} />
        )}
        {route.type === 'post-detail' && (
          <PostDetailView
            postId={route.postId}
            onBack={navigateToFeed}
            onNavigateToProfile={navigateToProfile}
          />
        )}
        {route.type === 'profile' && <ProfileView userId={route.userId} />}
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
