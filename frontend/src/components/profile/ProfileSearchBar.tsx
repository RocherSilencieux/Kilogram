import React, { useState, useRef, useEffect } from 'react';
import type { SearchProfileItem } from '../../types';

interface ProfileSearchBarProps {
  profiles: SearchProfileItem[];
  currentUserId: string;
  onSelectProfile: (profile: SearchProfileItem) => void;
  isLoading?: boolean;
}

const AVATAR_PALETTE = [
  ['#ddd4f5', '#1a1520'], ['#fde68a', '#3a3000'], ['#fecaca', '#3b0f0f'],
  ['#bbf7d0', '#0f2e1a'], ['#bae6fd', '#0c2333'], ['#e9d5ff', '#2d1254'],
];
function avatarStyle(username: string) {
  const idx = username.charCodeAt(0) % AVATAR_PALETTE.length;
  return { bg: AVATAR_PALETTE[idx][0], fg: AVATAR_PALETTE[idx][1] };
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Chips profils rapides */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        paddingBottom: 16,
        borderBottom: '2px dashed rgba(22,18,31,0.12)',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-caveat)',
          fontSize: 14,
          color: 'var(--ink-light)',
          flexShrink: 0,
        }}>
          Voir le carnet de :
        </span>

        {isLoading ? (
          <span style={{ fontFamily: 'var(--font-caveat)', fontSize: 13, color: 'var(--ink-light)', fontStyle: 'italic' }}>
            chargement des profils...
          </span>
        ) : (
          profiles.map((p) => {
            const active = p.id === currentUserId;
            const { bg, fg } = avatarStyle(p.username);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProfile(p)}
                title={p.email || p.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-hand)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: active ? '#fff' : 'var(--ink)',
                  background: active ? 'var(--ink-purple)' : bg,
                  border: `1.5px solid ${active ? 'var(--ink-purple)' : 'var(--ink)'}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  boxShadow: active ? '2px 2px 0 var(--ink)' : '1px 1px 0 rgba(22,18,31,0.2)',
                  transition: 'transform 0.12s ease',
                  transform: active ? 'rotate(-1deg)' : 'none',
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: active ? 'rgba(255,255,255,0.25)' : fg,
                  color: active ? '#fff' : bg,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, border: '1px solid rgba(0,0,0,0.1)',
                }}>
                  {p.username.charAt(0).toUpperCase()}
                </span>
                @{p.username}
              </button>
            );
          })
        )}
      </div>

      {/* Barre de recherche (style ligne réglée) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '2px solid var(--ink)',
        paddingBottom: 4,
        marginBottom: 4,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="var(--ink-faded)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Chercher un utilisateur par nom..."
          aria-label="Rechercher un profil"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-caveat)',
            fontSize: 16,
            color: 'var(--ink)',
            lineHeight: 'var(--line-height-ruled)',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            aria-label="Effacer"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-hand)', fontSize: 13, color: 'var(--ink-faded)',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown résultats */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 30,
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          boxShadow: '4px 4px 0 var(--ink)',
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {isLoading ? (
            <div style={{ padding: '12px 16px', fontFamily: 'var(--font-caveat)', fontSize: 14, color: 'var(--ink-faded)', fontStyle: 'italic' }}>
              Chargement...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div style={{ padding: '12px 16px', fontFamily: 'var(--font-hand)', fontSize: 13, color: 'var(--ink-faded)' }}>
              Aucun profil trouvé pour « {query} »
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {filteredProfiles.map((p) => {
                const active = p.id === currentUserId;
                const { bg, fg } = avatarStyle(p.username);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        background: active ? 'rgba(90,34,204,0.06)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px dashed rgba(22,18,31,0.1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22,18,31,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = active ? 'rgba(90,34,204,0.06)' : 'transparent')}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: bg, color: fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 14,
                        border: '1.5px solid var(--ink)', flexShrink: 0,
                      }}>
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 14, color: active ? 'var(--ink-purple)' : 'var(--ink)' }}>
                            @{p.username}
                          </span>
                          {p.role && (
                            <span style={{ fontFamily: 'var(--font-caveat)', fontSize: 11, color: 'var(--ink-faded)', border: '1px solid var(--ink-faded)', borderRadius: 2, padding: '1px 6px' }}>
                              {p.role}
                            </span>
                          )}
                          {active && (
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: 'var(--ink-purple)', fontWeight: 700 }}>
                              ← affiché
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.email || p.id}
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
