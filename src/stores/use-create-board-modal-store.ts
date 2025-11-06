import { create } from 'zustand';

interface CreateBoardModalState {
  showModal: boolean;
  openCreateBoardModal: () => void;
  closeCreateBoardModal: () => void;
}

const useCreateBoardModalStore = create<CreateBoardModalState>((set) => ({
  showModal: false,

  openCreateBoardModal: () => {
    set({
      showModal: true,
    });
  },

  closeCreateBoardModal: () => {
    set({
      showModal: false,
    });
  },
}));

export default useCreateBoardModalStore;
