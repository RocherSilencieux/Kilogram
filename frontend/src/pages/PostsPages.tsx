import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 15;

export interface Author { id: string; username: string; }
export interface CommentItem { id: string; content: string; authorName: string; createdAt: string; }
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

export const DEMO_FEED_POSTS: Post[] = [
    {
        id: "demo_post_1",
        content: "Magnifique coucher de soleil dessiné au crayon ce soir ! Les reflets hachurés sont magiques. ✏️🌅 #SketchVibes #Kilogram #OmoriStyle",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        author: { id: "user_alice", username: "alice" },
        likeCount: 42,
        commentCount: 2,
        comments: [
            { id: "c_1", content: "Les traits sont splendides ! Pris avec quel appareil ?", authorName: "bob", createdAt: "Il y a 10 min" },
            { id: "c_2", content: "Superbe cadrage Alice 👏", authorName: "admin", createdAt: "Il y a 5 min" },
        ],
    },
    {
        id: "demo_post_2",
        content: "Un bon café pour démarrer le dessin du jour ! Tout est prêt pour tester le nouveau fil d'actualité. ☕💻 #DevLife #Notebook",
        imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        author: { id: "user_bob", username: "bob" },
        likeCount: 28,
        commentCount: 1,
        comments: [{ id: "c_3", content: "Le style papier croquis est trop classe !", authorName: "alice", createdAt: "Il y a 30 min" }],
    },
    {
        id: "demo_post_3",
        content: "Randonnée au sommet des Alpes ce week-end. Vue imprenable au-dessus d'une mer de nuages. 🏔️✨ #Montagne #Nature #Sketch",
        imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        author: { id: "user_bob", username: "bob" },
        likeCount: 67,
        commentCount: 1,
        comments: [{ id: "c_4", content: "Impressionnant ! Quel sommet ?", authorName: "sophie", createdAt: "Il y a 2 h" }],
    },
    {
        id: "demo_post_4",
        content: "Bienvenue à tous sur Kilogram ! Nouveau design Carnet de Croquis inspiré d'OMORI. Venez gribouillez vos moments ! ✏️🖤 #Omori #Kilogram2026",
        imageUrl: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        author: { id: "user_admin", username: "admin" },
        likeCount: 114,
        commentCount: 0,
        comments: [],
    },
];

function sortDesc(posts: Post[]): Post[] {
    return [...posts].sort((a, b) => {
        const tA = new Date(a.created_at || (a as any).createdAt || 0).getTime() || 0;
        const tB = new Date(b.created_at || (b as any).createdAt || 0).getTime() || 0;
        return tB - tA;
    });
}

function relativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (isNaN(diff)) return "récemment";
    if (diff < 60) return "à l'instant";
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const AVATAR_PALETTE = [
    ["#ddd4f5", "#1a1520"], ["#fde68a", "#3a3000"], ["#fecaca", "#3b0f0f"],
    ["#bbf7d0", "#0f2e1a"], ["#bae6fd", "#0c2333"], ["#e9d5ff", "#2d1254"],
];
function avatarStyle(username: string): { bg: string; fg: string } {
    const idx = username.charCodeAt(0) % AVATAR_PALETTE.length;
    return { bg: AVATAR_PALETTE[idx][0], fg: AVATAR_PALETTE[idx][1] };
}

function FormattedText({ text, onClick }: { text: string; onClick?: () => void }) {
    return (
        <p
            className="post-body"
            onClick={onClick}
            title={onClick ? "Cliquer pour lire la suite" : undefined}
        >
            {text.split(" ").map((word, i) => {
                if (word.startsWith("#"))
                    return <span key={i} className="post-hashtag">{word} </span>;
                if (word.startsWith("@"))
                    return <span key={i} style={{ color: "var(--ink-purple)", fontWeight: 700 }}>{word} </span>;
                return word + " ";
            })}
        </p>
    );
}

