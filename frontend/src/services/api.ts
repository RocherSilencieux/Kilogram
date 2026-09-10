import type { SearchProfileItem, UserPost, UserProfile } from '../types';

const API_BASE = '/api';
const DIRECT_BACKEND = 'http://localhost:3000';

// Comptes par défaut fournis dans le README du backend
const FALLBACK_USERS: Record<string, { profile: UserProfile; posts: UserPost[] }> = {
  alice: {
    profile: {
      id: 'user_alice_01',
      username: 'alice',
      email: 'alice@test.com',
      role: 'USER',
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    posts: [
      {
        id: 'post_alice_1',
        content: 'Bienvenue sur mon profil Kilogram ! Premier coucher de soleil capturé en vacances 🌅',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        authorId: 'user_alice_01',
        createdAt: '2026-09-08T14:30:00.000Z',
        likeCount: 18,
        commentCount: 3,
      },
      {
        id: 'post_alice_2',
        content: 'Un bon café pour démarrer le code du jour ☕️💻',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
        authorId: 'user_alice_01',
        createdAt: '2026-09-09T08:15:00.000Z',
        likeCount: 9,
        commentCount: 1,
      },
      {
        id: 'post_alice_3',
        content: 'Prête pour le week-end ! Petite note de lecture inspirante : "L\'art de la simplicité".',
        imageUrl: null,
        authorId: 'user_alice_01',
        createdAt: '2026-09-09T18:45:00.000Z',
        likeCount: 5,
        commentCount: 0,
      },
    ],
  },
  bob: {
    profile: {
      id: 'user_bob_02',
      username: 'bob',
      email: 'bob@test.com',
      role: 'USER',
      createdAt: '2026-09-03T12:00:00.000Z',
    },
    posts: [
      {
        id: 'post_bob_1',
        content: 'Randonnée dans les Alpes ce matin, l\'air pur fait du bien ! 🏔️',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
        authorId: 'user_bob_02',
        createdAt: '2026-09-07T11:20:00.000Z',
        likeCount: 24,
        commentCount: 4,
      },
      {
        id: 'post_bob_2',
        content: 'Nouvelle configuration de bureau terminée ! Minimaliste et sobre.',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
        authorId: 'user_bob_02',
        createdAt: '2026-09-08T16:00:00.000Z',
        likeCount: 12,
        commentCount: 2,
      },
    ],
  },
  admin: {
    profile: {
      id: 'user_admin_03',
      username: 'admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    posts: [
      {
        id: 'post_admin_1',
        content: 'Bienvenue sur Kilogram. Les serveurs sont opérationnels.',
        imageUrl: null,
        authorId: 'user_admin_03',
        createdAt: '2026-09-05T09:00:00.000Z',
        likeCount: 42,
        commentCount: 0,
      },
    ],
  },
};

/**
 * Effectue un appel API avec fallback automatique (via proxy ou directement vers http://localhost:3000)
 */
async function apiFetch<T>(endpoint: string, token?: string | null): Promise<T | null> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. Essai via le proxy Vite (/api/...)
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Échec du proxy, essai direct
  }

  // 2. Essai direct sur localhost:3000
  try {
    const res = await fetch(`${DIRECT_BACKEND}${endpoint}`, { headers });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Backend non joignable
  }

  return null;
}

/**
 * Récupère tous les profils découverts (depuis l'API backend si en ligne, sinon profils par défaut)
 */
export async function fetchAllProfiles(): Promise<{
  profiles: SearchProfileItem[];
  isBackendConnected: boolean;
}> {
  // On récupère les posts globaux pour extraire les auteurs enregistrés en BDD
  const posts = await apiFetch<Array<{ author?: { id: string; username: string }; authorId?: string }>>('/posts');

  if (posts && Array.isArray(posts)) {
    const userMap = new Map<string, SearchProfileItem>();

    // Extraire les auteurs des posts
    posts.forEach((p) => {
      if (p.author && p.author.id && p.author.username) {
        userMap.set(p.author.id, {
          id: p.author.id,
          username: p.author.username,
        });
      }
    });

    // Si on a des auteurs de la BDD, on les renvoie
    const list = Array.from(userMap.values());
    if (list.length > 0) {
      return { profiles: list, isBackendConnected: true };
    }
    return { profiles: getDefaultSearchProfiles(), isBackendConnected: true };
  }

  // Fallback si le backend n'est pas lancé
  return {
    profiles: getDefaultSearchProfiles(),
    isBackendConnected: false,
  };
}

function getDefaultSearchProfiles(): SearchProfileItem[] {
  return Object.values(FALLBACK_USERS).map((u) => ({
    id: u.profile.id,
    username: u.profile.username,
    email: u.profile.email,
    role: u.profile.role,
  }));
}

/**
 * Récupère les données publiques du profil d'un utilisateur
 */
export async function fetchUserProfile(userIdOrName: string): Promise<UserProfile | null> {
  // 0. Vérifier la présence d'une version sauvegardée localement (ex: après modification)
  try {
    const saved = localStorage.getItem(`kilogram_custom_profile_${userIdOrName}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  // 1. Appel vers GET /users/:id
  const user = await apiFetch<UserProfile>(`/users/${encodeURIComponent(userIdOrName)}`);
  if (user && user.id) {
    try {
      const saved = localStorage.getItem(`kilogram_custom_profile_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...user, ...parsed };
      }
    } catch {}
    return user;
  }

  // 2. Si pas trouvé par ID ou backend éteint, chercher dans les fallbacks (par username ou id)
  const lower = userIdOrName.toLowerCase();
  for (const key of Object.keys(FALLBACK_USERS)) {
    const fb = FALLBACK_USERS[key];
    if (fb.profile.id === userIdOrName || fb.profile.username.toLowerCase() === lower) {
      try {
        const saved = localStorage.getItem(`kilogram_custom_profile_${fb.profile.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...fb.profile, ...parsed };
        }
      } catch {}
      return fb.profile;
    }
  }

  return null;
}

/**
 * Récupère uniquement les publications du profil sélectionné
 */
export async function fetchUserPosts(userId: string, token?: string | null): Promise<UserPost[]> {
  // 1. Appel vers GET /users/:id/posts
  const posts = await apiFetch<UserPost[]>(`/users/${encodeURIComponent(userId)}/posts`, token);
  if (posts && Array.isArray(posts)) {
    return posts;
  }

  // 2. Fallback si backend éteint
  for (const key of Object.keys(FALLBACK_USERS)) {
    const fb = FALLBACK_USERS[key];
    if (fb.profile.id === userId || fb.profile.username.toLowerCase() === userId.toLowerCase()) {
      return fb.posts;
    }
  }

  return [];
}

/**
 * Supprime une publication par son ID (Auteur uniquement, vérifié côté backend)
 */
export async function deletePostApi(postId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${DIRECT_BACKEND}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur lors de la suppression du post' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Impossible de contacter le serveur' };
  }
}

/**
 * Supprime un commentaire par son ID (Auteur uniquement, vérifié côté backend)
 */
export async function deleteCommentApi(commentId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${DIRECT_BACKEND}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur lors de la suppression du commentaire' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Impossible de contacter le serveur' };
  }
}
