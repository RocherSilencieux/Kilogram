import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 15;

export interface Author {
    id: string;
    username: string;
}

export interface CommentItem {
    id: string;
    content: string;
    authorName: string;
    authorId?: string;
    createdAt: string;
}


export interface Post {
    id: string;
    content: string;
    imageUrl: string | null;
    created_at: string;
    author: Author | null;
    likeCount: number;
    commentCount: number;
    comments?: CommentItem[];
}



// Publications riches pour le fil d'actualité
export const DEMO_FEED_POSTS: Post[] = [
    {
        id: "demo_post_1",
        content: "Magnifique coucher de soleil sur la plage ce soir ! Les reflets orange et violet sont juste magiques. #SunsetVibes #Kilogram #Ocean",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        author: { id: "user_alice", username: "alice" },
        likeCount: 42,
        commentCount: 3,
        comments: [
            {
                id: "c_1",
                content: "Les couleurs sont splendides ! Prise avec quel appareil ?",
                authorName: "bob",
                createdAt: "Il y a 10 min",
            },
            {
                id: "c_2",
                content: "Superbe cadrage Alice 👏",
                authorName: "admin",
                createdAt: "Il y a 5 min",
            },
        ],
    },
    {
        id: "demo_post_2",
        content: "Un bon café pour démarrer le code du jour ! Tout est prêt pour tester le nouveau fil d'actualité sur Kilogram. Qu'en pensez-vous ? ☕💻 #DevLife #DesignSystem",
        imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        author: { id: "user_bob", username: "bob" },
        likeCount: 28,
        commentCount: 2,
        comments: [
            {
                id: "c_3",
                content: "La DA en orange et violet est sublime !",
                authorName: "alice",
                createdAt: "Il y a 30 min",
            },
        ],
    },
    {
        id: "demo_post_3",
        content: "Randonnée au sommet des Alpes ce week-end. Vue imprenable au-dessus d'une mer de nuages. Moment de pure sérénité 🏔️✨ #Montagne #Nature #Outdoor",
        imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        author: { id: "user_bob", username: "bob" },
        likeCount: 67,
        commentCount: 4,
        comments: [
            {
                id: "c_4",
                content: "Impressionnant ! Quel sommet ?",
                authorName: "sophie",
                createdAt: "Il y a 2 h",
            },
        ],
    },
    {
        id: "demo_post_4",
        content: "Bienvenue à tous sur Kilogram ! Nouveau design Sunset Cyber en orange et violet disponible en thème sombre et clair. Découvrez les nouvelles fonctionnalités du profil et du fil d'actualité. #Kilogram2026 #Update",
        imageUrl: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        author: { id: "user_admin", username: "admin" },
        likeCount: 114,
        commentCount: 6,
        comments: [],
    },
];

// Tri décroissant
function sortPostsDescending(postsList: Post[]): Post[] {
    return [...postsList].sort((a, b) => {
        const timeA = new Date(a.created_at || (a as any).createdAt || 0).getTime() || 0;
        const timeB = new Date(b.created_at || (b as any).createdAt || 0).getTime() || 0;
        return timeB - timeA;
    });
}

