# frontend (Next.js)

Part of **Finpass**, a wealth advisory agent built for FinTechathon Shenzhen (Topic 3). Three repositories:

| Repository | What it is |
|------------|------------|
| [github.com/Finpass/frontend](https://github.com/Finpass/frontend) | Next.js web app: sign-in, profiling questionnaire, dashboard, advisor chat |
| [github.com/Finpass/backend](https://github.com/Finpass/backend) | Go API: auth, profile rule engine, portfolio, market data, WhatsApp daily brief |
| [github.com/Finpass/ai](https://github.com/Finpass/ai) | Python service: RAG advisor chat and profile wording (only the backend calls it) |

This is the **frontend** repository.

Next 16 (App Router, `src/`), React 19, TypeScript strict, Tailwind 4, axios, react-hot-toast, vitest.

```
cp .env.example .env.local
npm install
npm run dev      # :3000
npm run check    # lint + typecheck + test
```

Read `node_modules/next/dist/docs/` before using Next APIs; this version differs from older releases.

## Structure: feature folders

```
src/app/                  routes only; thin pages that compose feature components
src/features/<feature>/   api/ (calls), components/, hooks/, types.ts
src/components/           shared UI and providers
src/lib/                  http.ts (axios + envelope unwrap), api-error.ts, notify-error.ts
src/types/api.ts          envelope and error-code types (mirror of backend contract)
```

Rules:
- Features do not import each other; shared code goes in `components/` or `lib/`.
- Call the backend only through `lib/http.ts`: it returns `data` and throws `ApiError`.
- In `catch`, call `notifyError(err)`: 5xx/network show a generic message with the request id, 4xx show the server message, `fieldErrors()` feeds inline form errors.
- `features/note` is a working template; copy it, then delete it when the first real feature lands.

Contract: [response and error contract](https://github.com/Finpass/backend#response-and-error-contract).

## Tests

```
npm run test       # vitest run
npm run check      # eslint + tsc --noEmit + vitest
```

Unit tests sit next to the code (`*.test.ts`): API error handling, form validation, profile scoring helpers and radar chart, dashboard calculations (matching, comparison, goals, projection, holdings, charts, formatting, discover, advisory), i18n and design tokens.
No backend is needed; they run in CI on every pull request (`.github/workflows/ci.yml`).

## Deployment

A standard Next.js build (`npm run build`, then `npm run start`), so it runs on Vercel, Railway or any Node host that Next 16 supports.
Set at build time (they are public, so never put a secret in them):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | public URL of the backend API |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in client id |

Then add the frontend's public URL to the backend's `CORS_ORIGINS` and `PUBLIC_APP_URL`.
