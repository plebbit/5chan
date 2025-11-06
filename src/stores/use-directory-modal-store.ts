import { create } from 'zustand';

type ModalContext = 'placeholder' | 'create-button';

interface DirectoryModalState {
  showModal: boolean;
  modalContext: ModalContext;
  openDirectoryModal: (context?: ModalContext) => void;
  closeDirectoryModal: () => void;
}

const useDirectoryModalStore = create<DirectoryModalState>((set) => ({
  showModal: false,
  modalContext: 'placeholder',

  openDirectoryModal: (context: ModalContext = 'placeholder') => {
    set({
      showModal: true,
      modalContext: context,
    });
  },

  closeDirectoryModal: () => {
    set({
      showModal: false,
    });
  },
}));

export default useDirectoryModalStore;
