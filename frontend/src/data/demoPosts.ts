import type { Post } from "../types";

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
