export const env = {
  WEB3AUTH_CLIENT_ID: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
  ALCHEMY_GAS_MANAGER_POLICY_ID: process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID || "",
  DEFAULT_CHAIN_ID: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 11155111),
  ALCHEMY_RPC_URL:
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
    (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : ""),
};

export const isEnvReady = () => !!(env.WEB3AUTH_CLIENT_ID && env.ALCHEMY_RPC_URL);

