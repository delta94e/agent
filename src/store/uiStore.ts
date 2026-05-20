import { create } from 'zustand';
import type { Position3D } from '@/types';

type PanelTab = 'agents' | 'workflows' | 'metrics' | 'logs';

interface UIStore {
  selectedAgentId: string | null;
  hoveredAgentId: string | null;
  isPanelOpen: boolean;
  activeTab: PanelTab;
  cameraTarget: Position3D;

  selectAgent: (id: string | null) => void;
  setHoveredAgent: (id: string | null) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setTab: (tab: PanelTab) => void;
  setCameraTarget: (pos: Position3D) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgentId: null,
  hoveredAgentId: null,
  isPanelOpen: true,
  activeTab: 'agents',
  cameraTarget: { x: 0, y: 0, z: 0 },

  selectAgent: (id) =>
    set({
      selectedAgentId: id,
      isPanelOpen: id !== null ? true : undefined,
      activeTab: id !== null ? 'agents' : undefined,
    }),

  setHoveredAgent: (id) => set({ hoveredAgentId: id }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setTab: (tab) => set({ activeTab: tab }),

  setCameraTarget: (pos) => set({ cameraTarget: pos }),
}));
