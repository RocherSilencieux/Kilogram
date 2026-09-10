import React, { useEffect, useState } from 'react';
import type { UserPost, UserProfile } from '../../types';
import { fetchUserProfile, fetchUserPosts, deletePostApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:3000';

const AVATAR_PALETTE = [
  ['#ddd4f5', '#1a1520'], ['#fde68a', '#3a3000'], ['#fecaca', '#3b0f0f'],
  ['#bbf7d0', '#0f2e1a'], ['#bae6fd', '#0c2333'], ['#e9d5ff', '#2d1254'],
];
function avatarStyle(username: string) {
  const idx = username.charCodeAt(0) % AVATAR_PALETTE.length;
  return { bg: AVATAR_PALETTE[idx][0], fg: AVATAR_PALETTE[idx][1] };
}

function formatDate(iso?: string): string {
  if (!iso) return 'récemment';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function shortDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function relTime(iso?: string): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'à l\'instant';
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}j`;
  return shortDate(iso);
}

/* ── Skeleton d'une ligne d'entrée ─────────────────────────────────────── */
function SkeletonEntry() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--margin-col-w) 1fr', padding: '20px 0', borderBottom: '1px dashed rgba(22,18,31,0.1)' }}>
      <div />
      <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ink-line" style={{ width: '30%', height: 'var(--line-height-ruled)' }} />
        <div className="ink-line" style={{ width: '75%', height: 'var(--line-height-ruled)' }} />
        <div className="ink-line" style={{ width: '55%', height: 'var(--line-height-ruled)' }} />
      </div>
    </div>
  );
}

/* ── Entrée de post dans la liste du profil ─────────────────────────────── */
interface PostRowProps {
  post: UserPost;
  isAuthor: boolean;
  onClick: () => void;
}

function PostRow({ post, isAuthor, onClick }: PostRowProps) {
  const imgSrc = post.imageUrl
    ? post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`
    : null;
  const date = relTime(post.createdAt || post.created_at);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--margin-col-w) 1fr',
        padding: '16px 0',
        borderBottom: '1px dashed rgba(22,18,31,0.1)',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22,18,31,0.025)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Marge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingRight: 8, paddingTop: 2 }}>
        <span style={{ fontFamily: 'var(--font-caveat)', fontSize: 11, color: 'var(--ink-light)', textAlign: 'center', lineHeight: 1.3 }}>
          {date}
        </span>
        {isAuthor && (
          <span style={{
            fontFamily: 'var(--font-hand)', fontSize: 10, color: 'var(--ink-purple)',
            border: '1px solid var(--ink-purple)', borderRadius: 2, padding: '1px 4px',
            opacity: 0.7, marginTop: 2,
          }}>
            moi
          </span>
        )}
      </div>

      {/* Contenu */}
      <div style={{ paddingLeft: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {imgSrc && (
          <div style={{
            width: 64, height: 64, flexShrink: 0,
            background: '#fff',
            border: '1.5px solid var(--ink)',
            padding: 3,
            boxShadow: '2px 2px 0 var(--ink)',
            transform: `rotate(${post.id.charCodeAt(0) % 2 === 0 ? -2 : 1.5}deg)`,
            flexGrow: 0,
          }}>
            <img src={imgSrc} alt={post.content} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          </div>
        )}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 'var(--line-height-ruled)',
          color: 'var(--ink)',
          flex: 1,
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
        }}>
          {post.content}
        </p>
      </div>
    </div>
  );
}

/* ── Modal détail d'un post du profil ──────────────────────────────────── */
interface PostModalProps {
  post: UserPost;
  isAuthor: boolean;
  onClose: () => void;
  onDelete: () => void;
}

