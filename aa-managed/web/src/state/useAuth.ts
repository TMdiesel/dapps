"use client";
import { create } from "zustand";

type AuthState = {
  loggedIn: boolean;
  address: string | null;
  chainId: number | null;
  sponsorEnabled: boolean;
  saAddress: string | null;
  setLoggedIn: (v: boolean) => void;
  setAddress: (a: string | null) => void;
  setChainId: (id: number | null) => void;
  setSaAddress: (a: string | null) => void;
  toggleSponsor: () => void;
  reset: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  loggedIn: false,
  address: null,
  chainId: null,
  sponsorEnabled: true,
  saAddress: null,
  setLoggedIn: (v) => set({ loggedIn: v }),
  setAddress: (a) => set({ address: a }),
  setChainId: (id) => set({ chainId: id }),
  setSaAddress: (a) => set({ saAddress: a }),
  toggleSponsor: () => set((s) => ({ sponsorEnabled: !s.sponsorEnabled })),
  reset: () => set({ loggedIn: false, address: null, chainId: null, saAddress: null }),
}));