/* ── PostEntry ─────────────────────────────────────────────────────────────── */
interface PostEntryProps {
    post: Post;
    isLiked: boolean;
    isSaved: boolean;
    commentsOpen: boolean;
    commentInput: string;
    onLike: () => void;
    onSave: () => void;
    onShare: () => void;
    onToggleComments: () => void;
    onCommentInput: (v: string) => void;
    onAddComment: () => void;
    onOpenDetail?: () => void;
    onSelectAuthor?: (userId: string) => void;
    onZoom: (src: string, caption: string) => void;
}

function getAuthorDisplayName(author: Author | null, loggedInUser: { id?: string; username?: string } | null): { id: string; username: string } {
    if (!author) {
        if (loggedInUser?.username) return { id: loggedInUser.id || "me", username: loggedInUser.username };
        return { id: "anon", username: "Anonyme" };
    }

    // 1. Si l'auteur est l'utilisateur connecté (ou Alice par défaut en démo si c'est le compte démo)
    if (loggedInUser && (author.id === loggedInUser.id || author.username === loggedInUser.username || author.id === "user_alice")) {
        return { id: loggedInUser.id || author.id, username: loggedInUser.username || author.username };
    }

    // 2. Chercher dans les profils sauvegardés dans localStorage
    try {
        const savedById = localStorage.getItem(`kilogram_custom_profile_${author.id}`);
        if (savedById) {
            const parsed = JSON.parse(savedById);
            if (parsed && parsed.username) return { id: author.id, username: parsed.username };
        }
        const savedByName = localStorage.getItem(`kilogram_custom_profile_${author.username.toLowerCase()}`);
        if (savedByName) {
            const parsed = JSON.parse(savedByName);
            if (parsed && parsed.username) return { id: author.id, username: parsed.username };
        }
    } catch {}

    return author;
}

