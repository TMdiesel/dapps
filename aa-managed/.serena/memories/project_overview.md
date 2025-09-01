Project: aa-managed
Purpose: Build a demo UI that combines Web3Auth social login with Alchemy Account Kit (ERC-4337 AA) to showcase smart account creation, gas-sponsored transactions, balances, token/NFT display, transfers, and message signing.
Tech Stack (planned): React + TypeScript (Vite SPA for MVP), Tailwind/Chakra (either), viem (or ethers) unified client, Alchemy Account Kit (@alchemy/aa-*), Web3Auth Modal (@web3auth/modal), optional Alchemy SDK for data fetching.
Target Chain: Sepolia (default), with future multi-chain support.
Security: Private keys handled by Web3Auth; no secret keys stored in-app. Gas Manager policy ID used for sponsorship when enabled.
Non-Functional: Lazy-load SDKs post-login, robust error handling for RPC/bundler/paymaster, minimal client logs without PII.
Current Status: Project initialized with Serena; design spec in docs/aa-demo-design.md; app scaffolding not yet created.