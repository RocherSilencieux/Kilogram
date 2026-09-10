import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { type Post, type CommentItem, DEMO_FEED_POSTS } from "../pages/PostsPages";

const API_URL = "http://localhost:3000";

interface PostDetailViewProps {
  postId: string;
  onBack: () => void;
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

export const PostDetailView: React.FC<PostDetailViewProps> = ({ postId, onBack }) => {
  const { token, user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [is404, setIs404] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // État local des commentaires
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Interactions dynamiques
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const loadPostDetail = useCallback(async () => {
    setLoading(true);
    setIs404(false);
    setError(null);

    let loadedPost: Post | null = null;
    let notFoundError = false;

    try {
      let response = await fetch(`/api/posts/${postId}`).catch(() => null);
      if (!response || !response.ok) {
        response = await fetch(`${API_URL}/posts/${postId}`).catch(() => null);
      }

      if (response) {
        if (response.status === 404) {
          notFoundError = true;
        } else if (response.ok) {
          const raw = await response.json();
          if (raw && raw.id) {
            const formattedComments: CommentItem[] = Array.isArray(raw.comments)
              ? raw.comments.map((c: any) => ({
                  id: String(c.id),
                  content: c.content,
                  authorName: c.author?.username || "utilisateur",
                  createdAt: formatDateRelative(c.createdAt || c.created_at),
                }))
              : [];

            loadedPost = {
              id: String(raw.id),
              content: raw.content || "",
              imageUrl: raw.imageUrl || null,
              created_at: raw.createdAt || raw.created_at || new Date().toISOString(),
              author: raw.author || { id: "anon", username: "Anonyme" },
              likeCount: typeof raw.likeCount === "number" ? raw.likeCount : 0,
              commentCount: formattedComments.length,
              comments: formattedComments,
            };
          }
        }
      }
    } catch {
      // Fallback
    }

    if (!loadedPost && !notFoundError) {
      const demoMatch = DEMO_FEED_POSTS.find((p) => p.id === postId);
      if (demoMatch) {
        loadedPost = demoMatch;
      } else if (postId.startsWith("post_local_")) {
        loadedPost = {
          id: postId,
          content: "Publication récente en mode démo",
          imageUrl: null,
          created_at: new Date().toISOString(),
          author: { id: user?.id || "me", username: user?.username || "moi" },
          likeCount: 1,
          commentCount: 0,
          comments: [],
        };
      } else {
        notFoundError = true;
      }
    }

    if (notFoundError) {
      setIs404(true);
      setPost(null);
    } else if (loadedPost) {
      setPost(loadedPost);
      setComments(loadedPost.comments || []);
      setLikeCount(loadedPost.likeCount || 0);
    } else {
      setError("Impossible de charger les détails du post. Vérifiez votre connexion.");
    }

    setLoading(false);
  }, [postId, user]);

  useEffect(() => {
    loadPostDetail();
  }, [loadPostDetail]);

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commentInput.trim();
    if (!text || submittingComment) return;

    setSubmittingComment(true);

    const newCommentItem: CommentItem = {
      id: `c_${Date.now()}`,
      content: text,
      authorName: user?.username || "moi",
      createdAt: "À l'instant",
    };

    setComments((prev) => [...prev, newCommentItem]);
    setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
    setCommentInput("");
    showToast("Commentaire publié avec succès ✨");

    if (token) {
      try {
        let res = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        }).catch(() => null);

        if (!res || !res.ok) {
          await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: text }),
          }).catch(() => null);
        }
      } catch {
        // Fallback local gardé
      }
    }

    setSubmittingComment(false);
  };

  const toggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    if (token) {
      fetch(`${API_URL}/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const toggleSave = () => {
    setIsSaved((prev) => !prev);
    showToast(isSaved ? "Publication retirée de vos favoris" : "Publication enregistrée dans vos favoris ! 🔖");
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast("Lien direct copié dans le presse-papier ! 🔗");
  };

  const renderFormattedText = (text: string) => {
    return text.split(" ").map((word, i) => {
      if (word.startsWith("#")) {
        return (
          <span key={i} className="post-hashtag">
            {word}{" "}
          </span>
        );
      }
      if (word.startsWith("@")) {
        return (
          <span key={i} style={{ color: "var(--violet-400)", fontWeight: 700, cursor: "pointer" }}>
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

  // 1. Écran de chargement
  if (loading) {
    return (
      <div className="post-detail-wrapper" style={{ textAlign: "center", paddingTop: "80px" }}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }} className="animate-spin">🔄</div>
        <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Chargement de la publication...</p>
      </div>
    );
  }

  // 2. Vue 404
  if (is404) {
    return (
      <div className="post-detail-wrapper">
        <div className="post-detail-topbar">
          <button onClick={onBack} className="post-detail-back-btn">
            <span>←</span> Retour au fil d'actualité
          </button>
        </div>

        <div className="post-detail-card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <div className="post-detail-accent-line" style={{ position: "absolute", top: 0, left: 0 }} />
          <div style={{ fontSize: "56px", fontWeight: 900, color: "var(--orange-500)", marginBottom: "12px" }}>404</div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "12px" }}>Publication Introuvable</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px", maxWidth: "480px", margin: "0 auto 28px auto" }}>
            La publication spécifiée (<code className="meta-code">{postId}</code>) n'existe pas ou a été supprimée.
          </p>
          <button onClick={onBack} className="btn-primary-gradient">
            Retourner au fil d'actualité
          </button>
        </div>
      </div>
    );
  }

  // 3. Vue Erreur
  if (error || !post) {
    return (
      <div className="post-detail-wrapper">
        <div className="post-detail-topbar">
          <button onClick={onBack} className="post-detail-back-btn">
            <span>←</span> Retour au fil d'actualité
          </button>
        </div>
        <div className="post-detail-card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--orange-500)", marginBottom: "8px" }}>Erreur de chargement</h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>{error}</p>
          <button onClick={loadPostDetail} className="btn-primary-gradient">🔄 Réessayer</button>
        </div>
      </div>
    );
  }

  const rawImg = post.imageUrl;
  const imageSrc = rawImg
    ? rawImg.startsWith("http")
      ? rawImg
      : `${API_URL}${rawImg}`
    : null;

  const authorUsername = post.author?.username || "Anonyme";
  const authorLetter = authorUsername.charAt(0).toUpperCase();

  return (
    <div className="post-detail-wrapper">
      {/* Toast Pop-up Notification */}
      {toastMessage && <div className="toast-float">{toastMessage}</div>}

      {/* Barre supérieure de navigation */}
      <div className="post-detail-topbar">
        <button onClick={onBack} className="post-detail-back-btn">
          <span>←</span>
          <span>Retour au fil d'actualité</span>
        </button>

        <span className="meta-code" title={post.id} style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          #{post.id}
        </span>
      </div>

      {/* Carte Principale du Post */}
      <article className="post-detail-card">
        <div className="post-detail-accent-line" />

        {/* En-tête Auteur */}
        <div className="post-detail-author-row">
          <div className="post-detail-author-meta">
            <div className="post-detail-avatar">
              <div className="post-detail-avatar-inner">{authorLetter}</div>
            </div>
            <div className="post-detail-author-info">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="post-detail-username">@{authorUsername}</span>
                <span className="profile-role-badge" style={{ fontSize: "10px" }}>Auteur</span>
              </div>
              <span className="post-detail-date">{formatDateRelative(post.created_at)}</span>
            </div>
          </div>

          <button type="button" onClick={handleShare} className="theme-toggle-btn" title="Copier le lien direct">
            <span>🔗</span>
            <span>Partager</span>
          </button>
        </div>

        {/* Image du Post (si présente) */}
        {imageSrc && (
          <div className="post-detail-image-wrapper" onClick={() => setZoomImage(imageSrc)}>
            <img src={imageSrc} alt={post.content} className="post-detail-image" />
          </div>
        )}

        {/* Contenu textuel */}
        <div className="post-detail-content-box">
          <p>{renderFormattedText(post.content)}</p>
        </div>

        {/* Barre d'actions sociales */}
        <div className="post-detail-actions-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={toggleLike}
              className={`post-detail-action-btn ${isLiked ? "liked" : ""}`}
            >
              <span>{isLiked ? "❤️" : "🤍"}</span>
              <span>{likeCount} {likeCount > 1 ? "Likes" : "Like"}</span>
            </button>

            <div className="post-detail-action-btn" style={{ background: "rgba(139, 92, 246, 0.12)", color: "var(--violet-400)", cursor: "default" }}>
              <span>💬</span>
              <span>{comments.length} {comments.length > 1 ? "Commentaires" : "Commentaire"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSave}
            className={`post-detail-action-btn ${isSaved ? "saved" : ""}`}
          >
            <span>{isSaved ? "🔖" : "📑"}</span>
            <span>{isSaved ? "Enregistré" : "Enregistrer"}</span>
          </button>
        </div>

        {/* Section Commentaires intégrée (Critère 3) */}
        <div className="post-detail-comments-section">
          <div className="post-detail-comments-header">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--orange-500)", display: "inline-block" }} />
            <span>Discussion en direct ({comments.length})</span>
          </div>

          {/* Champ de saisie contrôlé */}
          <form onSubmit={handleAddComment} className="post-detail-comment-form">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={user ? "Partagez votre avis sur cette publication..." : "Ajouter un commentaire..."}
              className="post-detail-comment-input"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentInput.trim()}
              className="post-detail-comment-submit"
            >
              {submittingComment ? "Envoi..." : "Publier"}
            </button>
          </form>

          {/* Liste dynamique des commentaires */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="post-detail-comment-item">
                  <div className="post-detail-comment-avatar">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="post-detail-comment-body">
                    <div className="post-detail-comment-meta">
                      <span className="post-detail-comment-author">@{c.authorName}</span>
                      <span className="post-detail-comment-time">{c.createdAt}</span>
                    </div>
                    <p className="post-detail-comment-text">{c.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", border: "2px dashed var(--border-color)", borderRadius: "16px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", italic: "true", marginBottom: "4px" }}>
                  Aucune réaction pour l'instant.
                </p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--orange-500)" }}>
                  Soyez le premier à ajouter un commentaire ! 🚀
                </p>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Modal Zoom Photo */}
      {zoomImage && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 999, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", display: "flex", itemsCenter: "center", justifyCenter: "center", padding: "20px" }}
          onClick={() => setZoomImage(null)}
        >
          <div style={{ position: "relative", maxWidth: "900px", maxHeight: "90vh" }}>
            <img src={zoomImage} alt="Zoom" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)" }} />
            <button
              onClick={() => setZoomImage(null)}
              className="theme-toggle-btn"
              style={{ position: "absolute", top: "-40px", right: 0 }}
            >
              ✕ Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