function PostEntry({
    post, isLiked, isSaved, commentsOpen,
    commentInput,
    onLike, onSave, onShare, onToggleComments,
    onCommentInput, onAddComment,
    onOpenDetail, onSelectAuthor, onZoom,
}: PostEntryProps) {
    const { user } = useAuth();
    const resolvedAuthor = getAuthorDisplayName(post.author, user);
    const username = resolvedAuthor.username;
    const authorId = resolvedAuthor.id;
    const { bg, fg } = avatarStyle(username);

    const rawImg = post.imageUrl;
    const imgSrc = rawImg ? (rawImg.startsWith("http") ? rawImg : `${API_URL}${rawImg}`) : null;

    // alternance de l'inclinaison du polaroïd
    const polaroidStyle: React.CSSProperties = {
        transform: post.likeCount % 2 === 0 ? "rotate(-2.2deg)" : "rotate(1.6deg)",
    };

    const handleAuthorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (authorId && onSelectAuthor) {
            onSelectAuthor(authorId);
        }
    };

    return (
        <div className="post-entry animate-pop">
            {/* ── Colonne marge ── */}
            <div className="post-margin">
                {/* Avatar */}
                <div
                    className="margin-avatar"
                    style={{ backgroundColor: bg, color: fg, cursor: authorId ? "pointer" : "default" }}
                    title={`Voir le profil de @${username}`}
                    onClick={handleAuthorClick}
                >
                    {username.charAt(0).toUpperCase()}
                </div>

                {/* Like (stamp dans la marge) */}
                <button
                    className={`margin-counter ${isLiked ? "liked" : ""}`}
                    onClick={onLike}
                    title={isLiked ? "Retirer le like" : "Liker"}
                    aria-pressed={isLiked}
                    aria-label={`${post.likeCount} likes`}
                    style={{ color: isLiked ? "var(--ink-red)" : "var(--ink-faded)" }}
                >
                    <span className="count-icon">{isLiked ? "❤️" : "🤍"}</span>
                    <span className="count-val" style={{ color: isLiked ? "var(--ink-red)" : "var(--ink-faded)" }}>
                        {post.likeCount}
                    </span>
                </button>

                {/* Date */}
                <span className="margin-date">{relativeTime(post.created_at)}</span>
            </div>

            {/* ── Colonne contenu ── */}
            <div className="post-content">
                {/* Auteur */}
                <div
                    className="post-author-line"
                    style={{ cursor: authorId ? "pointer" : "default" }}
                    title={`Voir le profil de @${username}`}
                    onClick={handleAuthorClick}
                >
                    @{username}
                    <span className="author-badge">auteur</span>
                </div>

                {/* Corps du texte */}
                <FormattedText text={post.content} onClick={onOpenDetail} />

                {/* Image polaroïd */}
                {imgSrc && (
                    <div className="polaroid-wrap">
                        <div
                            className="polaroid"
                            style={polaroidStyle}
                            onClick={() => onZoom(imgSrc, post.content)}
                            title="Cliquer pour agrandir"
                        >
                            <img src={imgSrc} alt={post.content} loading="lazy" />
                            <span className="polaroid-caption">
                                {post.content.slice(0, 28)}…
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="post-actions">
                    <button
                        className={`action-stamp ${commentsOpen ? "comments-open" : ""}`}
                        onClick={onToggleComments}
                        aria-expanded={commentsOpen}
                    >
                        💬 {post.commentCount} comm.
                    </button>

                    <span className="action-sep">·</span>

                    <button
                        className={`action-stamp ${isSaved ? "saved" : ""}`}
                        onClick={onSave}
                        aria-pressed={isSaved}
                    >
                        {isSaved ? "🔖 épinglé" : "📌 épingler"}
                    </button>

                    <span className="action-sep">·</span>

                    <button className="action-stamp" onClick={onShare}>
                        🔗 partager
                    </button>

                    {onOpenDetail && (
                        <button className="action-open" onClick={onOpenDetail}>
                            lire la suite →
                        </button>
                    )}
                </div>

                {/* ── Tiroir commentaires (post-its) ── */}
                {commentsOpen && (
                    <div className="comments-section">
                        {/* Saisie */}
                        <div className="comment-input-wrap">
                            <input
                                type="text"
                                className="comment-input"
                                value={commentInput}
                                onChange={(e) => onCommentInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") onAddComment(); }}
                                placeholder="Gribouillez un commentaire..."
                                aria-label="Ajouter un commentaire"
                            />
                            <button
                                className="comment-send-btn"
                                onClick={onAddComment}
                                disabled={!commentInput.trim()}
                            >
                                ✏️ noter
                            </button>
                        </div>

                        {/* Liste */}
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map((c) => {
                                let cAuthor = c.authorName;
                                if (user && (cAuthor === "alice" || cAuthor === user.username || cAuthor === "moi")) {
                                    cAuthor = user.username;
                                } else {
                                    try {
                                        const saved = localStorage.getItem(`kilogram_custom_profile_${cAuthor.toLowerCase()}`);
                                        if (saved) {
                                            const p = JSON.parse(saved);
                                            if (p && p.username) cAuthor = p.username;
                                        }
                                    } catch {}
                                }
                                const { bg: cbg, fg: cfg } = avatarStyle(cAuthor);
                                return (
                                    <div key={c.id} className="comment-sticky">
                                        <div className="sticky-author">
                                            <span
                                                style={{
                                                    width: 20, height: 20, borderRadius: "50%",
                                                    background: cbg, color: cfg,
                                                    display: "inline-flex", alignItems: "center",
                                                    justifyContent: "center", fontSize: 10,
                                                    fontWeight: 700, flexShrink: 0,
                                                    border: "1px solid rgba(0,0,0,0.15)",
                                                }}
                                            >
                                                {cAuthor.charAt(0).toUpperCase()}
                                            </span>
                                            @{cAuthor}
                                            <span className="sticky-author-time">{c.createdAt}</span>
                                        </div>
                                        <p className="sticky-body">{c.content}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="comments-empty">Aucune note pour l'instant… soyez le premier à gribouillez ici ! ✏️</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── PostsPages ─────────────────────────────────────────────────────────────── */
export default function PostsPages({
    onSelectPost,
    onSelectAuthor,
}: {
    onSelectPost?: (postId: string) => void;
    onSelectAuthor?: (userId: string) => void;
}) {
    const { token, user } = useAuth();

    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
    const [filterMode, setFilterMode] = useState<"all" | "trending" | "photos">("all");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set(["demo_post_1"]));
    const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2800);
    };

    const normalizePosts = (data: any[]): Post[] =>
        data.map((p) => ({
            id: String(p.id),
            content: p.content || "",
            imageUrl: p.imageUrl || null,
            created_at: p.created_at || p.createdAt || new Date().toISOString(),
            author: p.author || (p.authorId ? { id: p.authorId, username: "utilisateur" } : { id: "anon", username: "Anonyme" }),
            likeCount: typeof p.likeCount === "number" ? p.likeCount : (Array.isArray(p.likes) ? p.likes.length : 0),
            commentCount: typeof p.commentCount === "number" ? p.commentCount : (Array.isArray(p.comments) ? p.comments.length : 0),
            comments: Array.isArray(p.comments)
                ? p.comments.map((c: any) => ({
                    id: String(c.id), content: c.content,
                    authorName: c.author?.username || "utilisateur",
                    createdAt: relativeTime(c.createdAt || c.created_at),
                })) : [],
        }));

    const fetchPosts = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoading(true);
        let liveData: Post[] | null = null;
        let connected = false;

        try {
            const res = await fetch("/api/posts");
            if (res.ok) { const j = await res.json(); if (Array.isArray(j) && j.length > 0) { liveData = normalizePosts(j); connected = true; } }
        } catch {}

        if (!liveData) {
            try {
                const res = await fetch(`${API_URL}/posts`);
                if (res.ok) { const j = await res.json(); if (Array.isArray(j) && j.length > 0) { liveData = normalizePosts(j); connected = true; } }
            } catch {}
        }

        setIsDbConnected(connected);
        const chosen = liveData && liveData.length > 0 ? liveData : DEMO_FEED_POSTS;
        const sorted = sortDesc(chosen);
        setAllPosts(sorted);
        setDisplayedPosts(sorted.slice(0, PAGE_SIZE));
        setPage(1);
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const filteredPosts = displayedPosts.filter((p) => {
        if (filterMode === "photos") return Boolean(p.imageUrl);
        if (filterMode === "trending") return p.likeCount >= 30;
        return true;
    });

    const hasMore = displayedPosts.length < allPosts.length;

    const loadNextPage = useCallback(() => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        setTimeout(() => {
            const next = allPosts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
            setDisplayedPosts((prev) => [...prev, ...next]);
            setPage((p) => p + 1);
            setLoadingMore(false);
        }, 150);
    }, [loadingMore, hasMore, page, allPosts]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting && hasMore && !loadingMore && !loading) loadNextPage(); },
            { rootMargin: "300px" }
        );
        obs.observe(sentinel);
        return () => obs.disconnect();
    }, [hasMore, loadingMore, loading, loadNextPage]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast("Max 5 Mo pour une image ✏️"); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null); setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const MAX_LEN = 280;

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = content.trim();
        if (!text) return;
        setSubmitting(true);

        if (token && isDbConnected) {
            try {
                const fd = new FormData();
                fd.append("content", text);
                if (imageFile) fd.append("image", imageFile);
                const res = await fetch(`${API_URL}/posts`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                });
                if (res.ok) {
                    const raw = await res.json();
                    const newP: Post = {
                        id: String(raw.id), content: raw.content, imageUrl: raw.imageUrl,
                        created_at: raw.createdAt || new Date().toISOString(),
                        author: raw.author || { id: user?.id || "u", username: user?.username || "moi" },
                        likeCount: 0, commentCount: 0, comments: [],
                    };
                    setAllPosts((p) => [newP, ...p]);
                    setDisplayedPosts((p) => [newP, ...p]);
                    handleRemoveImage(); setContent(""); showToast("Dessin partagé ! ✏️");
                    setSubmitting(false); return;
                }
            } catch {}
        }

        const local: Post = {
            id: `post_local_${Date.now()}`, content: text, imageUrl: imagePreview,
            created_at: new Date().toISOString(),
            author: { id: user?.id || "me", username: user?.username || "moi" },
            likeCount: 1, commentCount: 0, comments: [],
        };
        setAllPosts((p) => [local, ...p]);
        setDisplayedPosts((p) => [local, ...p]);
        setLikedPostIds((s) => new Set(s).add(local.id));
        handleRemoveImage(); setContent(""); setSubmitting(false);
        showToast("Croquis ajouté en local ! ✏️");
    };

    const updatePost = (postId: string, fn: (p: Post) => Post) => {
        setAllPosts((prev) => prev.map((p) => (p.id === postId ? fn(p) : p)));
        setDisplayedPosts((prev) => prev.map((p) => (p.id === postId ? fn(p) : p)));
    };

    const toggleLike = (postId: string) => {
        const liked = likedPostIds.has(postId);
        setLikedPostIds((s) => { const n = new Set(s); liked ? n.delete(postId) : n.add(postId); return n; });
        updatePost(postId, (p) => ({ ...p, likeCount: liked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1 }));
        if (token && isDbConnected)
            fetch(`${API_URL}/posts/${postId}/like`, { method: liked ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    };

    const toggleSave = (postId: string) => {
        const saved = savedPostIds.has(postId);
        setSavedPostIds((s) => { const n = new Set(s); saved ? n.delete(postId) : n.add(postId); return n; });
        showToast(saved ? "Retiré des favoris" : "Épinglé dans le carnet ! 📌");
    };

    const handleShare = (post: Post) => {
        const url = onSelectPost ? `${window.location.origin}/posts/${post.id}` : window.location.href;
        navigator.clipboard?.writeText(url);
        showToast("Lien copié dans le presse-papier 🔗");
    };

    const toggleComments = async (postId: string) => {
        const opening = activeCommentPostId !== postId;
        setActiveCommentPostId(opening ? postId : null);

        if (opening && isDbConnected) {
            try {
                let res = await fetch(`/api/posts/${postId}`).catch(() => null);
                if (!res || !res.ok) res = await fetch(`${API_URL}/posts/${postId}`).catch(() => null);
                if (res && res.ok) {
                    const json = await res.json();
                    if (json && Array.isArray(json.comments)) {
                        const fetched: CommentItem[] = json.comments.map((c: any) => ({
                            id: String(c.id), content: c.content,
                            authorName: c.author?.username || "utilisateur",
                            createdAt: relativeTime(c.createdAt || c.created_at),
                        }));
                        updatePost(postId, (p) => ({
                            ...p,
                            commentCount: typeof json.commentCount === "number" ? json.commentCount : fetched.length,
                            comments: fetched,
                        }));
                    }
                }
            } catch {}
        }
    };

    const handleAddComment = (postId: string) => {
        const text = (commentInputs[postId] || "").trim();
        if (!text) return;
        const c: CommentItem = { id: `c_${Date.now()}`, content: text, authorName: user?.username || "moi", createdAt: "à l'instant" };
        updatePost(postId, (p) => ({ ...p, commentCount: p.commentCount + 1, comments: [...(p.comments || []), c] }));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        showToast("Commentaire noté ! ✏️");
        if (token && isDbConnected)
            fetch(`${API_URL}/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: text }),
            }).catch(() => {});
    };

    const userAvatarStyle = avatarStyle(user?.username || "m");

    /* ── Rendu ── */
    return (
        <>
            {/* Toast */}
            {toast && <div className="toast-note">{toast}</div>}

            {/* Statut serveur (note collée en bas à droite) */}
            <div
                className="status-note"
                onClick={() => fetchPosts(true)}
                title="Cliquer pour actualiser"
            >
                <span className={`status-dot ${isDbConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
                {refreshing ? "actualisation..." : isDbConnected ? "serveur live" : "mode démo"}
            </div>

            {/* Zoom photo */}
            {zoomImage && (
                <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
                    <div className="zoom-polaroid" onClick={(e) => e.stopPropagation()}>
                        <button className="zoom-close" onClick={() => setZoomImage(null)}>✕ fermer</button>
                        <img src={zoomImage.src} alt={zoomImage.caption} />
                    </div>
                </div>
            )}

            {/* Page du cahier */}
            <div className="notebook-page">

                {/* ── Compositeur ── */}
                <div className="composer-wrap">
                    <div className="composer-header">
                        <div
                            className="composer-avatar"
                            style={{ backgroundColor: userAvatarStyle.bg, color: userAvatarStyle.fg }}
                        >
                            {(user?.username || "M").charAt(0).toUpperCase()}
                        </div>
                        <span className="composer-who">
                            {user?.username ? `@${user.username}` : "Esquisseur anonyme"}
                        </span>
                    </div>

                    <textarea
                        id="new-post-composer"
                        className="composer-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Qu'avez-vous dessiné aujourd'hui, ${user?.username || "esquisseur"} ?`}
                        rows={3}
                        aria-label="Écrire un nouveau post"
                    />

                    {imagePreview && (
                        <div className="composer-img-preview">
                            <img src={imagePreview} alt="Aperçu" />
                            <button className="composer-img-remove" onClick={handleRemoveImage} title="Retirer">✕</button>
                        </div>
                    )}

                    <div className="composer-toolbar">
                        <div className="composer-tools-left">
                            <label className="upload-label">
                                📸 photo
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleImageChange}
                                    style={{ display: "none" }}
                                />
                            </label>

                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                {["🌅", "🖤", "✨", "☕", "🏔️"].map((em) => (
                                    <button
                                        key={em}
                                        type="button"
                                        onClick={() => setContent((p) => `${p} ${em}`)}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            fontSize: 16, padding: "0 3px",
                                            transition: "transform 0.12s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3) rotate(-5deg)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span className={`char-count ${content.length > MAX_LEN ? "over" : ""}`}>
                                {content.length}/{MAX_LEN}
                            </span>
                            <button
                                id="submit-new-post"
                                className="publish-btn"
                                onClick={handleCreatePost}
                                disabled={submitting || !content.trim() || content.length > MAX_LEN}
                            >
                                {submitting ? "en cours..." : "✏️ noter"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Filtres ── */}
                <div className="filter-row" role="tablist">
                    {([
                        { mode: "all", label: `tous les croquis (${allPosts.length})` },
                        { mode: "trending", label: "populaire 🔥" },
                        { mode: "photos", label: "photos 📸" },
                    ] as const).map(({ mode, label }) => (
                        <button
                            key={mode}
                            role="tab"
                            aria-selected={filterMode === mode}
                            onClick={() => setFilterMode(mode)}
                            className={`filter-tab ${filterMode === mode ? "active" : ""}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Entrées ── */}
                {loading ? (
                    <div className="loading-entry">
                        <div className="ink-line" style={{ width: "40%" }} />
                        <div className="ink-line" style={{ width: "70%" }} />
                        <div className="ink-line" style={{ width: "55%" }} />
                        <div className="ink-line" style={{ width: "80%" }} />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="error-entry">
                        <p style={{ fontFamily: "var(--font-hand)", color: "var(--ink-faded)", fontSize: 16 }}>
                            Aucune entrée pour ce filtre... le carnet est vide ! 📭
                        </p>
                    </div>
                ) : (
                    <>
                        {filteredPosts.map((post) => (
                            <PostEntry
                                key={post.id}
                                post={post}
                                isLiked={likedPostIds.has(post.id)}
                                isSaved={savedPostIds.has(post.id)}
                                commentsOpen={activeCommentPostId === post.id}
                                commentInput={commentInputs[post.id] || ""}
                                onLike={() => toggleLike(post.id)}
                                onSave={() => toggleSave(post.id)}
                                onShare={() => handleShare(post)}
                                onToggleComments={() => toggleComments(post.id)}
                                onCommentInput={(v) => setCommentInputs((p) => ({ ...p, [post.id]: v }))}
                                onAddComment={() => handleAddComment(post.id)}
                                onOpenDetail={onSelectPost ? () => onSelectPost(post.id) : undefined}
                                onSelectAuthor={onSelectAuthor}
                                onZoom={(src, cap) => setZoomImage({ src, caption: cap })}
                            />
                        ))}
                        <div ref={sentinelRef} style={{ height: 8 }} />
                        {loadingMore && (
                            <p style={{ fontFamily: "var(--font-hand)", color: "var(--ink-light)", textAlign: "center", padding: "16px 0", fontSize: 13 }}>
                                chargement de la suite...
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
