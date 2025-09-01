Scaffold (choose one)
- npm create vite@latest aa-managed-ui -- --template react-ts
- npx create-next-app@latest aa-managed-ui --ts

Install dependencies (core)
- cd aa-managed-ui
- npm i @web3auth/modal @web3auth/openlogin-adapter @alchemy/aa-core @alchemy/aa-accounts @alchemy/aa-viem viem @tanstack/react-query zustand zod
- npm i -D tailwindcss postcss autoprefixer (if Tailwind)

Dev / Build / Preview (Vite)
- npm run dev
- npm run build
- npm run preview

Lint/Format (if configured later)
- npm run lint
- npm run format

Environment setup
- cp .env.example .env
- edit .env to set VITE_ALCHEMY_API_KEY, VITE_WEB3AUTH_CLIENT_ID, VITE_ALCHEMY_GAS_MANAGER_POLICY_ID, VITE_DEFAULT_CHAIN_ID, VITE_ALCHEMY_RPC_URL

Utilities (Darwin/macOS)
- ls, cd, rg (ripgrep), grep, find, open <path>, pbcopy/pbpaste
- git status, git add -p, git commit -m "...", git log --oneline --graph
