import { create } from "zustand";

interface LoadingStore {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, loadingMessage: string) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  loadingMessage: "",
  setLoading: (loading: boolean, loadingMessage: string) =>
    set({ isLoading: loading, loadingMessage }),
}));

interface WalletOverlayStore {
  showWalletOverlay: boolean;
  setShowWalletOverlay: (show: boolean) => void;
}

export const useWalletOverlayStore = create<WalletOverlayStore>((set) => ({
  showWalletOverlay: false,
  setShowWalletOverlay: (show: boolean) => set({ showWalletOverlay: show }),
}));
