import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModQueueState {
  alertThresholdHours: number;
  selectedBoardFilter: string | null;
  setAlertThresholdHours: (hours: number) => void;
  setSelectedBoardFilter: (boardAddress: string | null) => void;
}

const useModQueueStore = create<ModQueueState>()(
  persist(
    (set) => ({
      alertThresholdHours: 6,
      selectedBoardFilter: null,
      setAlertThresholdHours: (hours) => set({ alertThresholdHours: hours }),
      setSelectedBoardFilter: (boardAddress) => set({ selectedBoardFilter: boardAddress }),
    }),
    {
      name: 'mod-queue-storage',
    },
  ),
);

export default useModQueueStore;
