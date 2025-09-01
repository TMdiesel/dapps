"use client";
import { useEffect, useState } from "react";
import { Web3AuthService } from "@/lib/web3auth";
import { isEnvReady } from "@/lib/env";
import { initAA, sendEth } from "@/lib/aa";
import { useAuth } from "@/state/useAuth";
import Link from "next/link";
// removed duplicate useState import (already imported above)

function Erc20TransferCard({ sponsorEnabled, onInitSa }: { sponsorEnabled: boolean; onInitSa: () => Promise<void> }) {
  const [token, setToken] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { loggedIn } = useAuth();

  const handleSendErc20 = async () => {
    setError(null);
    setTxHash(null);
    try {
      if (!loggedIn) throw new Error("Login first");
      const addrOk = /^0x[a-fA-F0-9]{40}$/.test(to) && /^0x[a-fA-F0-9]{40}$/.test(token);
      if (!addrOk) throw new Error("Invalid address");
      const dec = Number(decimals);
      if (!amount || Number(amount) <= 0 || isNaN(dec) || dec < 0 || dec > 36) throw new Error("Invalid amount/decimals");
      setLoading(true);
      await onInitSa();
      const { sendErc20 } = await import("@/lib/aa");
      const hash = await sendErc20(token as `0x${string}`, to as `0x${string}`, amount, dec);
      setTxHash(hash);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "ERC20 send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5 backdrop-blur">
      <h2 className="text-sm font-medium text-neutral-300">Transfer (ERC20)</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs text-neutral-400">Token Address</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x..." className="mt-1 w-full rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-indigo-500/50" />
        </div>
        <div>
          <label className="block text-xs text-neutral-400">Recipient</label>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." className="mt-1 w-full rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-indigo-500/50" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs text-neutral-400">Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10" className="mt-1 w-full rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400">Decimals</label>
            <input value={decimals} onChange={(e) => setDecimals(e.target.value)} placeholder="18" className="mt-1 w-full rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-indigo-500/50" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSendErc20} disabled={loading || !loggedIn} className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-50">
            {loading ? "…" : "Send ERC20 (AA)"}
          </button>
          {txHash && (
            <a className="text-xs text-indigo-300 underline" href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
              View on Etherscan
            </a>
          )}
        </div>
        {error && <div className="text-xs text-red-300">{error}</div>}
      </div>
    </div>
  );
}

export default function Home() {
  const { loggedIn, address, chainId, sponsorEnabled, saAddress, setLoggedIn, setAddress, setChainId, setSaAddress, toggleSponsor, reset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      if (!isEnvReady()) return;
      try {
        await Web3AuthService.getInstance().init();
      } catch (e: unknown) {
        console.error(e);
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || "Failed to init Web3Auth");
      } finally {
        setReady(true);
      }
    };
    boot();
  }, []);

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      await Web3AuthService.getInstance().connect();
      const addr = await Web3AuthService.getInstance().getAddress();
      const cid = await Web3AuthService.getInstance().getChainId();
      setAddress(addr);
      setChainId(cid);
      setLoggedIn(true);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await Web3AuthService.getInstance().disconnect();
      reset();
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const initSmartAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await initAA({ sponsor: sponsorEnabled });
      if (res?.address) setSaAddress(res.address);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "AA init failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setError(null);
    setTxHash(null);
    try {
      if (!loggedIn) throw new Error("Login first");
      const addrOk = /^0x[a-fA-F0-9]{40}$/.test(to);
      if (!addrOk) throw new Error("Invalid recipient address");
      if (!amount || Number(amount) <= 0) throw new Error("Invalid amount");
      setLoading(true);
      // Always (re)init to reflect Sponsor toggle and headers
      const res = await initAA({ sponsor: sponsorEnabled });
      if (res?.address) setSaAddress(res.address);
      const hash = await sendEth(to as `0x${string}`, amount);
      setTxHash(hash);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/30 grid place-items-center">
              <span className="text-indigo-300 font-semibold">AA</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">AA Managed Demo</h1>
              <p className="text-xs text-neutral-400">Web3Auth × Alchemy (MVP)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <button onClick={disconnect} disabled={loading} className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm ring-1 ring-white/10">
                {loading ? "…" : "Logout"}
              </button>
            ) : (
              <button onClick={connect} disabled={!ready || !isEnvReady() || loading} className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                {loading ? "…" : "Login with Web3Auth"}
              </button>
            )}
          </div>
        </header>

        {!isEnvReady() && (
          <div className="mt-6 rounded-md border border-yellow-500/20 bg-yellow-950/20 p-3 text-yellow-200 text-sm">
            環境変数が不足しています。`.env` に `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` と `NEXT_PUBLIC_ALCHEMY_RPC_URL` を設定してください。
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-500/20 bg-red-950/30 p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5 backdrop-blur">
            <h2 className="text-sm font-medium text-neutral-300">Account</h2>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {address ? (
                <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span>
              ) : (
                <span className="text-neutral-500">Not connected</span>
              )}
            </div>
            <div className="mt-2 text-sm text-neutral-400">Chain: {chainId ?? "-"}</div>
            <div className="mt-2 text-sm text-neutral-400">
              Smart Account: {saAddress ? (
                <span className="font-mono text-neutral-200">{saAddress.slice(0, 6)}…{saAddress.slice(-4)}</span>
              ) : (
                <span className="text-neutral-500">Not initialized</span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-300">Sponsor</span>
                <button
                  onClick={toggleSponsor}
                  className={`h-6 w-10 rounded-full p-0.5 transition-colors ${sponsorEnabled ? "bg-indigo-600" : "bg-neutral-700"}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white transition-transform ${sponsorEnabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="text-xs text-neutral-500">Gas Manager policy: {process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID ? "set" : "unset"}</div>
            </div>
            {loggedIn && (
              <div className="mt-4">
                <button onClick={initSmartAccount} disabled={loading || !!saAddress || !isEnvReady()} className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm disabled:opacity-50">
                  {saAddress ? "Smart Account Ready" : loading ? "…" : "Initialize Smart Account"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5 backdrop-blur">
            <h2 className="text-sm font-medium text-neutral-300">Next steps</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-400">
              <li>Web3Authログイン後にAlchemy Account KitでSmart Accountを初期化</li>
              <li>残高/NFTの表示（Alchemy API）</li>
              <li>ETH/ERC20送金 + スポンサーON/OFF</li>
              <li>署名デモ（SIWE風）</li>
            </ul>
            <div className="mt-4 text-xs text-neutral-500">
              設計: <Link className="underline hover:text-neutral-300" href="/docs/aa-demo-design" prefetch={false}>docs/aa-demo-design.md</Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5 backdrop-blur">
            <h2 className="text-sm font-medium text-neutral-300">Transfer (ETH)</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400">Recipient</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 w-full rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Amount (ETH)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  className="mt-1 w-full rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSend} disabled={loading || !loggedIn || !isEnvReady()} className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-50">
                  {loading ? "…" : "Send ETH (AA)"}
                </button>
                {txHash && (
                  <a
                    className="text-xs text-indigo-300 underline"
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Etherscan
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* ERC20 Transfer (optional) */}
          <Erc20TransferCard sponsorEnabled={sponsorEnabled} onInitSa={async () => {
            const res = await initAA({ sponsor: sponsorEnabled });
            if (res?.address) setSaAddress(res.address);
          }} />
        </section>
      </main>
    </div>
  );
}
