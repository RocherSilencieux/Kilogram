import React from "react";
import type { Post, CommentItem } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { avatarStyle, getAuthorDisplayName, relativeTime } from "../../utils/formatters";
import { FormattedText } from "./FormattedText";

const API_URL = "http://localhost:3000";

export interface PostEntryProps {
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

export function PostEntry({
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
                            post.comments.map((c: CommentItem) => {
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
