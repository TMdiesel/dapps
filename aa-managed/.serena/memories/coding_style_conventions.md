General
- TypeScript-first; strict types (`strict: true`) where feasible.
- React functional components and hooks; keep components small and focused.
- State: colocate where possible; global store only for connection/auth/network flags.
- Naming: camelCase for vars/functions, PascalCase for components/types, UPPER_SNAKE for env-driven constants.
- API/SDK wrappers: isolate SDK initializers (Web3Auth, Account Kit) into `/lib` to keep components clean.
- Error handling: map SDK/bundler/paymaster errors to user-friendly messages; include raw error in dev panel.
- Folder structure (Vite):
  - src/components, src/pages (or routes), src/lib, src/state, src/styles, src/hooks, src/types.
- Formatting/Linting: Prettier + ESLint (recommended); adopt standard React TS rules.
