import { create } from 'zustand';

interface TopbarEditModalState {
  showModal: boolean;
  openTopbarEditModal: () => void;
  closeTopbarEditModal: () => void;
}

const useTopbarEditModalStore = create<TopbarEditModalState>((set) => ({
  showModal: false,

  openTopbarEditModal: () => {
    set({
      showModal: true,
    });
  },

  closeTopbarEditModal: () => {
    set({
      showModal: false,
    });
  },
}));

export default useTopbarEditModalStore;
