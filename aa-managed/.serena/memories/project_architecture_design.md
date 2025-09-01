High-level Architecture
- Auth Layer: Web3Auth provides a SmartAccountSigner; session resume enabled when possible.
- AA Layer: Alchemy Account Kit creates Light Smart Contract Account with Alchemy Bundler; Gas Manager (Paymaster) can be conditionally applied via withAlchemyGasManager.
- Web3 Client: viem (preferred) or ethers; keep one client across the app.
- Data: Alchemy APIs for balances/NFTs/metadata; React Query for data fetching/caching.
- State: Minimal global state (zustand) for connection/session flags; derived data via React Query.

Key Screens/Components
- Landing: Login button, short description, testnet notice.
- Dashboard: Account card (address/QR/chain), balances, NFT grid, action panel (transfer form + sponsor toggle), developer panel (raw Tx/UserOp log, sign demo).
- Header: Connect/Disconnect, network indicator, theme toggle.
- Modals: Transfer, signature, error details.

Data Flow
- authState: loggedIn, userInfo, web3authProvider
- smartAccount: address, initStatus, sponsorEnabled
- networkState: chainId, rpcUrl
- balances/nfts: fetched via React Query; refetch on auth/chain change
- txState: in-progress/success/failure, userOpHash, explorer link

Env Vars (Vite examples)
- VITE_ALCHEMY_API_KEY
- VITE_ALCHEMY_GAS_MANAGER_POLICY_ID (if using sponsorship)
- VITE_WEB3AUTH_CLIENT_ID
- VITE_DEFAULT_CHAIN_ID (11155111 for Sepolia)
- VITE_ALCHEMY_RPC_URL (https://eth-sepolia.g.alchemy.com/v2/${KEY})

Open Questions
- Preferred framework: Vite vs Next.js
- Auth providers: Google + Email sufficient?
- Sponsor strategy: Always on vs user toggle
- Token/NFT scope: any specific collections/tokens to highlight?
