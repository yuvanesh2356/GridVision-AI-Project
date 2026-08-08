import { create } from "zustand";

/**
 * Lightweight global state. Page-local state (form inputs, loading flags for
 * a single view) stays in the component; only cross-page/shared state lives
 * here: the cached dashboard summary, the currently selected asset, and the
 * most recently created inspection (used to jump straight to its detail page
 * after an upload).
 */
const useAppStore = create((set) => ({
  dashboardSummary: null,
  setDashboardSummary: (summary) => set({ dashboardSummary: summary }),

  selectedAssetId: null,
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),

  lastInspectionId: null,
  setLastInspectionId: (id) => set({ lastInspectionId: id }),
}));

export default useAppStore;
