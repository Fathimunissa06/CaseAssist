# CaseAssist Frontend

React + Vite + Tailwind CSS frontend for CaseAssist (Legal Mind AI). It sends a legal
problem to `POST /api/analyze`, presents the domain, extracted facts, rights, retrieved
laws, risk assessment and recommended actions, and pairs the analysis with the
**Legal Mind AI** assistant. Access is gated by a demo login.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build` (production build to `dist/`) and `npm run preview`.

## Demo account

| Email | Password |
| --- | --- |
| `demo@caseassist.app` | `Demo@1234` |

Authentication is a **frontend-only demo** (`src/auth/authService.js`, localStorage). It is not
a production auth system: accounts live in the browser and there is no server session. Swap that
one module for real API calls when the backend supports it; `AuthContext` only depends on its
function signatures. "Remember me" keeps the session in localStorage (30 days); otherwise it lasts
for the browser tab. Google sign-in is a visual button only.

## Routes

`/login` and `/signup` redirect to `/app` when signed in; `/app` redirects to `/login` when signed
out. Routing is a small History-API router in `src/router/` (no react-router dependency). When you
deploy, configure static hosting to serve `index.html` for unknown paths (SPA fallback).

## Legal Mind AI

Sits permanently in the lower half of the right side of the workspace (stacked below the results on
mobile). It receives the current case (title, description, domain, facts, rights, laws, risk,
actions) built by `src/utils/buildCaseContext.js`.

There is **no chat endpoint yet**, so `src/api/demoLegalMind.js` provides a clearly-labelled demo
layer. It re-arranges the analysis already on screen; it is not an AI model, and each reply says so.
To connect a real backend, set `VITE_CHAT_ENDPOINT` (for example `/api/chat`). The UI does not change.

```
POST {VITE_CHAT_ENDPOINT}
{ "message": "...", "caseContext": null | {...}, "history": [{ "role": "user|assistant", "content": "..." }] }
-> { "reply": "..." }
```

## Configuration (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend base URL. Leave it empty to use the Vite dev proxy (`/api` -> `localhost:8000`), which avoids CORS setup. |
| `VITE_API_TIMEOUT_MS` | `120000` | Request timeout. |
| `VITE_USE_MOCK` | `false` | `true` runs the case analysis on built-in sample data with no backend. |
| `VITE_ANALYZE_PAYLOAD` | `both` | Body for `POST /api/analyze`: `both` = `{ query, caseId, title, problemDescription }`, `query` = `{ query }`, `legacy` = the three form fields. |
| `VITE_CHAT_ENDPOINT` | empty | Real Legal Mind AI endpoint. Empty = demo replies. |

If the backend is called directly from the browser, it must allow the frontend
origin through CORS (for FastAPI, `CORSMiddleware` with `http://localhost:5173`).

## API contract

Request:

```json
{ "caseId": "CASE-001", "title": "Case Title", "problemDescription": "User legal problem" }
```

Response sections: `domain`, extracted facts, legal retrieval results, rights
analysis, risk assessment, recommended actions, `disclaimer`.

`src/utils/normalizeAnalysis.js` accepts camelCase or snake_case keys
(`extractedFacts` / `extracted_facts`, `legalRetrieval` / `retrievedLaws`, and so on),
optional `{ data: ... }` envelopes, and strings, string arrays, or object arrays
for each section. If your backend uses other key names, add them to the `KEYS`
map at the top of that file.

## Folder structure

```
src/
  api/
    client.js              Axios instance, error mapping (ApiError)
    caseService.js         analyzeCase(): POST /api/analyze (+ mock mode)
    chatService.js         sendLegalMindMessage(): backend or demo
    demoLegalMind.js       TEMPORARY demo replies (delete when a backend exists)
  auth/                    AuthContext.jsx, authService.js (demo, localStorage)
  router/                  History-API router, route guards
  hooks/
    useAnalyzeCase.js      request lifecycle: idle / loading / success / error, cancel, retry
    useLegalMindChat.js    conversation state, sending, stop, retry
    useTheme.js            shared light/dark state (dark by default)
  utils/
    normalizeAnalysis.js   maps any response shape to one predictable shape
    formatReport.js        plain-text export for "Copy summary"
    mockData.js            sample response for VITE_USE_MOCK
    buildCaseContext.js    case context handed to Legal Mind AI
    validators.js          email + password rules and strength
    caseId.js, cn.js       small helpers
  components/
    auth/                  Login, Signup, ForgotPassword, AuthLayout, password field/strength
    chatbot/               LegalMindAI, ChatMessage, ChatInput, TypingIndicator
    layout/                Workspace, Background, Header, UserMenu, Footer
    ui/                    GlassCard, Button, Field, Checkbox, Brand, ThemeToggle
    case/CaseForm.jsx      left panel: form, validation, example, cancel
    results/               right panel: one component per result section,
                           plus Empty / Loading / Error states
    ErrorBoundary.jsx      catches render errors
  App.jsx, main.jsx, index.css
```

## Behavior notes

- Validation: case ID and title are required; the description needs at least 30 characters (max 5,000). `Ctrl/Cmd + Enter` in the description submits.
- Loading: a staged progress view and a Cancel button that aborts the in-flight request.
- Errors: distinct messages for network/CORS failures, timeouts, validation (400/422, including FastAPI `detail` arrays), 404, 429, 5xx and empty responses, with a Retry button.
- Theme: follows the system preference on first visit, then remembers the choice.
- Accessibility: labelled fields, live status and alert regions, visible focus, and `prefers-reduced-motion` support.
