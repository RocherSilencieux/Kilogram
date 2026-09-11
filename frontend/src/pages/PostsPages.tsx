import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import type { Author, CommentItem, Post } from "../types";
import { DEMO_FEED_POSTS } from "../data/demoPosts";
import { sortDesc, relativeTime } from "../utils/formatters";
import { PostComposer } from "../components/posts/PostComposer";
import { PostEntry } from "../components/posts/PostEntry";

export type { Author, CommentItem, Post };
export { DEMO_FEED_POSTS };

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 15;
const MAX_LEN = 280;

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

    // Interactions utilisateur locales
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem("kilogram_liked_posts");
            return stored ? new Set(JSON.parse(stored)) : new Set(["demo_post_1"]);
        } catch {
            return new Set(["demo_post_1"]);
        }
    });
    const [savedPostIds, setSavedPostIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem("kilogram_saved_posts");
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2800);
    };

    const normalizePosts = (data: unknown[]): Post[] =>
        data.map((item) => {
            const p = item as Record<string, unknown>;
            const authorObj = typeof p.author === "object" && p.author !== null ? (p.author as Record<string, unknown>) : null;
            const commentsArr = Array.isArray(p.comments) ? p.comments : [];
            const likesArr = Array.isArray(p.likes) ? p.likes : [];

            return {
                id: String(p.id ?? ""),
                content: typeof p.content === "string" ? p.content : "",
                imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : null,
                created_at: typeof p.created_at === "string" ? p.created_at : (typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString()),
                author: authorObj && typeof authorObj.id === "string" && typeof authorObj.username === "string"
                    ? { id: String(authorObj.id), username: String(authorObj.username) }
                    : (typeof p.authorId === "string" ? { id: p.authorId, username: "utilisateur" } : { id: "anon", username: "Anonyme" }),
                likeCount: typeof p.likeCount === "number" ? p.likeCount : likesArr.length,
                commentCount: typeof p.commentCount === "number" ? p.commentCount : commentsArr.length,
                isLiked: Boolean(p.isLiked),
                comments: commentsArr.map((cItem) => {
                    const c = cItem as Record<string, unknown>;
                    const cAuthor = typeof c.author === "object" && c.author !== null ? (c.author as Record<string, unknown>) : null;
                    return {
                        id: String(c.id ?? ""),
                        content: typeof c.content === "string" ? c.content : "",
                        authorName: typeof c.authorName === "string" ? c.authorName : (typeof cAuthor?.username === "string" ? String(cAuthor.username) : "utilisateur"),
                        createdAt: relativeTime(typeof c.createdAt === "string" ? c.createdAt : (typeof c.created_at === "string" ? c.created_at : new Date().toISOString())),
                    };
                }),
            };
        });

    const fetchPosts = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoading(true);
        let liveData: Post[] | null = null;
        let connected = false;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            const res = await fetch("/api/posts", { headers });
            if (res.ok) {
                const j = await res.json();
                if (Array.isArray(j)) {
                    liveData = normalizePosts(j);
                    connected = true;
                }
            }
        } catch {}

        if (!liveData) {
            try {
                const res = await fetch(`${API_URL}/posts`, { headers });
                if (res.ok) {
                    const j = await res.json();
                    if (Array.isArray(j)) {
                        liveData = normalizePosts(j);
                        connected = true;
                    }
                }
            } catch {}
        }

        setIsDbConnected(connected);
        const chosen = liveData && liveData.length > 0 ? liveData : DEMO_FEED_POSTS;

        // Synchroniser les likes avec le localStorage
        const storedLikes = new Set<string>();
        try {
            const stored = localStorage.getItem("kilogram_liked_posts");
            if (stored) {
                (JSON.parse(stored) as string[]).forEach((id) => storedLikes.add(id));
            }
        } catch {}

        if (liveData) {
            liveData.forEach((p) => {
                if (p.isLiked) storedLikes.add(p.id);
            });
        }

        const enriched = chosen.map((p) => {
            const isLikedLocal = storedLikes.has(p.id);
            if (isLikedLocal && !p.isLiked) {
                return { ...p, isLiked: true, likeCount: p.likeCount + 1 };
            }
            return p;
        });

        const sorted = sortDesc(enriched);
        setAllPosts(sorted);
        setDisplayedPosts(sorted.slice(0, PAGE_SIZE));
        setPage(1);

        setLikedPostIds(storedLikes);
        try {
            localStorage.setItem("kilogram_liked_posts", JSON.stringify(Array.from(storedLikes)));
        } catch {}

        setLoading(false);
        setRefreshing(false);
    }, [token]);

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
                        likeCount: 0, commentCount: 0, comments: [], isLiked: false,
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
            likeCount: 0, commentCount: 0, comments: [], isLiked: false,
        };
        setAllPosts((p) => [local, ...p]);
        setDisplayedPosts((p) => [local, ...p]);
        handleRemoveImage(); setContent(""); setSubmitting(false);
        showToast("Croquis ajouté en local ! ✏️");
    };

    const updatePost = (postId: string, fn: (p: Post) => Post) => {
        setAllPosts((prev) => prev.map((p) => (p.id === postId ? fn(p) : p)));
        setDisplayedPosts((prev) => prev.map((p) => (p.id === postId ? fn(p) : p)));
    };

    const toggleLike = (postId: string) => {
        const liked = likedPostIds.has(postId);
        setLikedPostIds((s) => {
            const n = new Set(s);
            liked ? n.delete(postId) : n.add(postId);
            try {
                localStorage.setItem("kilogram_liked_posts", JSON.stringify(Array.from(n)));
            } catch {}
            return n;
        });
        updatePost(postId, (p) => ({
            ...p,
            likeCount: liked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
            isLiked: !liked,
        }));
        if (token && isDbConnected)
            fetch(`${API_URL}/posts/${postId}/like`, {
                method: liked ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});
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
                    const json: unknown = await res.json();
                    if (typeof json === "object" && json !== null && "comments" in json && Array.isArray((json as Record<string, unknown>).comments)) {
                        const rawComments = (json as Record<string, unknown>).comments as unknown[];
                        const fetched: CommentItem[] = rawComments.map((cItem: unknown) => {
                            const c = cItem as Record<string, unknown>;
                            const cAuthor = typeof c.author === "object" && c.author !== null ? (c.author as Record<string, unknown>) : null;
                            return {
                                id: String(c.id ?? ""),
                                content: typeof c.content === "string" ? c.content : "",
                                authorName: typeof c.authorName === "string" ? c.authorName : (typeof cAuthor?.username === "string" ? String(cAuthor.username) : "utilisateur"),
                                createdAt: relativeTime(typeof c.createdAt === "string" ? c.createdAt : (typeof c.created_at === "string" ? c.created_at : new Date().toISOString())),
                            };
                        });
                        const jsonObj = json as Record<string, unknown>;
                        const commentCountVal = typeof jsonObj.commentCount === "number" ? jsonObj.commentCount : fetched.length;
                        updatePost(postId, (p) => ({
                            ...p,
                            commentCount: commentCountVal,
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
                <PostComposer
                    user={user}
                    content={content}
                    imagePreview={imagePreview}
                    submitting={submitting}
                    fileInputRef={fileInputRef}
                    onContentChange={setContent}
                    onImageChange={handleImageChange}
                    onRemoveImage={handleRemoveImage}
                    onCreatePost={handleCreatePost}
                    maxLen={MAX_LEN}
                />

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
