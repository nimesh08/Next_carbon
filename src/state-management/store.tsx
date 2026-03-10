import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface LoadingStore {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, loadingMessage: string) => void;
}

export const useLoadingStore = create<LoadingStore>(
  immer((set) => ({
    isLoading: false,
    loadingMessage: "",
    setLoading: (loading: boolean, loadingMessage: string) =>
      set((state) => {
        state.isLoading = loading;
        state.loadingMessage = loadingMessage;
      }),
  }))
);

interface WalletOverlayStore {
  showWalletOverlay: boolean;
  setShowWalletOverlay: (show: boolean) => void;
}

export const useWalletOverlayStore = create<WalletOverlayStore>(
  immer((set) => ({
    showWalletOverlay: false,
    setShowWalletOverlay: (show: boolean) =>
      set((state) => {
        state.showWalletOverlay = show;
      }),
  }))
);
