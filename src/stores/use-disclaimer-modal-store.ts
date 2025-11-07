import { create } from 'zustand';
import { NavigateFunction } from 'react-router-dom';

export const DISCLAIMER_ACCEPTED_KEY = '5chan-disclaimer-accepted';

interface DisclaimerModalState {
  showModal: boolean;
  targetAddress: string | null;
  targetBoardPath: string | null;
  showDisclaimerModal: (address: string, navigate: NavigateFunction, boardPath?: string) => void;
  closeDisclaimerModal: () => void;
  acceptDisclaimer: (navigate: NavigateFunction) => void;
}

const hasAcceptedDisclaimer = (): boolean => {
  try {
    return localStorage.getItem(DISCLAIMER_ACCEPTED_KEY) === 'true';
  } catch (error) {
    return false;
  }
};

const setDisclaimerAccepted = (): void => {
  try {
    localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'true');
  } catch (error) {
    console.error('Failed to save disclaimer acceptance to localStorage:', error);
  }
};

const useDisclaimerModalStore = create<DisclaimerModalState>((set) => ({
  showModal: false,
  targetAddress: null,
  targetBoardPath: null,

  showDisclaimerModal: (address: string, navigate: NavigateFunction, boardPath?: string) => {
    // Check if user has already accepted the disclaimer
    if (hasAcceptedDisclaimer()) {
      // Navigate directly without showing modal
      const path = boardPath || address;
      navigate(`/${path}`);
      return;
    }

    // Show modal if not accepted before
    set({
      showModal: true,
      targetAddress: address,
      targetBoardPath: boardPath || null,
    });
  },

  closeDisclaimerModal: () => {
    set({
      showModal: false,
      targetAddress: null,
      targetBoardPath: null,
    });
  },

  acceptDisclaimer: (navigate: NavigateFunction) => {
    const state = useDisclaimerModalStore.getState();

    // Save acceptance to localStorage
    setDisclaimerAccepted();

    // Navigate to the target board path (or address if no path)
    const path = state.targetBoardPath || state.targetAddress;
    if (path) {
      navigate(`/${path}`);
    }

    // Close the modal
    set({
      showModal: false,
      targetAddress: null,
      targetBoardPath: null,
    });
  },
}));

export default useDisclaimerModalStore;
