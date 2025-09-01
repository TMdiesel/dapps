"use client";
import { env } from "@/lib/env";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";

let instance: Web3AuthService | null = null;

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type Web3AuthLike = {
  init: () => Promise<void>;
  connect: () => Promise<unknown>;
  logout: () => Promise<void>;
  provider: unknown;
};

export class Web3AuthService {
  private web3auth: Web3AuthLike | null = null;
  private provider: unknown | null = null;

  static getInstance() {
    if (!instance) instance = new Web3AuthService();
    return instance;
  }

  async init() {
    if (this.web3auth) return;
    const hexChainId = `0x${env.DEFAULT_CHAIN_ID.toString(16)}`;
    const rpcUrl = env.ALCHEMY_RPC_URL;
    const web3auth = new Web3Auth({
      clientId: env.WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: "sapphire_devnet",
      // v10 expects `chains` instead of legacy `chainConfig`
      chains: [
        {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: hexChainId,
          rpcTarget: rpcUrl,
          displayName: "Ethereum Sepolia",
          ticker: "ETH",
          tickerName: "Ethereum",
        },
      ],
      defaultChainId: hexChainId,
      // Provide minimal AA config so SDK validation passes when Smart Accounts are enabled on the dashboard
      accountAbstractionConfig: {
        chains: [
          {
            chainId: hexChainId,
            bundlerConfig: { url: rpcUrl },
          },
        ],
      },
    }) as unknown as Web3AuthLike;
    await web3auth.init();
    this.web3auth = web3auth;
    this.provider = web3auth.provider ?? null;
  }

  async connect() {
    if (!this.web3auth) await this.init();
    if (!this.web3auth) throw new Error("Web3Auth not initialized");
    await this.web3auth.connect();
    this.provider = this.web3auth.provider ?? null;
    return this.provider;
  }

  async disconnect() {
    await this.web3auth?.logout();
    this.provider = null;
  }

  getProvider() {
    return this.provider;
  }

  async getAddress(): Promise<string | null> {
    if (!this.provider) return null;
    const p = this.provider as Eip1193Provider;
    const accounts = (await p.request({ method: "eth_accounts" })) as string[];
    return accounts?.[0] ?? null;
  }

  async getChainId(): Promise<number | null> {
    if (!this.provider) return null;
    const p = this.provider as Eip1193Provider;
    const chainIdHex = (await p.request({ method: "eth_chainId" })) as string;
    return parseInt(chainIdHex, 16);
  }
}
