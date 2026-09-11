import type { Author, Post } from "../types";

export function sortDesc(posts: Post[]): Post[] {
    return [...posts].sort((a, b) => {
        const tA = new Date(a.created_at || 0).getTime() || 0;
        const tB = new Date(b.created_at || 0).getTime() || 0;
        return tB - tA;
    });
}

export function relativeTime(dateStr: string): string {
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

export const AVATAR_PALETTE = [
    ["#ddd4f5", "#1a1520"], ["#fde68a", "#3a3000"], ["#fecaca", "#3b0f0f"],
    ["#bbf7d0", "#0f2e1a"], ["#bae6fd", "#0c2333"], ["#e9d5ff", "#2d1254"],
];

export function avatarStyle(username: string): { bg: string; fg: string } {
    const idx = username.charCodeAt(0) % AVATAR_PALETTE.length;
    return { bg: AVATAR_PALETTE[idx][0], fg: AVATAR_PALETTE[idx][1] };
}

export function getAuthorDisplayName(
    author: Author | null,
    loggedInUser: { id?: string; username?: string } | null
): { id: string; username: string } {
    if (!author) {
        if (loggedInUser?.username) return { id: loggedInUser.id || "me", username: loggedInUser.username };
        return { id: "anon", username: "Anonyme" };
    }

    if (loggedInUser && (author.id === loggedInUser.id || author.username === loggedInUser.username || author.id === "user_alice")) {
        return { id: loggedInUser.id || author.id, username: loggedInUser.username || author.username };
    }

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
