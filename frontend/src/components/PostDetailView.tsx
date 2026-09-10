import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { type Post, type CommentItem, DEMO_FEED_POSTS } from "../pages/PostsPages";

const API_URL = "http://localhost:3000";

const AVATAR_PALETTE = [
  ["#ddd4f5", "#1a1520"], ["#fde68a", "#3a3000"], ["#fecaca", "#3b0f0f"],
  ["#bbf7d0", "#0f2e1a"], ["#bae6fd", "#0c2333"], ["#e9d5ff", "#2d1254"],
];
function avatarStyle(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  return { bg: AVATAR_PALETTE[idx][0], fg: AVATAR_PALETTE[idx][1] };
}

interface PostDetailViewProps {
  postId: string;
  onBack: () => void;
  onNavigateToProfile?: (userId: string) => void;
}

function relTime(dateStr: string): string {
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

function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({ postId, onBack, onNavigateToProfile }) => {
  const { token, user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [is404, setIs404] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
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
            const rawComments = Array.isArray(raw.comments) ? raw.comments : [];
            const formattedComments: CommentItem[] = rawComments.map((cItem: unknown) => {
              const c = cItem as Record<string, unknown>;
              const cAuthor = typeof c.author === "object" && c.author !== null ? (c.author as Record<string, unknown>) : null;
              return {
                id: String(c.id ?? ""),
                content: typeof c.content === "string" ? c.content : "",
                authorName: typeof cAuthor?.username === "string" ? cAuthor.username : "utilisateur",
                createdAt: relTime(typeof c.createdAt === "string" ? c.createdAt : (typeof c.created_at === "string" ? c.created_at : new Date().toISOString())),
              };
            });
            loadedPost = {
              id: String(raw.id), content: raw.content || "",
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
    } catch {}

    if (!loadedPost && !notFoundError) {
      const demoMatch = DEMO_FEED_POSTS.find((p) => p.id === postId);
      if (demoMatch) {
        loadedPost = demoMatch;
      } else if (postId.startsWith("post_local_")) {
        loadedPost = {
          id: postId, content: "Publication récente en mode démo", imageUrl: null,
          created_at: new Date().toISOString(),
          author: { id: user?.id || "me", username: user?.username || "moi" },
          likeCount: 1, commentCount: 0, comments: [],
        };
      } else {
        notFoundError = true;
      }
    }

    if (notFoundError) {
      setIs404(true); setPost(null);
    } else if (loadedPost) {
      setPost(loadedPost);
      setComments(loadedPost.comments || []);
      setLikeCount(loadedPost.likeCount || 0);
    } else {
      setError("Impossible de charger le croquis. Vérifiez votre connexion.");
    }
    setLoading(false);
  }, [postId, user]);

  useEffect(() => { loadPostDetail(); }, [loadPostDetail]);

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commentInput.trim();
    if (!text || submittingComment) return;
    setSubmittingComment(true);
    const newComment: CommentItem = {
      id: `c_${Date.now()}`, content: text,
      authorName: user?.username || "moi",
      createdAt: "à l'instant",
    };
    setComments((prev) => [...prev, newComment]);
    setPost((prev) => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
    setCommentInput("");
    showToast("Note gribouillée ! ✏️");

    if (token) {
      try {
        let res = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: text }),
        }).catch(() => null);
        if (!res || !res.ok) {
          await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content: text }),
          }).catch(() => null);
        }
      } catch {}
    }
    setSubmittingComment(false);
  };

  const toggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => isLiked ? Math.max(0, prev - 1) : prev + 1);
    if (token) {
      fetch(`${API_URL}/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const toggleSave = () => {
    setIsSaved((prev) => !prev);
    showToast(isSaved ? "Retiré des épingles" : "Épinglé dans le carnet ! 📌");
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast("Lien copié ! 🔗");
  };

  const renderText = (text: string) =>
    text.split(" ").map((word, i) => {
      if (word.startsWith("#"))
        return <span key={i} className="post-hashtag">{word} </span>;
      if (word.startsWith("@"))
        return <span key={i} style={{ color: "var(--ink-purple)", fontWeight: 700 }}>{word} </span>;
      return word + " ";
    });

  // ── Resolving author username ──
  const resolveAuthorName = () => {
    let name = post?.author?.username || "Anonyme";
    if (user && (post?.author?.id === user.id || post?.author?.username === user.username || post?.author?.id === "user_alice")) {
      return user.username;
    }
    if (post?.author?.id) {
      try {
        const saved = localStorage.getItem(`kilogram_custom_profile_${post.author.id}`);
        if (saved) { const p = JSON.parse(saved); if (p?.username) return p.username; }
      } catch {}
    }
    return name;
  };

  const resolveCommentName = (authorName: string) => {
    if (user && (authorName === user.username || authorName === "moi" || authorName === "alice")) {
      return user.username;
    }
    try {
      const saved = localStorage.getItem(`kilogram_custom_profile_${authorName.toLowerCase()}`);
      if (saved) { const p = JSON.parse(saved); if (p?.username) return p.username; }
    } catch {}
    return authorName;
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="notebook-page" style={{ display: "grid", gridTemplateColumns: "var(--margin-col-w) 1fr", padding: "calc(var(--line-height-ruled) * 4) 0", textAlign: "center" }}>
        <div />
        <div style={{ paddingLeft: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36, animation: "spin 1.2s linear infinite" }}>✏️</div>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-light)" }}>
            Ouverture de la page du carnet...
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="ink-line" style={{ width: `${40 + n * 15}px`, height: "var(--line-height-ruled)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 404 ──
  if (is404) {
    return (
      <div className="notebook-page">
        <div style={{ display: "grid", gridTemplateColumns: "var(--margin-col-w) 1fr", padding: "calc(var(--line-height-ruled) * 1.5) 0" }}>
          <div />
          <div style={{ paddingLeft: 18 }}>
            <button
              onClick={onBack}
              style={{
                fontFamily: "var(--font-hand)", fontSize: 13, fontWeight: 700,
                color: "var(--ink)", background: "none", border: "1.5px solid var(--ink)",
                borderRadius: 4, padding: "4px 14px", cursor: "pointer",
                boxShadow: "2px 2px 0 var(--ink)", transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(-1deg)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              ← fil d'actualité
            </button>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "var(--margin-col-w) 1fr",
          padding: "calc(var(--line-height-ruled) * 3) 0",
        }}>
          <div />
          <div style={{ paddingLeft: 18 }}>
            <div style={{
              background: "#fff", border: "2px solid var(--ink)", borderRadius: 8,
              padding: "32px 28px", boxShadow: "5px 5px 0 var(--ink)",
              transform: "rotate(-0.5deg)", textAlign: "center", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -11, left: 28, width: 52, height: 16,
                background: "rgba(255,235,130,0.8)", border: "1px solid rgba(200,170,50,0.3)",
                borderRadius: 2, transform: "rotate(-2deg)",
              }} />
              <div style={{ fontFamily: "var(--font-hand)", fontWeight: 900, fontSize: 48, color: "var(--ink-red)", lineHeight: 1 }}>
                404
              </div>
              <div style={{ fontFamily: "var(--font-hand)", fontWeight: 700, fontSize: 18, color: "var(--ink)", marginTop: 8, marginBottom: 16 }}>
                White Space
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-light)", fontStyle: "italic", lineHeight: 1.6 }}>
                "Ce croquis n'existe pas dans le carnet..."
              </p>
              <button
                onClick={onBack}
                style={{
                  marginTop: 20, fontFamily: "var(--font-hand)", fontSize: 13, fontWeight: 700,
                  color: "#fff", background: "var(--ink-purple)", border: "1.5px solid var(--ink)",
                  borderRadius: 4, padding: "6px 18px", cursor: "pointer",
                  boxShadow: "2px 2px 0 var(--ink)",
                }}
              >
                Retourner au fil →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !post) {
    return (
      <div className="notebook-page" style={{ display: "grid", gridTemplateColumns: "var(--margin-col-w) 1fr", padding: "calc(var(--line-height-ruled) * 3) 0" }}>
        <div />
        <div style={{ paddingLeft: 18, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-red)" }}>
            ⚠️ {error || "Impossible de charger le croquis."}
          </p>
          <button onClick={loadPostDetail} style={{
            marginTop: 12, fontFamily: "var(--font-hand)", fontSize: 13,
            color: "var(--ink-purple)", background: "none", border: "1.5px solid var(--ink-purple)",
            borderRadius: 4, padding: "4px 14px", cursor: "pointer",
          }}>
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  const rawImg = post.imageUrl;
  const imageSrc = rawImg ? (rawImg.startsWith("http") ? rawImg : `${API_URL}${rawImg}`) : null;
  const authorUsername = resolveAuthorName();
  const { bg: avatarBg, fg: avatarFg } = avatarStyle(authorUsername);

  return (
    <>
      {/* Toast */}
      {toast && <div className="toast-note">{toast}</div>}

      {/* Zoom image */}
      {zoomImage && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(10,8,20,0.92)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", animation: "fadeIn 0.15s ease",
          }}
          onClick={() => setZoomImage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", padding: "10px 10px 42px",
              border: "2px solid var(--ink)",
              boxShadow: "8px 8px 0 var(--ink)",
              maxWidth: "min(90vw, 720px)",
              position: "relative", transform: "rotate(-1deg)",
            }}
          >
            <div style={{
              position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
              width: 52, height: 16, background: "rgba(255,235,130,0.8)",
              border: "1px solid rgba(200,170,50,0.3)", borderRadius: 2,
            }} />
            <img src={zoomImage} alt="Zoom" style={{ display: "block", maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }} />
            <button
              onClick={() => setZoomImage(null)}
              style={{
                position: "absolute", bottom: 8, right: 12,
                fontFamily: "var(--font-hand)", fontSize: 12, fontWeight: 700,
                color: "var(--ink-faded)", background: "none", border: "1px solid var(--ink-faded)",
                borderRadius: 3, padding: "2px 8px", cursor: "pointer",
              }}
            >
              ✕ fermer
            </button>
          </div>
        </div>
      )}

      <div className="notebook-page">

        {/* ── Bouton retour dans la marge ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "var(--margin-col-w) 1fr",
          padding: "calc(var(--line-height-ruled) * 0.75) 0",
        }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 2 }}>
            <button
              onClick={onBack}
              style={{
                fontFamily: "var(--font-caveat)", fontSize: 11, color: "var(--ink-light)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                writingMode: "vertical-rl", letterSpacing: 0.5,
                transition: "color 0.15s", lineHeight: 1.3,
              }}
              title="Retour au fil"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-purple)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-light)")}
            >
              ← retour
            </button>
          </div>
          <div style={{ paddingLeft: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={onBack}
              style={{
                fontFamily: "var(--font-hand)", fontSize: 13, fontWeight: 700,
                color: "var(--ink)", background: "none", border: "1.5px solid var(--ink)",
                borderRadius: 4, padding: "4px 14px", cursor: "pointer",
                boxShadow: "2px 2px 0 var(--ink)", transition: "transform 0.1s, box-shadow 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "rotate(-1deg)"; e.currentTarget.style.boxShadow = "3px 3px 0 var(--ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "2px 2px 0 var(--ink)"; }}
            >
              ← fil d'actualité
            </button>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-light)",
              border: "1px solid var(--ink-light)", borderRadius: 2, padding: "1px 8px",
            }}>
              #{String(post.id).slice(0, 8)}
            </span>
          </div>
        </div>

        {/* ── Entrée principale — layout 2 colonnes ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "var(--margin-col-w) 1fr",
          borderTop: "2px dashed rgba(22,18,31,0.12)",
          paddingTop: "calc(var(--line-height-ruled) * 1)",
          marginTop: "calc(var(--line-height-ruled) * 0.25)",
        }}>
          {/* Marge gauche */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingRight: 10, paddingTop: 4 }}>
            {/* Avatar cliquable */}
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: avatarBg, color: avatarFg,
                border: "2px solid var(--ink)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-hand)", fontWeight: 700, fontSize: 19,
                boxShadow: "3px 3px 0 var(--ink)",
                cursor: post.author?.id && onNavigateToProfile ? "pointer" : "default",
                transition: "transform 0.15s",
                flexShrink: 0,
              }}
              title={`Voir @${authorUsername}`}
              onClick={() => post.author?.id && onNavigateToProfile?.(post.author.id)}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { if (post.author?.id) e.currentTarget.style.transform = "rotate(-6deg) scale(1.1)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = ""; }}
            >
              {authorUsername.charAt(0).toUpperCase()}
            </div>

            {/* Like stamp */}
            <button
              onClick={toggleLike}
              title={isLiked ? "Retirer le like" : "Liker"}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                background: "none", border: "none", cursor: "pointer",
                transition: "transform 0.12s",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = "scale(1.15) rotate(-3deg)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ""; }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{isLiked ? "❤️" : "🤍"}</span>
              <span style={{
                fontFamily: "var(--font-hand)", fontWeight: 700, fontSize: 13,
                color: isLiked ? "var(--ink-red)" : "var(--ink-faded)", lineHeight: 1,
              }}>
                {likeCount}
              </span>
            </button>

            {/* Épingle */}
            <button
              onClick={toggleSave}
              title={isSaved ? "Retirer l'épingle" : "Épingler"}
              style={{
                fontSize: 16, background: "none", border: "none", cursor: "pointer",
                transition: "transform 0.15s", lineHeight: 1,
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = "scale(1.2) rotate(5deg)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ""; }}
            >
              {isSaved ? "🔖" : "📌"}
            </button>

            {/* Date */}
            <span style={{
              fontFamily: "var(--font-caveat)", fontSize: 11,
              color: "var(--ink-light)", textAlign: "center", lineHeight: 1.3,
            }}>
              {relTime(post.created_at)}
            </span>
          </div>

          {/* Contenu principal */}
          <div style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Auteur + date complète */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              lineHeight: "var(--line-height-ruled)", flexWrap: "wrap", gap: 8,
            }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: post.author?.id && onNavigateToProfile ? "pointer" : "default",
                }}
                onClick={() => post.author?.id && onNavigateToProfile?.(post.author.id)}
              >
                <span style={{
                  fontFamily: "var(--font-hand)", fontWeight: 700, fontSize: 16,
                  color: "var(--ink-purple)",
                }}>
                  @{authorUsername}
                </span>
                <span style={{
                  fontFamily: "var(--font-caveat)", fontSize: 11, color: "var(--ink-faded)",
                  border: "1px solid var(--ink-faded)", borderRadius: 3, padding: "1px 6px",
                }}>
                  auteur
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-caveat)", fontSize: 12, color: "var(--ink-light)" }}>
                  {fullDate(post.created_at)}
                </span>
                <button
                  onClick={handleShare}
                  style={{
                    fontFamily: "var(--font-hand)", fontSize: 11, fontWeight: 700,
                    color: "var(--ink-faded)", background: "none", border: "1px solid var(--ink-faded)",
                    borderRadius: 3, padding: "1px 8px", cursor: "pointer",
                    transition: "color 0.12s, border-color 0.12s",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "var(--ink-teal)"; e.currentTarget.style.borderColor = "var(--ink-teal)"; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "var(--ink-faded)"; e.currentTarget.style.borderColor = "var(--ink-faded)"; }}
                >
                  🔗 lien
                </button>
              </div>
            </div>

            {/* Corps du texte — sur les lignes du cahier */}
            <p className="post-body" style={{ cursor: "default", marginTop: 0 }}>
              {renderText(post.content)}
            </p>

            {/* Photo polaroïd */}
            {imageSrc && (
              <div style={{ margin: "calc(var(--line-height-ruled) * 0.75) 0", alignSelf: "flex-start" }}>
                <div
                  onClick={() => setZoomImage(imageSrc)}
                  style={{
                    background: "#fff", padding: "8px 8px 36px",
                    border: "1.5px solid rgba(22,18,31,0.15)",
                    boxShadow: "4px 5px 14px rgba(22,18,31,0.22)",
                    transform: "rotate(-2deg)", cursor: "zoom-in",
                    maxWidth: 340, position: "relative",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = "rotate(0deg) scale(1.02)";
                    e.currentTarget.style.boxShadow = "7px 9px 22px rgba(22,18,31,0.3)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = "rotate(-2deg)";
                    e.currentTarget.style.boxShadow = "4px 5px 14px rgba(22,18,31,0.22)";
                  }}
                >
                  {/* Scotch */}
                  <div style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    width: 50, height: 16, background: "rgba(255,235,130,0.8)",
                    border: "1px solid rgba(200,170,50,0.3)", borderRadius: 2,
                  }} />
                  <img
                    src={imageSrc} alt={post.content}
                    style={{ display: "block", width: "100%", maxHeight: 420, objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute", bottom: 8, right: 10,
                    fontFamily: "var(--font-hand)", fontSize: 10, color: "#999",
                  }}>
                    🔍 agrandir
                  </div>
                </div>
              </div>
            )}

            {/* Compteur commentaires */}
            <div style={{
              lineHeight: "var(--line-height-ruled)",
              display: "flex", alignItems: "center", gap: 6,
              borderTop: "1px dashed rgba(22,18,31,0.12)",
              paddingTop: "calc(var(--line-height-ruled) * 0.5)",
              marginTop: "calc(var(--line-height-ruled) * 0.5)",
            }}>
              <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, fontWeight: 700, color: "var(--ink-purple)" }}>
                💬 {comments.length} note{comments.length !== 1 ? "s" : ""} gribouillée{comments.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── Section commentaires — post-its ── */}
            <div style={{ marginTop: "calc(var(--line-height-ruled) * 0.75)", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Input commentaire */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(22,18,31,0.03)",
                border: "1.5px dashed rgba(22,18,31,0.22)",
                borderRadius: 4, padding: "6px 10px",
                transition: "border-color 0.15s, border-style 0.15s",
              }}
                onFocus={(e) => { e.currentTarget.style.borderStyle = "solid"; e.currentTarget.style.borderColor = "var(--ink-purple)"; }}
                onBlur={(e) => { e.currentTarget.style.borderStyle = "dashed"; e.currentTarget.style.borderColor = "rgba(22,18,31,0.22)"; }}
              >
                <input
                  type="text"
                  className="comment-input"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(); }}
                  placeholder="Gribouillez un commentaire..."
                  aria-label="Ajouter un commentaire"
                />
                <button
                  className="comment-send-btn"
                  onClick={() => handleAddComment()}
                  disabled={!commentInput.trim() || submittingComment}
                >
                  {submittingComment ? "..." : "✏️ noter"}
                </button>
              </div>

              {/* Liste des commentaires */}
              {comments.length === 0 ? (
                <p className="comments-empty">
                  Pas encore de notes... Soyez le premier à gribouillez ici ! ✏️
                </p>
              ) : (
                comments.map((c) => {
                  const cName = resolveCommentName(c.authorName);
                  const { bg: cbg, fg: cfg } = avatarStyle(cName);
                  return (
                    <div key={c.id} className="comment-sticky">
                      <div className="sticky-author">
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: cbg, color: cfg,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                          border: "1px solid rgba(0,0,0,0.15)",
                        }}>
                          {cName.charAt(0).toUpperCase()}
                        </span>
                        @{cName}
                        <span className="sticky-author-time">{c.createdAt}</span>
                      </div>
                      <p className="sticky-body">{c.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Espace en bas de page */}
        <div style={{ height: "calc(var(--line-height-ruled) * 3)" }} />
      </div>
    </>
  );
};
