# frontend (Next.js)

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

Contract: `../backend/docs/error-contract.md`.
