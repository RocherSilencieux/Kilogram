import { useState, useEffect } from 'react';
import { ProfileView } from './components/profile/ProfileView';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Appliquer le thème clair/sombre sur la balise html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="app-root">
      {/* En-tête épuré */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-logo">
            <span className="brand-name">Kilogram</span>
            <span className="brand-sub">Profil</span>
          </div>

          <button
            type="button"
            className="theme-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label="Basculer le thème"
          >
            <span className="theme-icon">{isDarkMode ? '☀️' : '🌙'}</span>
            <span className="theme-text">{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
          </button>
        </div>
      </header>

      {/* Vue Profil avec recherche et publications du profil */}
      <main className="app-main">
        <ProfileView />
      </main>
    </div>
  );
}

export default App;
