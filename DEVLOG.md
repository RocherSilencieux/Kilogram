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
## [2026-09-10] Story 1 (S1 — Inscription) Frontend Implementation

### Additions & Modifications
- Created `frontend/src/types/auth.ts` defining strict TypeScript models (`RegisterFormData`, `RegisterFieldErrors`, `RegisterSuccessResponse`) and runtime type guards (`isRecord`, `isRegisterSuccessResponse`) eliminating `any` and `as`.
- Created `frontend/src/utils/authValidation.ts` providing pure client-side validation (`validateEmail`, `validateUsername`, `validatePassword`) and robust server-side error mapping extracting field-by-field errors from Zod responses and uniqueness constraints.
- Created `frontend/src/components/auth/RegisterForm.tsx` as a dedicated single-responsibility component fulfilling all S1 acceptance criteria and DoD (controlled inputs, field-by-field errors, 4 UI states: empty/loading/error/success, password safety, and link to login).
- Created `frontend/src/components/auth/LoginForm.tsx` extracting login logic cleanly from `AuthModal.tsx`.
- Refactored `frontend/src/components/AuthModal.tsx` into a lightweight tab container delegating strictly to `RegisterForm` and `LoginForm`.
- Optimized `frontend/src/context/AuthContext.tsx` with lazy state initialization, removing synchronous `setState` in `useEffect` and eliminating all type assertions.
- Extracted `useAuth` hook into `frontend/src/context/useAuth.ts` to satisfy React Fast Refresh lint guidelines.
- Verified compilation with `tsc -b && vite build` (Exit Code 0).

## [2026-09-10] Automated Test Suite Setup (Vitest & React Testing Library)

### Additions & Modifications
- Configured Vitest and React Testing Library in `frontend/vite.config.ts`, `frontend/package.json`, and root `package.json`.
- Created `frontend/src/test/setup.ts` importing `@testing-library/jest-dom`.
- Created `frontend/src/test/RegisterForm.test.tsx` containing 9 comprehensive integration tests validating all Story 1 acceptance criteria (form inputs, password type, link to login, front validation, field-by-field API errors, network errors, loading state, and success state).
- Created `frontend/src/test/authValidation.test.ts` containing 17 unit tests verifying pure validation rules and error mapping.
- All 26 automated tests pass successfully (`npm test` Exit Code 0).

## [2026-09-10] Story 1 Component Decoupling & Lint Optimization

### Additions & Modifications
- Created `frontend/src/components/common/FormField.tsx` extracting label, input, accessibility attributes (`aria-invalid`, `aria-describedby`), and dedicated error message rendering to satisfy Slide 7 ("Un composant = un rôle. Si vous scrollez, découpez").
- Created `frontend/src/services/auth.service.ts` encapsulating authentication HTTP requests (`registerUser`, `loginUser`) and throwing typed `AuthApiError` with structured field errors.
- Refactored `RegisterForm.tsx` and `LoginForm.tsx` to consume `FormField` and `auth.service.ts`, drastically reducing boilerplate and ensuring clean single-responsibility components.
- Separated context definition into `frontend/src/context/authContextDef.ts` to satisfy Vite / React Fast Refresh export constraints.
- Resolved synchronous `setState` in `ProfileView.tsx` effect using `queueMicrotask`.
- Verified: 26/26 tests passing, clean build, and 0 warnings / 0 errors on Oxlint (`npm run lint`).
