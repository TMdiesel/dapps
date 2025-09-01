// Alchemy Account Kit (ethers) integration
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EthersProviderAdapter, convertEthersSignerToAccountSigner } from "@alchemy/aa-ethers";
import { createLightAccount } from "@alchemy/aa-accounts";
import { createSmartAccountClient, getChain } from "@alchemy/aa-core";
import { http } from "viem";
import { env } from "@/lib/env";
import { Web3AuthService } from "@/lib/web3auth";

type AAContext = {
  provider: EthersProviderAdapter;
  signer: import("@alchemy/aa-ethers").AccountSigner;
};

let ctx: AAContext | null = null;

export async function initAA(_opts: { sponsor: boolean }): Promise<{ address: string } | null> {
  // ensure Web3Auth is connected
  const eip1193 = Web3AuthService.getInstance().getProvider();
  if (!eip1193 || !env.ALCHEMY_RPC_URL) return null;
  void _opts;

  const { BrowserProvider } = await import("ethers");
  const browserProvider = new BrowserProvider(eip1193 as unknown as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  });
  const ethSigner = await browserProvider.getSigner();
  const smartSigner = convertEthersSignerToAccountSigner(ethSigner as unknown as import("@ethersproject/abstract-signer").Signer);

  const chainId = env.DEFAULT_CHAIN_ID;
  const chain = getChain(chainId);

  const headers: Record<string, string> = {};
  if (_opts.sponsor && env.ALCHEMY_GAS_MANAGER_POLICY_ID) {
    headers["Alchemy-Gas-Manager-Policy-Id"] = env.ALCHEMY_GAS_MANAGER_POLICY_ID;
  }
  const transport = http(
    env.ALCHEMY_RPC_URL,
    Object.keys(headers).length ? { fetchOptions: { headers } } : undefined
  ) as unknown as any;

  const account = await createLightAccount({
    transport,
    chain: chain as unknown as any,
    signer: smartSigner as unknown as any,
  } as unknown as any);

  const accountProvider = createSmartAccountClient({
    transport,
    chain: chain as unknown as any,
    account,
    // Add a conservative buffer to preVerificationGas to avoid
    // bundler precheck failures due to signature/length differences.
    customMiddleware: async (uoStruct: any) => {
      const resolved = await Promise.resolve(uoStruct);
      try {
        const hex = (resolved.preVerificationGas as string) || "0x0";
        const current = BigInt(hex);
        const bumped = current + 30000n; // ~30k buffer
        resolved.preVerificationGas = `0x${bumped.toString(16)}`;
      } catch {
        // no-op if parsing fails; let default stand
      }
      return resolved;
    },
  }) as unknown as any;

  const provider = new EthersProviderAdapter({ accountProvider }) as any;
  const signer = provider.connectToAccount(account) as any;

  // TODO: Apply Gas Manager sponsorship when opts.sponsor && env.ALCHEMY_GAS_MANAGER_POLICY_ID
  ctx = { provider, signer } as AAContext;
  const address = await signer.getAddress();
  return { address };
}

export function getAA() {
  return ctx;
}

export async function sendEth(to: `0x${string}`, amountEth: string) {
  if (!ctx) throw new Error("AA not initialized");
  const { signer } = ctx;
  const { parseEther } = await import("ethers");
  const tx = await signer.sendTransaction({ to, value: parseEther(amountEth) });
  return tx.hash;
}

const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export async function sendErc20(
  token: `0x${string}`,
  to: `0x${string}`,
  amount: string,
  decimals = 18
) {
  if (!ctx) throw new Error("AA not initialized");
  const { signer } = ctx;
  const { Interface, formatUnits, parseUnits } = await import("ethers");
  const iface = new Interface(erc20Abi as unknown as any);
  const data = iface.encodeFunctionData("transfer", [to, parseUnits(amount, decimals)]);
  const tx = await signer.sendTransaction({ to: token, data });
  return tx.hash;
}
