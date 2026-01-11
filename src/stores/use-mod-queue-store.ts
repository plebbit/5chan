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

// Type for old persisted state format (before migration)
interface OldPersistedState {
  alertThresholdHours?: number;
  alertThresholdValue?: number;
  alertThresholdUnit?: AlertThresholdUnit;
  selectedBoardFilter?: string | null;
}

const useModQueueStore = create<ModQueueState>()(
  persist(
    (set, get) => ({
      alertThresholdValue: 6,
      alertThresholdUnit: 'hours' as AlertThresholdUnit,
      selectedBoardFilter: null,
      setAlertThreshold: (value, unit) => set({ alertThresholdValue: value, alertThresholdUnit: unit }),
      setSelectedBoardFilter: (boardAddress) => set({ selectedBoardFilter: boardAddress }),
      getAlertThresholdSeconds: () => {
        const { alertThresholdValue, alertThresholdUnit } = get();
        return alertThresholdUnit === 'hours' ? alertThresholdValue * 3600 : alertThresholdValue * 60;
      },
    }),
    {
      name: 'mod-queue-storage',
      version: 1,
      // Migrate old alertThresholdHours format to new alertThresholdValue/alertThresholdUnit format
      migrate: (persistedState, version) => {
        const state = persistedState as OldPersistedState;
        if (version === 0 && state.alertThresholdHours !== undefined) {
          return {
            ...state,
            alertThresholdValue: state.alertThresholdHours,
            alertThresholdUnit: 'hours' as AlertThresholdUnit,
            alertThresholdHours: undefined, // Remove old field
          };
        }
        return state;
      },
    },
  ),
);

export default useModQueueStore;
