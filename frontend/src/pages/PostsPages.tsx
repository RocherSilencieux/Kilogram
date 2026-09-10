import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 15;

export interface Author {
    id: string;
    username: string;
}

export interface Post {
    id: string;
    content: string;
    imageUrl: string | null;
    created_at: string;
    author: Author | null;
    likeCount: number;
    commentCount: number;
}

// Fonction utilitaire pour un tri décroissant 100% fiable
function sortPostsDescending(postsList: Post[]): Post[] {
    return [...postsList].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Plus récent en premier
    });
}

// Formatage de la date en français avec affichage relatif intelligent
function formatDateRelative(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffInSeconds)) return dateStr;
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

// Formatage complet pour l'attribut title (tooltip au survol)
function formatDateFull(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString("fr-FR", {
        dateStyle: "full",
        timeStyle: "short",
    });
}

const MAX_CONTENT_LENGTH = 280;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB max
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function PostsPages() {
    const { token } = useAuth();
    // Liste totale de tous les posts récupérés (triée décroissant)
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    // Posts actuellement affichés dans le DOM (par tranches)
    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
    const [page, setPage] = useState<number>(1);

    // Les 4 états UI principaux
    const [loading, setLoading] = useState<boolean>(true); // État 1 : Chargement initial
    const [error, setError] = useState<string | null>(null); // État 2 : Erreur
    const [refreshing, setRefreshing] = useState<boolean>(false); // Rafraîchissement en arrière-plan (sans clignotement)
    const [loadingMore, setLoadingMore] = useState<boolean>(false); // Pagination fluide sans clignotement

    // Formulaire de création de post
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Sentinelle pour le lazy loading automatique avec IntersectionObserver
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const hasMore = displayedPosts.length < allPosts.length;

    // 1. Récupération du flux de posts
    const fetchPosts = useCallback(async (isSilentRefresh = false) => {
        if (isSilentRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const res = await fetch(`${API_URL}/posts`);
            if (!res.ok) {
                throw new Error(`Erreur serveur (${res.status}) lors de la récupération des posts`);
            }

            const data: Post[] = await res.json();
            const sorted = sortPostsDescending(data);

            setAllPosts(sorted);
            setDisplayedPosts(sorted.slice(0, PAGE_SIZE));
            setPage(1);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Erreur de connexion au serveur");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        fetch(`${API_URL}/posts`)
            .then((res) => {
                if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
                return res.json();
            })
            .then((data: Post[]) => {
                if (!isMounted) return;
                const sorted = sortPostsDescending(data);
                setAllPosts(sorted);
                setDisplayedPosts(sorted.slice(0, PAGE_SIZE));
                setLoading(false);
            })
            .catch((err: any) => {
                if (!isMounted) return;
                setError(err.message || "Erreur de connexion au serveur");
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // 2. Chargement de la page suivante (sans clignotement)
    const loadNextPage = useCallback(() => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);

        // Léger délai pour assurer une transition fluide
        setTimeout(() => {
            const nextIndex = page * PAGE_SIZE;
            const nextBatch = allPosts.slice(nextIndex, nextIndex + PAGE_SIZE);

            setDisplayedPosts((prev) => [...prev, ...nextBatch]);
            setPage((prev) => prev + 1);
            setLoadingMore(false);
        }, 150);
    }, [loadingMore, hasMore, page, allPosts]);

    // 3. Lazy loading automatique avec IntersectionObserver
    useEffect(() => {
        const currentSentinel = sentinelRef.current;
        if (!currentSentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !loadingMore && !loading) {
                    loadNextPage();
                }
            },
            {
                root: null,
                rootMargin: "200px", // Précharge 200px avant la fin du scroll
                threshold: 0.1,
            }
        );

        observer.observe(currentSentinel);

        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel);
        };
    }, [hasMore, loadingMore, loading, loadNextPage]);

    // Gestion du choix de fichier image avec validations de taille et format
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFileError(null);
        setSubmitError(null);

        if (!file) {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImageFile(null);
            setImagePreview(null);
            return;
        }

        // 1. Contrôle du format d'image côté front
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setFileError("Format non supporté. Seules les images JPG, PNG, WEBP et GIF sont acceptées.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // 2. Contrôle de la taille du fichier côté front (max 5 Mo)
        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            setFileError(`Image trop lourde (${sizeMB} Mo). La taille maximale autorisée est de 5 Mo.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // 3. Génération de la prévisualisation d'image
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        const previewUrl = URL.createObjectURL(file);
        setImageFile(file);
        setImagePreview(previewUrl);
    };

    // Suppression de la photo sélectionnée
    const handleRemoveImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // 4. Publication d'un post (Multipart form-data)
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const trimmedContent = content.trim();

        // Validation contenu non vide
        if (!trimmedContent) {
            setSubmitError("Le contenu du message ne peut pas être vide.");
            return;
        }

        // Validation de la longueur maximale
        if (content.length > MAX_CONTENT_LENGTH) {
            setSubmitError(`Le texte dépasse la limite autorisée de ${MAX_CONTENT_LENGTH} caractères.`);
            return;
        }

        if (fileError) return;

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("content", trimmedContent);
            if (imageFile) {
                formData.append("image", imageFile);
            }


            const res = await fetch(`${API_URL}/posts`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 401) {
                    throw new Error("Vous devez être connecté pour publier un post (Token JWT manquant ou expiré).");
                }
                throw new Error(errData.error || `Erreur serveur (${res.status}) lors de la publication`);
            }

            const newPost: Post = await res.json();

            // Insère immédiatement le post au sommet avec tri décroissant sans rechargement
            setAllPosts((prev) => sortPostsDescending([newPost, ...prev]));
            setDisplayedPosts((prev) => [newPost, ...prev]);

            // Réinitialisation du formulaire uniquement en cas de succès
            setContent("");
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImageFile(null);
            setImagePreview(null);
            setFileError(null);
            setSubmitError(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            // En cas d'échec : Le contenu et la sélection d'image restent conservés dans le formulaire !
            setSubmitError(err.message || "Erreur lors de la création de la publication");
        } finally {
            setSubmitting(false);
        }
    };

    // 5. Like d'un post
    const handleLike = async (postId: string) => {
        if (!token) {
            alert("Connectez-vous pour liker !");
            return;
        }

        try {
            // Mise à jour optimiste instantanée
            setDisplayedPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p
                )
            );

            await fetch(`${API_URL}/posts/${postId}/like`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error("Erreur lors du like :", err);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-8 px-4 font-sans antialiased text-gray-900">
            {/* Entête du feed */}
            <header className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Kilogram</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            Feed
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {allPosts.length > 0
                            ? `Fil d'actualité • ${allPosts.length} posts disponibles`
                            : "Fil d'actualité"}
                    </p>
                </div>
                <button
                    onClick={() => fetchPosts(true)}
                    disabled={loading || refreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition disabled:opacity-50"
                    title="Actualiser la liste sans recharger la page"
                >
                    <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                    <span>{refreshing ? "Mise à jour..." : "Actualiser"}</span>
                </button>
            </header>

            {/* Formulaire nouveau post (S4) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 mb-8 transition hover:border-gray-300">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <span>✏️</span>
                        <span>Créer une publication</span>
                    </h2>
                    {/* Compteur dynamique de caractères */}
                    <span
                        className={`text-xs font-mono font-medium ${
                            content.length > MAX_CONTENT_LENGTH
                                ? "text-red-500 font-bold"
                                : content.length > MAX_CONTENT_LENGTH * 0.8
                                ? "text-amber-500"
                                : "text-gray-400"
                        }`}
                    >
                        {content.length} / {MAX_CONTENT_LENGTH}
                    </span>
                </div>

                {/* Affichage des erreurs API ou de fichier (Formulaire non perdu) */}
                {(submitError || fileError) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                            <span>⚠️</span>
                            <span>{submitError || fileError}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSubmitError(null);
                                setFileError(null);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold text-sm leading-none"
                            title="Fermer le message d'erreur"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                        <textarea
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                if (submitError) setSubmitError(null);
                            }}
                            placeholder="Quoi de neuf aujourd'hui ?"
                            rows={3}
                            disabled={submitting}
                            className={`w-full resize-none p-3.5 border rounded-xl focus:outline-none focus:ring-2 text-sm placeholder-gray-400 transition ${
                                content.length > MAX_CONTENT_LENGTH
                                    ? "border-red-400 bg-red-50/30 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-purple-500/20 focus:border-purple-500"
                            }`}
                        />
                    </div>

                    {/* Miniature de prévisualisation de l'image sélectionnée avant envoi */}
                    {imagePreview && (
                        <div className="relative inline-block group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-56">
                            <img
                                src={imagePreview}
                                alt="Prévisualisation avant envoi"
                                className="max-h-56 w-auto object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    disabled={submitting}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1"
                                >
                                    <span>✕</span>
                                    <span>Retirer l'image</span>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                disabled={submitting}
                                className="sm:hidden absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full text-xs"
                                aria-label="Retirer l'image"
                            >
                                ✕
                            </button>
                            {imageFile && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-md font-mono">
                                    {(imageFile.size / (1024 * 1024)).toFixed(2)} Mo
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        <label className={`flex items-center gap-2 text-xs text-gray-600 hover:text-purple-600 transition ${submitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                            <span className="p-1.5 bg-gray-100 rounded-lg text-base">📷</span>
                            <span className="truncate max-w-[220px] font-medium">
                                {imageFile ? imageFile.name : "Ajouter une photo (JPG, PNG, WEBP, GIF)"}
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageChange}
                                disabled={submitting}
                                className="hidden"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                !content.trim() ||
                                content.length > MAX_CONTENT_LENGTH ||
                                !!fileError
                            }
                            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-95 disabled:opacity-40 transition shadow-sm flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="animate-spin text-base">⏳</span>
                                    <span>Publication en cours...</span>
                                </>
                            ) : (
                                <span>Publier</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* ======================================================== */}
            {/* GESTION DES 4 ÉTATS UI                                    */}
            {/* ======================================================== */}

            {/* ÉTAT 1 : Chargement Initial (Skeleton Loader) */}
            {loading && (
                <div className="space-y-6" aria-busy="true" aria-label="Chargement des publications">
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 space-y-4 animate-pulse"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
                                    <div className="h-2.5 bg-gray-100 rounded-md w-1/5" />
                                </div>
                            </div>
                            <div className="w-full h-56 bg-gray-200 rounded-xl" />
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded-md w-4/5" />
                                <div className="h-3 bg-gray-100 rounded-md w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ÉTAT 2 : Erreur */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 space-y-3">
                    <div className="text-3xl">⚠️</div>
                    <h3 className="font-semibold text-base">Impossible de charger les posts</h3>
                    <p className="text-sm text-red-600 max-w-sm mx-auto">{error}</p>
                    <button
                        onClick={() => fetchPosts()}
                        className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {/* ÉTAT 3 : Liste Vide */}
            {!loading && !error && allPosts.length === 0 && (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500 space-y-3">
                    <div className="text-4xl">📭</div>
                    <h3 className="text-base font-semibold text-gray-800">Aucun post pour le moment</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Le fil est vide. Soyez le tout premier à publier un message ou une photo !
                    </p>
                </div>
            )}

            {/* ÉTAT 4 : Succès avec Liste de Posts (Tri décroissant & Pagination fluide) */}
            {!loading && !error && displayedPosts.length > 0 && (
                <div className="space-y-6">
                    {displayedPosts.map((post) => {
                        const rawImageUrl = post.imageUrl;
                        const imageUrl = rawImageUrl
                            ? rawImageUrl.startsWith("http")
                                ? rawImageUrl
                                : `${API_URL}${rawImageUrl}`
                            : null;

                        const authorName = post.author?.username || "Anonyme";
                        const initialLetter = authorName.charAt(0).toUpperCase() || "U";

                        return (
                            <article
                                key={post.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden transition hover:shadow-md"
                            >
                                {/* Entête du post : Auteur et Date */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                            aria-hidden="true"
                                        >
                                            {initialLetter}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm leading-tight">
                                                {authorName}
                                            </p>
                                            <p
                                                className="text-xs text-gray-400 cursor-default"
                                                title={formatDateFull(post.created_at)}
                                            >
                                                {formatDateRelative(post.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">
                                        #{post.id.slice(-4)}
                                    </span>
                                </div>

                                {/* Image du post */}
                                {imageUrl && (
                                    <div className="w-full bg-gray-100 max-h-[520px] flex items-center justify-center overflow-hidden border-y border-gray-100">
                                        <img
                                            src={imageUrl}
                                            alt={`Publication de ${authorName}`}
                                            className="w-full h-auto object-cover max-h-[520px]"
                                            loading="lazy"
                                            onError={(e) => {
                                                // Masque proprement si l'image distante est introuvable
                                                (e.target as HTMLElement).style.display = "none";
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Contenu textuel */}
                                {post.content && (
                                    <div className="p-4 pt-3.5">
                                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                            {post.content}
                                        </p>
                                    </div>
                                )}

                                {/* Actions : Likes et Commentaires */}
                                <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-gray-600 text-sm">
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className="group flex items-center space-x-1.5 hover:text-red-500 transition active:scale-95"
                                            title="Aimer ce post"
                                        >
                                            <span className="group-hover:scale-110 transition">❤️</span>
                                            <span className="font-medium text-xs sm:text-sm">
                                                {post.likeCount}
                                            </span>
                                        </button>
                                        <div
                                            className="flex items-center space-x-1.5 text-gray-500"
                                            title="Commentaires"
                                        >
                                            <span>💬</span>
                                            <span className="font-medium text-xs sm:text-sm">
                                                {post.commentCount}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-gray-400">
                                        {formatDateFull(post.created_at)}
                                    </span>
                                </div>
                            </article>
                        );
                    })}

                    {/* Zone de sentinelle pour le lazy loading automatique */}
                    <div ref={sentinelRef} className="h-4" />

                    {/* Indicateur pendant le chargement de la page suivante (ne fait PAS clignoter la liste) */}
                    {loadingMore && (
                        <div className="py-4 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-xs font-medium text-gray-600 animate-pulse">
                                <span className="animate-spin">⏳</span>
                                <span>Chargement des posts suivants...</span>
                            </div>
                        </div>
                    )}

                    {/* Bouton manuel "Charger plus" si l'utilisateur souhaite cliquer */}
                    {hasMore && !loadingMore && (
                        <div className="pt-2 text-center">
                            <button
                                onClick={loadNextPage}
                                className="px-5 py-2.5 bg-white border border-gray-300 hover:border-purple-400 hover:text-purple-600 rounded-xl text-sm font-medium text-gray-700 shadow-sm transition active:scale-95"
                            >
                                Charger plus de posts ({allPosts.length - displayedPosts.length} restants)
                            </button>
                        </div>
                    )}

                    {/* Indicateur de fin de liste */}
                    {!hasMore && allPosts.length > 0 && (
                        <div className="py-8 text-center text-xs text-gray-400 border-t border-gray-200/60 mt-8">
                            ✨ Vous avez parcouru la totalité des {allPosts.length} posts !
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
