import React, { useState, useRef, useEffect } from 'react';
import type { SearchProfileItem } from '../../types';

interface ProfileSearchBarProps {
  profiles: SearchProfileItem[];
  currentUserId: string;
  onSelectProfile: (profile: SearchProfileItem) => void;
  isLoading?: boolean;
}

export const ProfileSearchBar: React.FC<ProfileSearchBarProps> = ({
  profiles,
  currentUserId,
  onSelectProfile,
  isLoading = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les profils selon la saisie
  const filteredProfiles = profiles.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.username.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const handleSelect = (profile: SearchProfileItem) => {
    onSelectProfile(profile);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="search-bar-wrapper" ref={containerRef}>
      <div className="search-input-box">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un profil par nom ou ID..."
          className="search-input"
          aria-label="Rechercher un profil"
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setQuery('')}
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions rapides en dessous de la barre */}
      <div className="quick-profiles-row">
        <span className="quick-label">Profils disponibles :</span>
        <div className="quick-chips">
          {profiles.map((p) => {
            const isSelected = p.id === currentUserId;
            return (
              <button
                key={p.id}
                type="button"
                className={`quick-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectProfile(p)}
              >
                @{p.username}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu déroulant de résultats de recherche */}
      {isOpen && (
        <div className="search-dropdown">
          <div className="search-dropdown-header">
            <span>Résultats de recherche ({filteredProfiles.length})</span>
          </div>

          {isLoading ? (
            <div className="search-dropdown-message">Chargement des profils...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="search-dropdown-message">
              Aucun profil trouvé pour "{query}"
            </div>
          ) : (
            <ul className="search-dropdown-list">
              {filteredProfiles.map((p) => {
                const isSelected = p.id === currentUserId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`search-dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(p)}
                    >
                      <div className="search-item-avatar">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-name-row">
                          <span className="search-item-username">@{p.username}</span>
                          {p.role && <span className="search-item-role">{p.role}</span>}
                          {isSelected && <span className="search-item-active-badge">Actuel</span>}
                        </div>
                        <span className="search-item-meta">
                          {p.email || `ID: ${p.id}`}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
