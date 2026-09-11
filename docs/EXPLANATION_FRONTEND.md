# Explanation & Architecture of the Frontend Codebase (Kilogram)

This document provides a detailed breakdown of every component, state, and API service in the `frontend` folder of the Kilogram application.
You can write your questions, notes, or modifications directly inside this document (e.g. in the question blocks) and send it back for answers!

---

## 1. Global Architecture Overview

The frontend is built with:
- **React 18 + TypeScript**: Type-safe component tree.
- **Vite**: Ultra-fast build tool and dev server.
- **Context API (`AuthContext.tsx`)**: Global user session management (JWT token + local user data).
- **Client-side Router (`App.tsx`)**: Dynamic URL path parsing (`window.location.pathname`).
- **CSS Design System (`index.css`)**: Vanilla CSS with custom properties (CSS variables) for light ("Papier Croquis") and dark ("Black Space") themes inspired by sketchbook aesthetics.

---

## 2. Entrypoint: `frontend/src/main.tsx`

### Role
Mounts the root React application onto the `#root` DOM container defined in `index.html`.

### Line-by-Line Breakdown
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```
- **Line 1-4**: Imports React core, ReactDOM client renderer, main `App` component, and global CSS.
- **Line 6-10**: `createRoot` targets `<div id="root"></div>` in `index.html`. `React.StrictMode` activates extra development checks and warnings for side-effects.

> [!NOTE]
> ❓ **Vos questions sur `main.tsx`** :
> (Écrivez vos remarques ou questions ici)

---

## 3. Main Container & Routing: `frontend/src/App.tsx`

### Role
Serves as the root container of Kilogram. It manages:
1. URL routing (`parseCurrentRoute`).
2. Global theme state (Light / Dark mode toggle).
3. Main navigation header (`HeaderNav`).
4. Rendering active views (`PostsPages`, `ProfileView`, `PostDetailView`).

### Key Structures
```tsx
type RouteState =
  | { type: 'feed' }
  | { type: 'profile'; userId?: string }
  | { type: 'post-detail'; postId: string };
```
- **`parseCurrentRoute()`**: Inspects `window.location.pathname` on load and pop-state events:
  - `/posts/:id` -> shows detailed post view (`PostDetailView`).
  - `/profile/:userId` -> shows user profile (`ProfileView`).
  - `/` -> shows main sketchbook feed (`PostsPages`).

- **`HeaderNav` Component**:
  - Displays sticky top bar with logo (`Kilogram ✏️`).
  - Tab buttons ("📜 Fil d'actualité", "👤 Mon profil").
  - Theme toggle ("☀️ clair" / "🌙 sombre").
  - Auth controls ("Connexion", "Inscription", "Déconnexion").

- **`App` Component**:
  - Wraps everything in `<AuthProvider>`.
  - Listens to browser navigation (`popstate` event for back/forward browser buttons).

> [!NOTE]
> ❓ **Vos questions sur `App.tsx`** :
> (Écrivez vos remarques ou questions ici)

---

## 4. Global Authentication State: `frontend/src/context/AuthContext.tsx`

### Role
Provides global authentication context (`user`, `token`, `login`, `logout`) to all components via `useAuth()`.

### Key Code & State
```tsx
export interface User {
    id: string;
    username: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}
```
- **State initialization**:
  - On startup, reads `localStorage.getItem("kilogram_token")` and `localStorage.getItem("kilogram_user")`.
- **`login(token, user)`**:
  - Saves token and user to `localStorage`.
  - Updates React state `token` and `user` to trigger immediate re-render across the entire app.
- **`logout()`**:
  - Clears `localStorage` keys and resets state to `null`.

> [!NOTE]
> ❓ **Vos questions sur `AuthContext.tsx`** :
> (Écrivez vos remarques ou questions ici)

---

## 5. Login & Registration Modal: `frontend/src/components/AuthModal.tsx`

### Role
Renders a pop-up modal dialog for user login and registration.

### Key Logic
- **Prop `initialMode`**: Can open in `'login'` or `'register'` mode.
- **State sync**: `useEffect` resets internal `mode` state whenever `isOpen` or `initialMode` changes.
- **`handleLoginSubmit`**:
  - Validates `email` and `password`.
  - Sends `{ email, password }` to backend `POST /auth/login`.
  - On success: calls `login(data.token, data.user)` and closes modal.
- **`handleRegisterSubmit`**:
  - Sends `{ username, email, password }` to backend `POST /auth/register`.
  - Automatically logs in the new user upon successful registration.

> [!NOTE]
> ❓ **Vos questions sur `AuthModal.tsx`** :
> (Écrivez vos remarques ou questions ici)

---

## 6. Main Feed & Post Management: `frontend/src/pages/PostsPages.tsx`

### Role
The primary page of Kilogram. Displays the sketchbook post composer, filter tabs, infinite scroll feed, and post entries.

### Main Components & Logic
1. **`DEMO_FEED_POSTS`**:
   - Pre-filled sample posts used when backend is offline or empty.
2. **`normalizePosts(data)`**:
   - Normalizes raw JSON backend response items to guarantee proper TypeScript `Post` structure (handling string dates, author objects, comment arrays, like counts).
3. **`fetchPosts()`**:
   - Fetches `/api/posts` or `http://localhost:3000/posts`.
   - Merges live DB posts with fallback demo posts seamlessly.
4. **`PostEntry` Component**:
   - Renders individual sketchbook cards.
   - Displays avatar, author name, creation relative time (e.g. "à l'instant", "15min"), formatted body text with hashtag highlighting, polaroid styled images (with subtle rotation).
   - Deletion feature (Story S8): Author-only check against `user.id`/`user.username`. Prompts confirmation via `window.confirm`, calls `deletePostApi`, and performs optimistic UI removal without full page reload.

> [!NOTE]
> ❓ **Vos questions sur `PostsPages.tsx`** :
> (Écrivez vos remarques ou questions ici)

---

## 7. API Service Layer: `frontend/src/services/api.ts`

### Role
Centralizes all HTTP network requests (`fetch`) to the backend API (`http://localhost:3000`).

### Exported Functions
- `loginUserApi(email, password)`: `POST /auth/login`
- `registerUserApi(username, email, password)`: `POST /auth/register`
- `fetchPostsApi(token)`: `GET /posts`
- `createPostApi(formData, token)`: `POST /posts`
- `deletePostApi(postId, token)`: `DELETE /posts/:id`
- `deleteCommentApi(postId, commentId, token)`: `DELETE /posts/:postId/comments/:commentId`

> [!NOTE]
> ❓ **Vos questions sur `api.ts`** :
> (Écrivez vos remarques ou questions ici)

---

## 8. User Profile View: `frontend/src/components/profile/ProfileView.tsx`

### Role
Displays user profile header, customized bio, avatar palette, user posts grid/feed, saved posts, and search bar (`ProfileSearchBar.tsx`).

> [!NOTE]
> ❓ **Vos questions sur `ProfileView.tsx`** :
> (Écrivez vos remarques ou questions ici)

---

## Instructions for Feedback & Questions

1. Open this file: `docs/EXPLANATION_FRONTEND.md`.
2. Write your questions or modifications directly under any section or in the `> [!NOTE]` callouts.
3. Save the file and send your message to ask questions. Every question will be answered line-by-line!