function formatDateRelative(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffInSeconds)) return "Récemment";
    if (diffInSeconds < 60) return "À l'instant";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} j`;

    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

const MAX_CONTENT_LENGTH = 280;

export default function PostsPages({ onSelectPost }: { onSelectPost?: (postId: string) => void }) {
    const { token, user } = useAuth();

    // Publications
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
    const [filterMode, setFilterMode] = useState<"all" | "trending" | "photos">("all");
    const [page, setPage] = useState<number>(1);

    // États du système
    const [loading, setLoading] = useState<boolean>(true);
    const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    // Formulaire de publication
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Interactions utilisateur locales
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set(["demo_post_1"]));
    const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null);

    // Visualiseur d'image
    const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 2800);
    };

    // Normalisation des publications
    const normalizePosts = (data: any[]): Post[] => {
        return data.map((p) => ({
            id: String(p.id),
            content: p.content || "",
            imageUrl: p.imageUrl || null,
            created_at: p.created_at || p.createdAt || new Date().toISOString(),
            author: p.author || (p.authorId ? { id: p.authorId, username: "utilisateur" } : { id: "anon", username: "Anonyme" }),
            likeCount: typeof p.likeCount === "number" ? p.likeCount : (Array.isArray(p.likes) ? p.likes.length : 0),
            commentCount: typeof p.commentCount === "number" ? p.commentCount : (Array.isArray(p.comments) ? p.comments.length : 0),
            comments: Array.isArray(p.comments)
                ? p.comments.map((c: any) => ({
                      id: String(c.id),
                      content: c.content,
                      authorName: c.author?.username || "utilisateur",
                      createdAt: formatDateRelative(c.createdAt || c.created_at),
                  }))
                : [],
        }));
    };

    // Chargement résilient
    const fetchPosts = useCallback(async (isSilent = false) => {
        if (isSilent) setRefreshing(true);
        else setLoading(true);

        let liveData: Post[] | null = null;
        let connected = false;

        try {
            const res = await fetch("/api/posts");
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json) && json.length > 0) {
                    liveData = normalizePosts(json);
                    connected = true;
                }
            }
        } catch {
            // Ignoré
        }

        if (!liveData) {
            try {
                const res = await fetch(`${API_URL}/posts`);
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json) && json.length > 0) {
                        liveData = normalizePosts(json);
                        connected = true;
                    }
                }
            } catch {
                // Ignoré
            }
        }

        setIsDbConnected(connected);

        const chosenPosts = liveData && liveData.length > 0 ? liveData : DEMO_FEED_POSTS;
        const sorted = sortPostsDescending(chosenPosts);
        setAllPosts(sorted);
        setDisplayedPosts(sorted.slice(0, PAGE_SIZE));
        setPage(1);

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Filtrage dynamique
    const filteredPosts = displayedPosts.filter((post) => {
        if (filterMode === "photos") return Boolean(post.imageUrl);
        if (filterMode === "trending") return post.likeCount >= 30;
        return true;
    });

    const hasMore = displayedPosts.length < allPosts.length;

    // Pagination
    const loadNextPage = useCallback(() => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        setTimeout(() => {
            const nextIndex = page * PAGE_SIZE;
            const nextBatch = allPosts.slice(nextIndex, nextIndex + PAGE_SIZE);
            setDisplayedPosts((prev) => [...prev, ...nextBatch]);
            setPage((prev) => prev + 1);
            setLoadingMore(false);
        }, 150);
    }, [loadingMore, hasMore, page, allPosts]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadNextPage();
                }
            },
            { rootMargin: "250px", threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, loadNextPage]);

    // Gestion de l'image du post
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("L'image ne doit pas dépasser 5 Mo");
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Insertion d'émoji dans le texte
    const insertEmoji = (emoji: string) => {
        setContent((prev) => `${prev} ${emoji}`);
    };

    // Création d'un post
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = content.trim();
        if (!text) return;

        setSubmitting(true);

        // Essai via API si token présent
        if (token && isDbConnected) {
            try {
                const formData = new FormData();
                formData.append("content", text);
                if (imageFile) formData.append("image", imageFile);

                const res = await fetch(`${API_URL}/posts`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (res.ok) {
                    const raw = await res.json();
                    const newP: Post = {
                        id: String(raw.id),
                        content: raw.content,
                        imageUrl: raw.imageUrl,
                        created_at: raw.createdAt || new Date().toISOString(),
                        author: raw.author || { id: user?.id || "u", username: user?.username || "moi" },
                        likeCount: 0,
                        commentCount: 0,
                        comments: [],
                    };
                    setAllPosts((prev) => [newP, ...prev]);
                    setDisplayedPosts((prev) => [newP, ...prev]);
                    handleRemoveImage();
                    setContent("");
                    showToast("Publication partagée avec succès !");
                    setSubmitting(false);
                    return;
                }
            } catch {
                // Fallback local
            }
        }

        // Création locale immédiate
        const localPost: Post = {
            id: `post_local_${Date.now()}`,
            content: text,
            imageUrl: imagePreview,
            created_at: new Date().toISOString(),
            author: { id: user?.id || "me", username: user?.username || "moi" },
            likeCount: 1,
            commentCount: 0,
            comments: [],
        };

        setAllPosts((prev) => [localPost, ...prev]);
        setDisplayedPosts((prev) => [localPost, ...prev]);
        setLikedPostIds((prev) => new Set(prev).add(localPost.id));
        handleRemoveImage();
        setContent("");
        setSubmitting(false);
        showToast("Publication créée en direct !");
    };

    const updatePostState = (postId: string, updater: (p: Post) => Post) => {
        setAllPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
        setDisplayedPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    };

    // Like / Unlike avec animation
    const toggleLike = (postId: string) => {
        const isLiked = likedPostIds.has(postId);
        setLikedPostIds((prev) => {
            const next = new Set(prev);
            if (isLiked) next.delete(postId);
            else next.add(postId);
            return next;
        });

        updatePostState(postId, (p) => ({
            ...p,
            likeCount: isLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
        }));

        if (token && isDbConnected) {
            fetch(`${API_URL}/posts/${postId}/like`, {
                method: isLiked ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
        }
    };

    // Double-clic sur photo = Like avec popup coeur
    const handleDoubleTapPhoto = (postId: string) => {
        if (!likedPostIds.has(postId)) {
            toggleLike(postId);
        }
        setHeartBurstPostId(postId);
        setTimeout(() => {
            setHeartBurstPostId(null);
        }, 850);
    };

    // Bookmark / Sauvegarder
    const toggleSave = (postId: string) => {
        const isSaved = savedPostIds.has(postId);
        setSavedPostIds((prev) => {
            const next = new Set(prev);
            if (isSaved) next.delete(postId);
            else next.add(postId);
            return next;
        });
        showToast(isSaved ? "Publication retirée de vos favoris" : "Publication enregistrée dans vos favoris !");
    };

    // Partager
    const handleShare = (_post: Post) => {
        navigator.clipboard?.writeText(window.location.href);
        showToast("Lien de la publication copié dans le presse-papier !");
    };

    // Ouverture et rafraîchissement dynamique des commentaires
    const toggleCommentsDrawer = async (postId: string) => {
        const isOpening = activeCommentPostId !== postId;
        setActiveCommentPostId(isOpening ? postId : null);

        if (isOpening && isDbConnected) {
            try {
                let res = await fetch(`/api/posts/${postId}`).catch(() => null);
                if (!res || !res.ok) {
                    res = await fetch(`${API_URL}/posts/${postId}`).catch(() => null);
                }
                if (res && res.ok) {
                    const json = await res.json();
                    if (json && Array.isArray(json.comments)) {
                        const fetchedComments: CommentItem[] = json.comments.map((c: any) => ({
                            id: String(c.id),
                            content: c.content,
                            authorName: c.author?.username || "utilisateur",
                            createdAt: formatDateRelative(c.createdAt || c.created_at),
                        }));

                        updatePostState(postId, (p) => ({
                            ...p,
                            commentCount: typeof json.commentCount === "number" ? json.commentCount : fetchedComments.length,
                            comments: fetchedComments,
                        }));
                    }
                }
            } catch {
                // Ignoré
            }
        }
    };

    // Ajouter un commentaire
    const handleAddComment = (postId: string) => {
        const text = (commentInputs[postId] || "").trim();
        if (!text) return;

        const newComment: CommentItem = {
            id: `c_${Date.now()}`,
            content: text,
            authorName: user?.username || "moi",
            createdAt: "À l'instant",
        };

        updatePostState(postId, (p) => ({
            ...p,
            commentCount: p.commentCount + 1,
            comments: [...(p.comments || []), newComment],
        }));

        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        showToast("Commentaire publié !");

        if (token && isDbConnected) {
            fetch(`${API_URL}/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: text }),
            }).catch(() => {});
        }
    };

    // 6. Suppression d'une publication (Auteur uniquement, vérifié côté backend)
    const handleDeletePost = async (postId: string) => {
        const postToDelete = allPosts.find((p) => p.id === postId);
        if (!postToDelete) return;

        const isAuthor = Boolean(
            user && (user.username === postToDelete.author?.username || user.id === postToDelete.author?.id)
        );

        if (!isAuthor) {
            alert("Seul l'auteur de la publication peut la supprimer.");
            return;
        }

        const confirmed = window.confirm("Voulez-vous vraiment supprimer cette publication ? Cette action est irréversible.");
        if (!confirmed) return;

        // Mise à jour de l'UI instantanée sans rechargement
        setAllPosts((prev) => prev.filter((p) => p.id !== postId));
        setDisplayedPosts((prev) => prev.filter((p) => p.id !== postId));
        showToast("Publication supprimée !");

        if (token && isDbConnected) {
            try {
                const res = await fetch(`${API_URL}/posts/${postId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    showToast(`Échec de la suppression sur le serveur: ${data.error || "Accès refusé"}`);
                    fetchPosts(true);
                }
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
            }
        }
    };

    // 7. Suppression d'un commentaire (Auteur uniquement, vérifié côté backend)
    const handleDeleteComment = async (postId: string, commentId: string) => {
        const post = allPosts.find((p) => p.id === postId);
        const commentToDelete = post?.comments?.find((c) => c.id === commentId);
        if (!commentToDelete) return;

        const isAuthor = Boolean(
            user && (user.username === commentToDelete.authorName || user.id === commentToDelete.authorId)
        );

        if (!isAuthor) {
            alert("Seul l'auteur du commentaire peut le supprimer.");
            return;
        }

        const confirmed = window.confirm("Voulez-vous vraiment supprimer ce commentaire ?");
        if (!confirmed) return;

        // Mise à jour de l'UI instantanée sans rechargement
        updatePostState(postId, (p) => ({
            ...p,
            commentCount: Math.max(0, p.commentCount - 1),
            comments: p.comments?.filter((c) => c.id !== commentId),
        }));
        showToast("Commentaire supprimé !");

        if (token && isDbConnected) {
            try {
                const res = await fetch(`${API_URL}/comments/${commentId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    showToast(`Échec de la suppression du commentaire: ${data.error || "Accès refusé"}`);
                    toggleCommentsDrawer(postId);
                }
            } catch (err) {
                console.error("Erreur lors de la suppression du commentaire:", err);
            }
        }
    };

    // Rendu stylisé du texte avec hashtags et mentions colorés

    const renderFormattedText = (text: string) => {
        const words = text.split(" ");
        return words.map((word, i) => {
            if (word.startsWith("#")) {
                return (
                    <span key={i} className="post-hashtag">
                        {word}{" "}
                    </span>
                );
            }
            if (word.startsWith("@")) {
                return (
                    <span key={i} className="text-violet-400 font-bold hover:underline cursor-pointer">
                        {word}{" "}
                    </span>
                );
            }
            return word + " ";
        });
    };

    return (
        <div className="feed-container pb-12 font-sans antialiased text-[var(--text-main)]">
            {/* Barre de statut du Backend */}
            <div className="status-banner">
                <div className="status-indicator">
                    <span className={`status-dot ${isDbConnected ? "connected" : "offline"}`} />
                    <span className="status-text">
                        {isDbConnected
                            ? "Flux en direct connecté (SQLite sur port 3000)"
                            : "Mode démo interactif (Lancez le backend pour synchroniser en direct)"}
                    </span>
                </div>
                <button
                    onClick={() => fetchPosts(true)}
                    disabled={loading || refreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl transition disabled:opacity-50"
                    title="Actualiser le flux"
                >
                    <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                    <span>{refreshing ? "Mise à jour..." : "Actualiser"}</span>
                </button>
            </div>

            {/* Composeur de publication premium */}
            <div className="feed-composer-card">
                <div className="composer-top-row">
                    <div className="composer-avatar">
                        {(user?.username || "M").charAt(0).toUpperCase()}
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Quoi de neuf ${user?.username ? `@${user.username}` : ""} aujourd'hui ? Partagez un moment...`}
                        rows={3}
                        className="composer-textarea focus:outline-none"
                    />
                </div>

                {/* Aperçu image avant publication */}
                {imagePreview && (
                    <div className="relative mt-3 rounded-xl overflow-hidden border border-[var(--border-color)] max-h-60 bg-black/40 flex items-center justify-center">
                        <img
                            src={imagePreview}
                            alt="Aperçu"
                            className="max-h-60 w-auto object-cover rounded-xl"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 text-white rounded-full text-xs hover:bg-red-600 transition"
                            title="Supprimer la photo"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Barre d'outils et bouton Publier */}
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {/* Bouton photo */}
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-input)] hover:text-[var(--orange-500)] border border-[var(--border-color)] cursor-pointer transition">
                            <span>📸</span>
                            <span>{imageFile ? "Image ajoutée" : "Photo"}</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>

                        {/* Raccourcis émojis rapides */}
                        <div className="hidden sm:flex items-center gap-1 bg-[var(--bg-input)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                            {["🌅", "🔥", "✨", "☕", "🏔️"].map((em) => (
                                <button
                                    key={em}
                                    type="button"
                                    onClick={() => insertEmoji(em)}
                                    className="hover:scale-125 transition px-1 text-sm"
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Compteur circulaire / caractères */}
                        <span
                            className={`text-xs font-mono font-semibold ${
                                content.length > MAX_CONTENT_LENGTH
                                    ? "text-red-500"
                                    : content.length > MAX_CONTENT_LENGTH * 0.8
                                    ? "text-orange-400"
                                    : "text-[var(--text-dim)]"
                            }`}
                        >
                            {content.length}/{MAX_CONTENT_LENGTH}
                        </span>

                        <button
                            type="button"
                            onClick={handleCreatePost}
                            disabled={submitting || !content.trim() || content.length > MAX_CONTENT_LENGTH}
                            className="btn-primary-gradient text-xs font-bold px-5 py-2 disabled:opacity-40"
                        >
                            {submitting ? "Publication..." : "Publier"}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Filtres du flux */}
            <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilterMode("all")}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                            filterMode === "all"
                                ? "bg-[var(--brand-gradient)] text-white shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                    >
                        ✨ Tous les posts ({allPosts.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterMode("trending")}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                            filterMode === "trending"
                                ? "bg-[var(--brand-gradient)] text-white shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                    >
                        🔥 Populaires
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterMode("photos")}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                            filterMode === "photos"
                                ? "bg-[var(--brand-gradient)] text-white shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                    >
                        📸 Photos uniquement
                    </button>
                </div>
            </div>

            {/* 4. Liste des Publications Sociales */}
            <div className="space-y-6">
                        {filteredPosts.map((post) => {
                            const rawImg = post.imageUrl;
                            const imageSrc = rawImg
                                ? rawImg.startsWith("http")
                                    ? rawImg
                                    : `${API_URL}${rawImg}`
                                : null;

                            const isLiked = likedPostIds.has(post.id);
                            const isSaved = savedPostIds.has(post.id);
                            const isCommentsOpen = activeCommentPostId === post.id;
                            const isBursting = heartBurstPostId === post.id;

                            const authorUsername = post.author?.username || "Anonyme";
                            const authorLetter = authorUsername.charAt(0).toUpperCase();

                            return (
                                <article key={post.id} className="feed-card">
                                    {/* En-tête de la carte */}
                                    <div className="feed-card-header">
                                        <div className="feed-author-meta">
                                            <div className="feed-author-avatar-ring">
                                                <div className="feed-author-avatar">
                                                    {authorLetter}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="feed-author-name">@{authorUsername}</span>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                        Membre
                                                    </span>
                                                </div>
                                                <span className="feed-author-time">
                                                    {formatDateRelative(post.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Bouton de suppression (Auteur uniquement) */}
                                            {user && (user.username === authorUsername || user.id === post.author?.id) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 transition"
                                                    title="Supprimer cette publication"
                                                >
                                                    Supprimer
                                                </button>
                                            )}
                                            {onSelectPost && (

                                                <button
                                                    type="button"
                                                    onClick={() => onSelectPost(post.id)}
                                                    className="text-xs font-bold text-[var(--orange-400)] hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/20 transition"
                                                    title="Ouvrir la page détaillée"
                                                >
                                                    Détails →
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleShare(post)}
                                                className="text-xs text-[var(--text-dim)] hover:text-[var(--orange-500)] p-1.5 rounded-lg"
                                                title="Partager le post"
                                            >
                                                🔗 Partager
                                            </button>
                                        </div>
                                    </div>

                                    {/* Image avec double-clic pour liker */}
                                    {imageSrc && (
                                        <div
                                            className="feed-img-box"
                                            onDoubleClick={() => handleDoubleTapPhoto(post.id)}
                                            onClick={() => setZoomImage({ src: imageSrc, caption: post.content })}
                                            title="Double-cliquez pour liker, simple clic pour agrandir"
                                        >
                                            <img
                                                src={imageSrc}
                                                alt={post.content}
                                                className="feed-img"
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = "none";
                                                }}
                                            />

                                            {/* Animation pop-up du coeur lors du double-clic */}
                                            {isBursting && (
                                                <div className="heart-burst-overlay">
                                                    <span className="heart-burst-icon">❤️</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Contenu textuel avec hashtags mis en valeur */}
                                    {post.content && (
                                        <div
                                            className={`px-5 py-4 ${onSelectPost ? "cursor-pointer hover:bg-white/[0.02] transition" : ""}`}
                                            onClick={() => onSelectPost && onSelectPost(post.id)}
                                            title={onSelectPost ? "Cliquer pour ouvrir le détail du post" : undefined}
                                        >
                                            <p className="text-[15px] leading-relaxed text-[var(--text-main)]">
                                                {renderFormattedText(post.content)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Barre d'action sociale */}
                                    <div className="feed-action-bar">
                                        <div className="feed-action-group">
                                            {/* Like */}
                                            <button
                                                type="button"
                                                onClick={() => toggleLike(post.id)}
                                                className={`feed-action-btn ${isLiked ? "liked" : ""}`}
                                                title="Aimer cette publication"
                                            >
                                                <span className="text-base">{isLiked ? "❤️" : "🤍"}</span>
                                                <span>{post.likeCount}</span>
                                            </button>

                                            {/* Commentaires */}
                                            <button
                                                type="button"
                                                onClick={() => toggleCommentsDrawer(post.id)}
                                                className="feed-action-btn"
                                                title="Commenter"
                                            >
                                                <span className="text-base">💬</span>
                                                <span>{post.commentCount}</span>
                                            </button>
                                        </div>

                                        {/* Sauvegarde favori */}
                                        <button
                                            type="button"
                                            onClick={() => toggleSave(post.id)}
                                            className={`feed-action-btn ${isSaved ? "saved" : ""}`}
                                            title="Enregistrer"
                                        >
                                            <span className="text-base">{isSaved ? "🔖" : "📑"}</span>
                                            <span>{isSaved ? "Enregistré" : "Enregistrer"}</span>
                                        </button>
                                    </div>

                                    {/* Tiroir de commentaires */}
                                    {isCommentsOpen && (
                                        <div className="comments-drawer">
                                            <div className="comments-list">
                                                {(post.comments && post.comments.length > 0) ? (
                                                    post.comments.map((c) => (
                                                        <div key={c.id} className="comment-bubble flex items-center justify-between">
                                                            <div>
                                                                <span className="comment-user">@{c.authorName}</span>
                                                                <span className="text-[var(--text-main)]">{c.content}</span>
                                                                <span className="text-[10px] text-[var(--text-dim)] ml-2">
                                                                    {c.createdAt}
                                                                </span>
                                                            </div>
                                                            {user && (user.username === c.authorName || user.id === c.authorId) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                                                    className="text-[11px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-0.5 rounded transition"
                                                                    title="Supprimer ce commentaire"
                                                                >
                                                                    Supprimer
                                                                </button>
                                                            )}
                                                        </div>

                                                    ))
                                                ) : (
                                                    <p className="text-xs text-[var(--text-dim)] py-2 text-center">
                                                        Soyez le premier à commenter cette publication !
                                                    </p>
                                                )}
                                            </div>

                                            {/* Champ d'ajout de commentaire */}
                                            <div className="comment-input-row">
                                                <input
                                                    type="text"
                                                    value={commentInputs[post.id] || ""}
                                                    onChange={(e) =>
                                                        setCommentInputs((prev) => ({
                                                            ...prev,
                                                            [post.id]: e.target.value,
                                                        }))
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleAddComment(post.id);
                                                    }}
                                                    placeholder="Ajouter un commentaire..."
                                                    className="comment-input-field"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddComment(post.id)}
                                                    className="comment-send-btn"
                                                >
                                                    Envoyer
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}

                        {/* Sentinelle pour le lazy loading infini */}
                        <div ref={sentinelRef} className="h-6" />

                        {loadingMore && (
                            <div className="py-4 text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] rounded-full border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] animate-pulse shadow-sm">
                                    <span className="animate-spin">⏳</span>
                                    <span>Chargement de nouveaux posts...</span>
                                </div>
                            </div>
                        )}

                        {!hasMore && allPosts.length > 0 && (
                            <div className="py-8 text-center text-xs text-[var(--text-dim)] border-t border-[var(--border-color)]">
                                ✨ Vous avez atteint la fin du fil d'actualité ({allPosts.length} posts)
                            </div>
                        )}
                    </div>

            {/* Modal d'agrandissement d'image */}
            {zoomImage && (
                <div
                    className="modal-backdrop"
                    onClick={() => setZoomImage(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="modal-container max-w-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative bg-black flex items-center justify-center max-h-[80vh]">
                            <img
                                src={zoomImage.src}
                                alt={zoomImage.caption}
                                className="max-h-[80vh] w-auto object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => setZoomImage(null)}
                                className="absolute top-3 right-3 p-2 bg-black/70 text-white rounded-full text-sm hover:bg-red-600 transition"
                            >
                                ✕
                            </button>
                        </div>
                        {zoomImage.caption && (
                            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-color)]">
                                <p className="text-sm text-[var(--text-main)]">{zoomImage.caption}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast flottant de notification */}
            {toastMessage && (
                <div className="toast-float">
                    <span>✨</span>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
