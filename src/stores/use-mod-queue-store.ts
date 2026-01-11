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

// Type for persisted data (without methods)
type PersistedModQueueData = Pick<ModQueueState, 'alertThresholdValue' | 'alertThresholdUnit' | 'selectedBoardFilter'>;

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
      migrate: (persistedState, version): ModQueueState => {
        const state = persistedState as OldPersistedState;
        if (version === 0 && state.alertThresholdHours !== undefined) {
          const migrated: PersistedModQueueData = {
            alertThresholdValue: state.alertThresholdHours,
            alertThresholdUnit: 'hours' as AlertThresholdUnit,
            selectedBoardFilter: state.selectedBoardFilter ?? null,
          };
          // Zustand will merge this with the store definition (which includes methods)
          return migrated as ModQueueState;
        }
        // Ensure we return a valid persisted state shape
        const current: PersistedModQueueData = {
          alertThresholdValue: state.alertThresholdValue ?? 6,
          alertThresholdUnit: state.alertThresholdUnit ?? 'hours',
          selectedBoardFilter: state.selectedBoardFilter ?? null,
        };
        return current as ModQueueState;
      },
    },
  ),
);

export default useModQueueStore;
