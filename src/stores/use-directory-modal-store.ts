import { create } from 'zustand';

interface DirectoryModalState {
  showModal: boolean;
  openDirectoryModal: () => void;
  closeDirectoryModal: () => void;
}

const useDirectoryModalStore = create<DirectoryModalState>((set) => ({
  showModal: false,

  openDirectoryModal: () => {
    set({
      showModal: true,
    });
  },

  closeDirectoryModal: () => {
    set({
      showModal: false,
    });
  },
}));

export default useDirectoryModalStore;
