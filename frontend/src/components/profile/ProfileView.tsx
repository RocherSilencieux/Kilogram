import React, { useEffect, useState } from 'react';
import type { SearchProfileItem, UserPost, UserProfile } from '../../types';
import {
  fetchAllProfiles,
  fetchUserProfile,
  fetchUserPosts,
} from '../../services/api';
import { ProfileSearchBar } from './ProfileSearchBar';

export const ProfileView: React.FC = () => {
  const [profiles, setProfiles] = useState<SearchProfileItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);

  // 1. Découverte initiale des profils
  useEffect(() => {
    let isMounted = true;

    async function initProfiles() {
      setIsLoadingProfiles(true);
      const { profiles: discoveredProfiles, isBackendConnected: connected } =
        await fetchAllProfiles();

      if (!isMounted) return;

      setProfiles(discoveredProfiles);
      setIsBackendConnected(connected);
      setIsLoadingProfiles(false);

      if (discoveredProfiles.length > 0) {
        setSelectedUserId(discoveredProfiles[0].id);
      }
    }

    initProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Chargement des données du profil sélectionné et de ses publications
  useEffect(() => {
    if (!selectedUserId) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoadingUser(true);
      }
    });

    async function loadUser() {
      const [profileData, postsData] = await Promise.all([
        fetchUserProfile(selectedUserId),
        fetchUserPosts(selectedUserId),
      ]);

      if (!isMounted) return;

      if (profileData) {
        setUserProfile(profileData);
      } else {
        // Fallback avec les données partielles de la recherche
        const currentItem = profiles.find((p) => p.id === selectedUserId);
        setUserProfile({
          id: selectedUserId,
          username: currentItem?.username || 'utilisateur',
          email: currentItem?.email || `${currentItem?.username || 'user'}@kilogram.app`,
          role: currentItem?.role || 'USER',
          createdAt: new Date().toISOString(),
        });
      }

      setUserPosts(postsData);
      setIsLoadingUser(false);
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [selectedUserId, profiles]);

  // Formater la date en français
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Récemment';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleSelectProfile = (profile: SearchProfileItem) => {
    setSelectedUserId(profile.id);
  };

  return (
    <div className="profile-container">
      {/* Barre de statut du Backend */}
      <div className="status-banner">
        <div className="status-indicator">
          <span className={`status-dot ${isBackendConnected ? 'connected' : 'offline'}`} />
          <span className="status-text">
            {isBackendConnected
              ? 'Connecté à l\'API backend (SQLite sur http://localhost:3000)'
              : 'Serveur backend inactif (Mode démonstration avec profils de test)'}
          </span>
        </div>
      </div>

      {/* Barre de recherche pour les profils */}
      <section className="search-section" aria-label="Recherche de profils">
        <ProfileSearchBar
          profiles={profiles}
          currentUserId={selectedUserId}
          onSelectProfile={handleSelectProfile}
          isLoading={isLoadingProfiles}
        />
      </section>

      {/* Détails du profil et ses publications */}
      {isLoadingUser ? (
        <div className="profile-loading-box">
          <div className="loading-spinner" />
          <p>Chargement du profil et de ses publications...</p>
        </div>
      ) : userProfile ? (
        <>
          {/* En-tête du profil */}
          <header className="profile-card-header">
            <div className="profile-avatar">
              {userProfile.username.charAt(0).toUpperCase()}
            </div>

            <div className="profile-header-info">
              <div className="profile-title-line">
                <h1 className="profile-username">@{userProfile.username}</h1>
                {userProfile.role && (
                  <span className="profile-role-badge">{userProfile.role}</span>
                )}
              </div>

              <div className="profile-meta-list">
                <div className="profile-meta-entry">
                  <span className="meta-label">ID utilisateur :</span>
                  <code className="meta-code">{userProfile.id}</code>
                </div>

                <div className="profile-meta-entry">
                  <span className="meta-label">Email :</span>
                  <span className="meta-value">{userProfile.email}</span>
                </div>

                <div className="profile-meta-entry">
                  <span className="meta-label">Inscrit le :</span>
                  <span className="meta-value">{formatDate(userProfile.createdAt)}</span>
                </div>
              </div>

              {/* Compteur de publications du profil */}
              <div className="profile-stats-bar">
                <span className="stats-number">{userPosts.length}</span>
                <span className="stats-label">
                  {userPosts.length > 1 ? 'publications' : 'publication'}
                </span>
              </div>
            </div>
          </header>

          <hr className="profile-separator" />

          {/* Uniquement les publications de ce profil */}
          <section className="profile-posts-area">
            <div className="posts-header-row">
              <h2 className="posts-heading">Publications de @{userProfile.username}</h2>
            </div>

            {userPosts.length === 0 ? (
              <div className="profile-empty-posts">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="empty-icon"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="empty-title">Aucune publication pour ce profil</p>
                <p className="empty-sub">
                  Cet utilisateur n'a pas encore partagé de photos ou de messages.
                </p>
              </div>
            ) : (
              <div className="posts-grid">
                {userPosts.map((post) => {
                  const hasImage = Boolean(post.imageUrl);
                  const imageSrc = post.imageUrl?.startsWith('http')
                    ? post.imageUrl
                    : post.imageUrl
                    ? `http://localhost:3000${post.imageUrl}`
                    : null;

                  return (
                    <article
                      key={post.id}
                      className={`post-grid-item ${hasImage ? 'has-image' : 'text-only'}`}
                      onClick={() => setSelectedPost(post)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Publication: ${post.content.slice(0, 40)}`}
                    >
                      {hasImage && imageSrc ? (
                        <>
                          <img
                            src={imageSrc}
                            alt={post.content}
                            className="post-thumbnail"
                            loading="lazy"
                            onError={(e) => {
                              // Masquer l'image si le fichier uploads n'existe pas localement
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="post-overlay">
                            <p className="post-overlay-caption">{post.content}</p>
                            <span className="post-overlay-date">
                              {formatDate(post.createdAt || post.created_at)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="post-text-card">
                          <p className="post-quote-content">“{post.content}”</p>
                          <span className="post-date-tag">
                            {formatDate(post.createdAt || post.created_at)}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="profile-empty-posts">
          <p>Profil introuvable.</p>
        </div>
      )}

      {/* Modal de détail d'une publication au clic */}
      {selectedPost && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedPost(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <span className="modal-title">Détail de la publication</span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedPost(null)}
                aria-label="Fermer la modal"
              >
                ✕
              </button>
            </header>

            <div className="modal-content">
              {selectedPost.imageUrl && (
                <img
                  src={
                    selectedPost.imageUrl.startsWith('http')
                      ? selectedPost.imageUrl
                      : `http://localhost:3000${selectedPost.imageUrl}`
                  }
                  alt={selectedPost.content}
                  className="modal-image"
                />
              )}
              <div className="modal-text-box">
                <p className="modal-caption">{selectedPost.content}</p>
                <div className="modal-meta-row">
                  <span>Publié le : {formatDate(selectedPost.createdAt || selectedPost.created_at)}</span>
                  <span>ID : {selectedPost.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