function PostModal({ post, isAuthor, onClose, onDelete }: PostModalProps) {
  const imgSrc = post.imageUrl
    ? post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`
    : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10,8,20,0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          borderRadius: 8,
          boxShadow: '8px 8px 0 var(--ink)',
          maxWidth: 520,
          width: '100%',
          overflow: 'hidden',
          animation: 'sketchPop 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        {/* En-tête modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1.5px dashed rgba(22,18,31,0.15)',
          background: 'rgba(22,18,31,0.03)',
        }}>
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: 15, fontWeight: 700, color: 'var(--ink-purple)' }}>
            entrée du carnet
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAuthor && (
              <button
                type="button"
                onClick={onDelete}
                style={{
                  fontFamily: 'var(--font-hand)', fontSize: 12, fontWeight: 700,
                  color: '#fff', background: 'var(--ink-red)',
                  border: '1.5px solid var(--ink)', borderRadius: 4,
                  padding: '4px 12px', cursor: 'pointer',
                  boxShadow: '2px 2px 0 var(--ink)',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(-1deg)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
              >
                🗑 supprimer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: 'var(--font-hand)', fontSize: 13, fontWeight: 700,
                color: 'var(--ink-faded)', background: 'none',
                border: '1.5px solid var(--ink-faded)', borderRadius: 4,
                padding: '4px 10px', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image polaroïd */}
        {imgSrc && (
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#fff',
              padding: '8px 8px 36px',
              border: '1px solid rgba(22,18,31,0.15)',
              boxShadow: '4px 4px 12px rgba(22,18,31,0.25)',
              transform: 'rotate(-1.5deg)',
              maxWidth: 380,
              width: '100%',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                width: 48, height: 16, background: 'rgba(255,235,130,0.7)',
                border: '1px solid rgba(200,170,50,0.3)', borderRadius: 2,
              }} />
              <img src={imgSrc} alt={post.content} style={{ display: 'block', width: '100%', maxHeight: 300, objectFit: 'cover' }} />
            </div>
          </div>
        )}

        {/* Texte */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 15,
            lineHeight: 'var(--line-height-ruled)', color: 'var(--ink)',
            margin: 0, marginBottom: 12,
          }}>
            {post.content}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-caveat)', fontSize: 13, color: 'var(--ink-light)' }}>
              {formatDate(post.createdAt || post.created_at)}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-light)',
              border: '1px solid var(--ink-light)', borderRadius: 2, padding: '1px 6px',
            }}>
              #{String(post.id).slice(0, 8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ProfileView Principal ──────────────────────────────────────────────── */
interface ProfileViewProps {
  userId?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const { user, token, login } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);
  
  // Défaut : Grille en premier
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Édition des infos perso
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const targetUserId = userId || user?.id || 'user_alice';

  useEffect(() => {
    let mounted = true;
    setIsLoadingUser(true);
    setIsEditing(false);

    async function load() {
      const [profileData, postsData] = await Promise.all([
        fetchUserProfile(targetUserId),
        fetchUserPosts(targetUserId),
      ]);
      if (!mounted) return;

      if (profileData) {
        setUserProfile(profileData);
        setIsBackendConnected(true);
      } else {
        const cleanName = targetUserId.replace(/^user_/, '');
        setUserProfile({
          id: targetUserId,
          username: cleanName || 'utilisateur',
          email: `${cleanName || 'user'}@kilogram.app`,
          role: cleanName === 'admin' ? 'ADMIN' : 'USER',
          bio: 'Esquisseur passionné dans le carnet Kilogram ✏️',
          createdAt: new Date().toISOString(),
        });
        setIsBackendConnected(false);
      }
      setUserPosts(postsData);
      setIsLoadingUser(false);
    }

    load();
    return () => { mounted = false; };
  }, [targetUserId]);

  const handleDeletePost = async (postId: string) => {
    if (!userProfile) return;
    const isAuthor = Boolean(user && (user.id === userProfile.id || user.username === userProfile.username));
    if (!isAuthor) { alert("Seul l'auteur peut supprimer."); return; }
    if (!window.confirm('Supprimer cette entrée du carnet ? Action irréversible.')) return;
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    setSelectedPost(null);
    if (token) {
      const res = await deletePostApi(postId, token);
      if (!res.success) alert(res.error || 'Erreur lors de la suppression.');
    }
  };

  const isViewingOwnProfile = Boolean(
    user && userProfile && (user.id === userProfile.id || user.username === userProfile.username)
  );

  const startEditing = () => {
    if (!userProfile) return;
    setEditUsername(userProfile.username);
    setEditEmail(userProfile.email);
    setEditBio(userProfile.bio || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    const updatedName = editUsername.trim() || userProfile.username;
    const updatedEmail = editEmail.trim() || userProfile.email;
    const updatedBio = editBio.trim();

    const updatedProfile: UserProfile = {
      ...userProfile,
      username: updatedName,
      email: updatedEmail,
      bio: updatedBio,
    };

    // 1. Sauvegarder dans le localStorage sous toutes les clés identifiantes
    localStorage.setItem(`kilogram_custom_profile_${userProfile.id}`, JSON.stringify(updatedProfile));
    localStorage.setItem(`kilogram_custom_profile_${targetUserId}`, JSON.stringify(updatedProfile));
    localStorage.setItem(`kilogram_custom_profile_${updatedName.toLowerCase()}`, JSON.stringify(updatedProfile));

    // 2. Mettre à jour l'utilisateur connecté dans AuthContext si c'est son propre profil
    if (user && (user.id === userProfile.id || user.username === userProfile.username)) {
      const updatedUser = { ...user, username: updatedName, email: updatedEmail };
      if (login) login(token || 'demo-token', updatedUser);
    }

    // 3. Appel backend si connecté
    if (token) {
      try {
        await fetch(`${API_URL}/users/${userProfile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: updatedName, email: updatedEmail, bio: updatedBio }),
        });
      } catch {}
    }

    setUserProfile(updatedProfile);
    setIsEditing(false);
    showToast("Fiche personnage enregistrée et sauvegardée ! ✏️");
  };

  const { bg: avatarBg, fg: avatarFg } = userProfile ? avatarStyle(userProfile.username) : { bg: '#e0e0e0', fg: '#333' };

  /* ── Rendu ── */
  return (
    <>
      {/* Toast */}
      {toast && <div className="toast-note">{toast}</div>}

      {/* Modal post sélectionné */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isAuthor={isViewingOwnProfile}
          onClose={() => setSelectedPost(null)}
          onDelete={() => handleDeletePost(selectedPost.id)}
        />
      )}

      <div className="notebook-page">

        {/* ── Fiche personnage ── */}
        {isLoadingUser ? (
          <>
            <SkeletonEntry />
            <SkeletonEntry />
          </>
        ) : userProfile ? (
          <>
            {/* Fiche de personnage mise en avant (Carte collée style OMORI) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'var(--margin-col-w) 1fr',
              padding: 'calc(var(--line-height-ruled) * 1) 0 calc(var(--line-height-ruled) * 1.5)',
              borderBottom: '2px solid rgba(22,18,31,0.15)',
              marginBottom: 'calc(var(--line-height-ruled) * 0.5)',
            }}>
              {/* Marge avec avatar et compteur */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingRight: 10, paddingTop: 6 }}>
                {/* Grand avatar */}
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: avatarBg, color: avatarFg,
                  border: '2.5px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-hand)', fontWeight: 900, fontSize: 24,
                  boxShadow: '3px 4px 0 var(--ink)',
                  flexShrink: 0,
                  transform: 'rotate(-2deg)',
                }}>
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>

                {/* Compteur posts */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>
                    {userPosts.length}
                  </div>
                  <div style={{ fontFamily: 'var(--font-caveat)', fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.2 }}>
                    croquis
                  </div>
                </div>

                {/* Badge "moi" */}
                {isViewingOwnProfile && (
                  <span style={{
                    fontFamily: 'var(--font-hand)', fontSize: 11, fontWeight: 700,
                    color: '#fff', background: 'var(--ink-purple)',
                    border: '1.5px solid var(--ink)',
                    borderRadius: 3, padding: '1px 6px',
                    boxShadow: '1.5px 1.5px 0 var(--ink)',
                  }}>
                    ★ moi
                  </span>
                )}
              </div>

              {/* Fiche identité (Encadré mis en avant) */}
              <div style={{ paddingLeft: 14 }}>
                <div style={{
                  background: '#fff',
                  border: '2px solid var(--ink)',
                  borderRadius: 8,
                  padding: '16px 20px',
                  boxShadow: '4px 4px 0 var(--ink)',
                  position: 'relative',
                  transform: 'rotate(-0.4deg)',
                }}>
                  {/* Scotch d'angle */}
                  <div style={{
                    position: 'absolute', top: -10, left: 24,
                    width: 48, height: 16, background: 'rgba(255,235,130,0.75)',
                    border: '1px solid rgba(200,170,50,0.3)', borderRadius: 2,
                    transform: 'rotate(-2deg)',
                  }} />

                  {/* En-tête fiche : Nom + Role + Bouton Éditer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-hand)', fontWeight: 900, fontSize: 24,
                        color: 'var(--ink-purple)', lineHeight: 1.1,
                      }}>
                        @{userProfile.username}
                      </span>
                      {userProfile.role && (
                        <span style={{
                          fontFamily: 'var(--font-caveat)', fontSize: 12, fontWeight: 700,
                          color: userProfile.role === 'ADMIN' ? '#fff' : 'var(--ink-faded)',
                          background: userProfile.role === 'ADMIN' ? 'var(--ink-purple)' : 'transparent',
                          border: `1.5px solid ${userProfile.role === 'ADMIN' ? 'var(--ink-purple)' : 'var(--ink-faded)'}`,
                          borderRadius: 3, padding: '1px 8px',
                        }}>
                          {userProfile.role}
                        </span>
                      )}
                    </div>

                    {/* Bouton Éditer visible uniquement par le propriétaire */}
                    {isViewingOwnProfile && !isEditing && (
                      <button
                        type="button"
                        onClick={startEditing}
                        style={{
                          fontFamily: 'var(--font-hand)', fontSize: 13, fontWeight: 700,
                          color: 'var(--ink)', background: 'var(--paper)',
                          border: '1.5px solid var(--ink)', borderRadius: 4,
                          padding: '4px 12px', cursor: 'pointer',
                          boxShadow: '2px 2px 0 var(--ink)',
                          transition: 'transform 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04) rotate(-1deg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                      >
                        ✏️ modifier mes infos
                      </button>
                    )}
                  </div>

                  {/* Mode Édition pour l'utilisateur connecté */}
                  {isEditing && isViewingOwnProfile ? (
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-hand)', fontSize: 12, color: 'var(--ink-light)', marginBottom: 2 }}>
                          Nom d'utilisateur :
                        </label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          style={{
                            width: '100%', fontFamily: 'var(--font-hand)', fontSize: 15,
                            padding: '6px 10px', border: '1.5px solid var(--ink)',
                            borderRadius: 4, background: 'var(--paper)', color: 'var(--ink)',
                            boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-hand)', fontSize: 12, color: 'var(--ink-light)', marginBottom: 2 }}>
                          Adresse e-mail :
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          style={{
                            width: '100%', fontFamily: 'var(--font-hand)', fontSize: 15,
                            padding: '6px 10px', border: '1.5px solid var(--ink)',
                            borderRadius: 4, background: 'var(--paper)', color: 'var(--ink)',
                            boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-hand)', fontSize: 12, color: 'var(--ink-light)', marginBottom: 2 }}>
                          Bio / Note de présentation :
                        </label>
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          rows={2}
                          placeholder="Parlez-nous de vous..."
                          style={{
                            width: '100%', fontFamily: 'var(--font-body)', fontSize: 14,
                            padding: '6px 10px', border: '1.5px solid var(--ink)',
                            borderRadius: 4, background: 'var(--paper)', color: 'var(--ink)',
                            boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                            resize: 'vertical',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          style={{
                            fontFamily: 'var(--font-hand)', fontSize: 13, fontWeight: 700,
                            color: 'var(--ink-faded)', background: 'none',
                            border: '1.5px solid var(--ink-faded)', borderRadius: 4,
                            padding: '5px 12px', cursor: 'pointer',
                          }}
                        >
                          ✕ Annuler
                        </button>
                        <button
                          type="submit"
                          style={{
                            fontFamily: 'var(--font-hand)', fontSize: 13, fontWeight: 700,
                            color: '#fff', background: 'var(--ink-purple)',
                            border: '1.5px solid var(--ink)', borderRadius: 4,
                            padding: '5px 16px', cursor: 'pointer',
                            boxShadow: '2px 2px 0 var(--ink)',
                          }}
                        >
                          💾 Enregistrer
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Mode Affichage classique */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Email */}
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ opacity: 0.6 }}>✉️</span> {userProfile.email}
                      </div>

                      {/* Bio */}
                      <div style={{
                        fontFamily: 'var(--font-hand)', fontSize: 15, color: 'var(--ink-purple)',
                        fontStyle: 'italic', background: 'rgba(22,18,31,0.03)',
                        padding: '6px 10px', borderRadius: 4, borderLeft: '3px solid var(--ink-purple)',
                        margin: '4px 0',
                      }}>
                        "{userProfile.bio || 'Aucune description rédigée.'}"
                      </div>

                      {/* Inscription & Serveur */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: 'var(--font-caveat)', fontSize: 13, color: 'var(--ink-light)' }}>
                          🗓️ Membre depuis le {formatDate(userProfile.createdAt)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: isBackendConnected ? '#34d399' : '#fbbf24',
                            border: '1px solid rgba(22,18,31,0.3)',
                            display: 'inline-block',
                          }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-light)' }}>
                            {isBackendConnected ? 'live' : 'mode démo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Titre de section & Switcher de vue (GRILLE premier, LISTE deuxième) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'var(--margin-col-w) 1fr',
              paddingBottom: 'calc(var(--line-height-ruled) * 0.5)',
              borderBottom: '1.5px solid rgba(22,18,31,0.12)',
            }}>
              <div />
              <div style={{ paddingLeft: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{
                  fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 16,
                  color: 'var(--ink)', lineHeight: 'var(--line-height-ruled)', margin: 0,
                }}>
                  Carnet de @{userProfile.username}
                </h2>

                {/* Switcher grille (défaut) / liste */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['grid', 'list'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setViewMode(m)}
                      style={{
                        fontFamily: 'var(--font-caveat)', fontSize: 13, fontWeight: 700,
                        color: viewMode === m ? '#fff' : 'var(--ink-light)',
                        background: viewMode === m ? 'var(--ink-purple)' : 'none',
                        border: '1.5px solid',
                        borderColor: viewMode === m ? 'var(--ink-purple)' : 'var(--ink-light)',
                        borderRadius: 4, padding: '2px 10px', cursor: 'pointer',
                        boxShadow: viewMode === m ? '2px 2px 0 var(--ink)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {m === 'grid' ? '⊞ grille' : '≡ liste'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Posts (Grille par défaut, Liste en second) ── */}
            {userPosts.length === 0 ? (
              <div style={{
                display: 'grid', gridTemplateColumns: 'var(--margin-col-w) 1fr',
                padding: 'calc(var(--line-height-ruled) * 3) 0',
              }}>
                <div />
                <div style={{ paddingLeft: 18 }}>
                  <p style={{ fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink-light)', fontStyle: 'italic' }}>
                    Aucune entrée dans ce carnet pour l'instant...
                  </p>
                  <p style={{ fontFamily: 'var(--font-caveat)', fontSize: 14, color: 'var(--ink-light)', marginTop: 4 }}>
                    Les premiers croquis apparaîtront ici. ✏️
                  </p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* Vue grille — polaroïds (Option par défaut) */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'var(--margin-col-w) 1fr',
              }}>
                <div />
                <div style={{
                  paddingLeft: 18,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 24,
                  paddingTop: 'calc(var(--line-height-ruled) * 1)',
                  paddingBottom: 'calc(var(--line-height-ruled) * 1)',
                }}>
                  {userPosts.map((post, idx) => {
                    const imgSrc = post.imageUrl
                      ? post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`
                      : null;
                    const rot = idx % 3 === 0 ? '-2.5deg' : idx % 3 === 1 ? '1.8deg' : '-1deg';

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        style={{
                          cursor: 'pointer',
                          background: '#fff',
                          padding: '6px 6px 32px',
                          border: '1px solid rgba(22,18,31,0.15)',
                          boxShadow: '3px 4px 10px rgba(22,18,31,0.2)',
                          transform: `rotate(${rot})`,
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.05)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '6px 8px 20px rgba(22,18,31,0.35)';
                          (e.currentTarget as HTMLDivElement).style.zIndex = '5';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot})`;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '3px 4px 10px rgba(22,18,31,0.2)';
                          (e.currentTarget as HTMLDivElement).style.zIndex = '1';
                        }}
                      >
                        {/* Scotch */}
                        <div style={{
                          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                          width: 42, height: 14, background: 'rgba(255,235,130,0.7)',
                          border: '1px solid rgba(200,170,50,0.3)', borderRadius: 2,
                        }} />

                        {imgSrc ? (
                          <img
                            src={imgSrc} alt={post.content} loading="lazy"
                            style={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', aspectRatio: '1',
                            background: '#f0ece0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 8,
                          }}>
                            <p style={{
                              fontFamily: 'var(--font-hand)', fontSize: 12, color: '#555',
                              textAlign: 'center', lineHeight: 1.4,
                              overflow: 'hidden', display: '-webkit-box',
                              WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as any,
                            }}>
                              "{post.content}"
                            </p>
                          </div>
                        )}

                        {/* Légende */}
                        <div style={{
                          position: 'absolute', bottom: 5, left: 0, right: 0,
                          textAlign: 'center', fontFamily: 'var(--font-hand)',
                          fontSize: 10, color: '#666',
                          overflow: 'hidden', whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis', padding: '0 6px',
                        }}>
                          {shortDate(post.createdAt || post.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Vue liste — entrées journal (Option secondaire) */
              userPosts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  isAuthor={isViewingOwnProfile}
                  onClick={() => setSelectedPost(post)}
                />
              ))
            )}
          </>
        ) : (
          <div style={{ padding: 'calc(var(--line-height-ruled) * 3) calc(var(--margin-col-w) + 18px)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink-red)' }}>
              Profil introuvable.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

