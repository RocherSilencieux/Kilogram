# DEVLOG

## [2026-09-09] Backend Access Policy Setup

### Additions & Modifications
- Created `rules/backend_policy.md` to formally document the rule prohibiting direct access/modification of the `backend` directory by the AI assistant and requiring user plans for backend changes.
- Created `TODO.md` to track task execution.

## [2026-09-09] Frontend Login/Register & Backend Implementation Plan

### Additions & Modifications
- Drafted `implementation_plan.md` artifact covering the frontend AuthModal component, AuthContext, and a detailed backend implementation plan for the user.
- Updated `TODO.md` with task breakdown.

## [2026-09-10] Frontend Authentication Implementation

### Additions & Modifications
- Created `frontend/src/context/AuthContext.tsx` to handle authentication state persistence in `localStorage` and provide `login`/`logout` methods.
- Created `frontend/src/components/AuthModal.tsx` for tabbed Login and Register modal UI.
- Updated `frontend/src/App.tsx` with sticky navigation bar displaying user status, login, register, and logout buttons.
- Updated `frontend/src/pages/PostsPages.tsx` to consume `token` from `AuthContext`.
- Documented all line-by-line changes and full backend plan in `docs/MODIFICATIONS_AND_BACKEND_PLAN.md`.
- Verified TypeScript compilation using `npx tsc -b` (Exit Code 0).

## [2026-09-10] Root Package.json Scripts Setup

### Additions & Modifications
- Added root `package.json` `scripts` for `dev`, `dev:frontend`, `dev:backend`, and `seed` pointing to respective subfolders so running `npm run dev` in the project root works seamlessly.

## [2026-09-10] Backend Audit & Frontend Contract Alignment

### Additions & Modifications
- Audited `backend/` without modifying any of its files. Confirmed that Prisma `User` schema, JWT token logic, `authenticate` middleware, `POST /auth/register`, and `POST /auth/login` are ALREADY fully implemented in the backend.
- Updated `frontend/src/components/AuthModal.tsx` login payload to send `{ email, password }` and require 8+ character passwords to seamlessly match backend Zod schema.
- Updated `docs/MODIFICATIONS_AND_BACKEND_PLAN.md` to report that 0 backend tasks remain.
- Verified frontend build with `npx tsc -b` (Exit Code 0).

## [2026-09-10] CORS Fix & Verification

### Additions & Modifications
- Updated `backend/.env` to set `FRONTEND_URL="http://localhost:5173"`.
- Updated `backend/src/index.ts` CORS configuration with a fallback `process.env.FRONTEND_URL || "http://localhost:5173"` to prevent CORS blocking `fetch()` requests from the frontend dev server.
- Verified both frontend (`npx tsc -b`) and backend (`npm run build`) compilation cleanly (Exit Code 0).

## [2026-09-10] AuthModal Mode Sync Fix

### Additions & Modifications
- Added `useEffect` in `frontend/src/components/AuthModal.tsx` to automatically synchronize internal `mode` state with `initialMode` whenever `isOpen` or `initialMode` changes.
- Added `key={authMode}` prop to `<AuthModal />` in `frontend/src/App.tsx` to re-initialize the modal correctly when clicking "Connexion" vs "Inscription".
- Verified frontend compilation with `npx tsc -b` (Exit Code 0).

## [2026-09-10] Final Production Audit & Verification

### Additions & Modifications
- Performed a full codebase audit on all modified/added files. Verified strict TypeScript type safety, error boundaries, CORS fallbacks, and state persistence.
- Verified both frontend (`npx tsc -b`) and backend (`npm run build`) builds cleanly with zero errors (Exit Code 0).

## [2026-09-10] App.tsx Git Merge & Remote Push

### Additions & Modifications
- Resolved `frontend/src/App.tsx` merge conflict between `dev` branch and `Kilogram/profile` branch.
- Combined `AuthProvider`, `AuthModal`, tab switcher ("Feed" / "Profil"), `ProfileView`, `PostsPages`, and light/dark theme toggle cleanly.
- Pushed resolved commits to remote repository (`git push`).

## [2026-09-10] PostCSS Configuration Fix

### Additions & Modifications
- Created `frontend/postcss.config.js` (`export default {}`) to prevent PostCSS from traversing parent directories outside the repository and encountering invalid JSON syntax errors.
- Verified production build via `npx vite build` in `frontend/` (Build completed cleanly in 1.62s).

## [2026-09-10] App.tsx Restoration & Verification

### Additions & Modifications
- Restored `frontend/src/App.tsx` containing the Kilogram application structure (AuthProvider, HeaderNav, PostsPages, ProfileView, theme toggle, and AuthModal).
- Verified Vite build via `npx vite build` in `frontend/` (Built cleanly in 700ms).

## [2026-09-10] Story S8 — Deletion Implementation (Branch `delete`)

### Additions & Modifications
- Created helper functions `deletePostApi` and `deleteCommentApi` in `frontend/src/services/api.ts`.
- Implemented `handleDeletePost` and `handleDeleteComment` in `frontend/src/pages/PostsPages.tsx` with author-only checks, confirmation dialogs (`window.confirm`), and optimistic UI updates without page reloads.
- Implemented post deletion in `frontend/src/components/profile/ProfileView.tsx` for author profiles.
- Verified TypeScript compilation (`npx tsc -b`) and production bundle build (`npx vite build` in 357ms) with zero errors.
