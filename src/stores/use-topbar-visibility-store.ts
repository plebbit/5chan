import { create } from 'zustand';
import { getAllBoardCodes } from '../constants/board-codes';

const LOCALSTORAGE_KEY_DIRECTORIES = '5chan-topbar-directories-visible';
const LOCALSTORAGE_KEY_SUBSCRIPTIONS = '5chan-topbar-subscriptions-visible';

interface TopbarVisibilityState {
  // Directory codes that are visible (all visible by default)
  visibleDirectories: Set<string>;
  // Subscription addresses that are visible in topbar (all hidden by default)
  visibleSubscriptions: Set<string>;
  // Actions
  toggleDirectory: (code: string) => void;
  toggleSubscription: (address: string) => void;
  setDirectoryVisibility: (code: string, visible: boolean) => void;
  setSubscriptionVisibility: (address: string, visible: boolean) => void;
  // Initialize from localStorage
  initialize: () => void;
}

const loadFromLocalStorage = (key: string, defaultValue: Set<string>): Set<string> => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const array = JSON.parse(stored);
      return new Set(array);
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
  }
  return defaultValue;
};

const saveToLocalStorage = (key: string, set: Set<string>) => {
  try {
    const array = Array.from(set);
    localStorage.setItem(key, JSON.stringify(array));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
};

const useTopbarVisibilityStore = create<TopbarVisibilityState>((set, _get) => {
  // Initialize with all directories visible by default
  const allBoardCodes = getAllBoardCodes();
  const defaultVisibleDirectories = new Set(allBoardCodes);
  const defaultVisibleSubscriptions = new Set<string>();

  return {
    visibleDirectories: loadFromLocalStorage(LOCALSTORAGE_KEY_DIRECTORIES, defaultVisibleDirectories),
    visibleSubscriptions: loadFromLocalStorage(LOCALSTORAGE_KEY_SUBSCRIPTIONS, defaultVisibleSubscriptions),

    toggleDirectory: (code: string) => {
      set((state) => {
        const newSet = new Set(state.visibleDirectories);
        if (newSet.has(code)) {
          newSet.delete(code);
        } else {
          newSet.add(code);
        }
        saveToLocalStorage(LOCALSTORAGE_KEY_DIRECTORIES, newSet);
        return { visibleDirectories: newSet };
      });
    },

    toggleSubscription: (address: string) => {
      set((state) => {
        const newSet = new Set(state.visibleSubscriptions);
        if (newSet.has(address)) {
          newSet.delete(address);
        } else {
          newSet.add(address);
        }
        saveToLocalStorage(LOCALSTORAGE_KEY_SUBSCRIPTIONS, newSet);
        return { visibleSubscriptions: newSet };
      });
    },

    setDirectoryVisibility: (code: string, visible: boolean) => {
      set((state) => {
        const newSet = new Set(state.visibleDirectories);
        if (visible) {
          newSet.add(code);
        } else {
          newSet.delete(code);
        }
        saveToLocalStorage(LOCALSTORAGE_KEY_DIRECTORIES, newSet);
        return { visibleDirectories: newSet };
      });
    },

    setSubscriptionVisibility: (address: string, visible: boolean) => {
      set((state) => {
        const newSet = new Set(state.visibleSubscriptions);
        if (visible) {
          newSet.add(address);
        } else {
          newSet.delete(address);
        }
        saveToLocalStorage(LOCALSTORAGE_KEY_SUBSCRIPTIONS, newSet);
        return { visibleSubscriptions: newSet };
      });
    },

    initialize: () => {
      // Load from localStorage on initialization
      const directories = loadFromLocalStorage(LOCALSTORAGE_KEY_DIRECTORIES, defaultVisibleDirectories);
      const subscriptions = loadFromLocalStorage(LOCALSTORAGE_KEY_SUBSCRIPTIONS, defaultVisibleSubscriptions);
      set({
        visibleDirectories: directories,
        visibleSubscriptions: subscriptions,
      });
    },
  };
});

export default useTopbarVisibilityStore;
