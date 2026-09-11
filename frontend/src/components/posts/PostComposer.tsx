import React from "react";
import { avatarStyle } from "../../utils/formatters";

interface PostComposerProps {
    user: { username?: string } | null;
    content: string;
    imagePreview: string | null;
    submitting: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onContentChange: (value: string) => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    onCreatePost: (e: React.FormEvent) => void;
    maxLen?: number;
}

export function PostComposer({
    user,
    content,
    imagePreview,
    submitting,
    fileInputRef,
    onContentChange,
    onImageChange,
    onRemoveImage,
    onCreatePost,
    maxLen = 280,
}: PostComposerProps) {
    const userAvatarStyle = avatarStyle(user?.username || "m");

    return (
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
                onChange={(e) => onContentChange(e.target.value)}
                placeholder={`Qu'avez-vous dessiné aujourd'hui, ${user?.username || "esquisseur"} ?`}
                rows={3}
                aria-label="Écrire un nouveau post"
            />

            {imagePreview && (
                <div className="composer-img-preview">
                    <img src={imagePreview} alt="Aperçu" />
                    <button className="composer-img-remove" onClick={onRemoveImage} title="Retirer">✕</button>
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
                            onChange={onImageChange}
                            style={{ display: "none" }}
                        />
                    </label>

                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {["🌅", "🖤", "✨", "☕", "🏔️"].map((em) => (
                            <button
                                key={em}
                                type="button"
                                onClick={() => onContentChange(`${content} ${em}`)}
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
                    <span className={`char-count ${content.length > maxLen ? "over" : ""}`}>
                        {content.length}/{maxLen}
                    </span>
                    <button
                        id="submit-new-post"
                        className="publish-btn"
                        onClick={onCreatePost}
                        disabled={submitting || !content.trim() || content.length > maxLen}
                    >
                        {submitting ? "en cours..." : "✏️ noter"}
                    </button>
                </div>
            </div>
        </div>
    );
}
