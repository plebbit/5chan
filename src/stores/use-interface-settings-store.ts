import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InterfaceSettingsStore {
  hideThreadsWithoutImages: boolean;
  setHideThreadsWithoutImages: (value: boolean) => void;
}

const useInterfaceSettingsStore = create(
  persist<InterfaceSettingsStore>(
    (set) => ({
      hideThreadsWithoutImages: true,
      setHideThreadsWithoutImages: (value: boolean) => set({ hideThreadsWithoutImages: value }),
    }),
    {
      name: 'interface-settings-storage',
    },
  ),
);

export default useInterfaceSettingsStore;
