import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AlertThresholdUnit = 'hours' | 'minutes';

interface ModQueueState {
  alertThresholdValue: number;
  alertThresholdUnit: AlertThresholdUnit;
  selectedBoardFilter: string | null;
  setAlertThreshold: (value: number, unit: AlertThresholdUnit) => void;
  setSelectedBoardFilter: (boardAddress: string | null) => void;
  // Helper to get threshold in seconds for calculations
  getAlertThresholdSeconds: () => number;
}

const useModQueueStore = create<ModQueueState>()(
  persist(
    (set, get) => {
      // Migration: Check for old format in localStorage
      let initialState = { alertThresholdValue: 6, alertThresholdUnit: 'hours' as AlertThresholdUnit };
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mod-queue-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            // If old format exists, migrate it
            if (parsed.state?.alertThresholdHours !== undefined) {
              initialState = {
                alertThresholdValue: parsed.state.alertThresholdHours,
                alertThresholdUnit: 'hours',
              };
            } else if (parsed.state?.alertThresholdValue !== undefined) {
              initialState = {
                alertThresholdValue: parsed.state.alertThresholdValue,
                alertThresholdUnit: parsed.state.alertThresholdUnit || 'hours',
              };
            }
          }
        } catch (e) {
          // Ignore parse errors, use defaults
        }
      }

      return {
        ...initialState,
        selectedBoardFilter: null,
        setAlertThreshold: (value, unit) => set({ alertThresholdValue: value, alertThresholdUnit: unit }),
        setSelectedBoardFilter: (boardAddress) => set({ selectedBoardFilter: boardAddress }),
        getAlertThresholdSeconds: () => {
          const { alertThresholdValue, alertThresholdUnit } = get();
          return alertThresholdUnit === 'hours' ? alertThresholdValue * 3600 : alertThresholdValue * 60;
        },
      };
    },
    {
      name: 'mod-queue-storage',
    },
  ),
);

export default useModQueueStore;
