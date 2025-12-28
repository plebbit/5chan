import { useCallback, useState } from 'react';
import useIsMobile from './use-is-mobile';
import useSelectedTextStore from '../stores/use-selected-text-store';

const useReplyModal = () => {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [activeCid, setActiveCid] = useState<string | null>(null);
  const [parentNumber, setParentNumber] = useState<number | null>(null);
  const [threadCid, setThreadCid] = useState<string | null>(null);
  const [subplebbitAddress, setSubplebbitAddress] = useState<string | null>(null);
  const { resetSelectedText, setSelectedText } = useSelectedTextStore();

  // on mobile, the css position is absolute instead of fixed, so we need to calculate the top position
  const isMobile = useIsMobile();
  const [scrollY, setScrollY] = useState<number>(0);

  const closeModal = useCallback(() => {
    resetSelectedText();
    setActiveCid(null);
    setParentNumber(null);
    setShowReplyModal(false);
  }, [resetSelectedText, setActiveCid, setShowReplyModal]);

  const getSelectedText = () => {
    let text = document.getSelection()?.toString();
    if (text) setSelectedText(`>${text}\n`);
  };

  const openReplyModal = (parentCid: string, parentNum: number | undefined, postCid: string, subplebbitAddress: string) => {
    getSelectedText();

    if (isMobile) {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
    }

    if (activeCid && activeCid !== parentCid) {
      return;
    }
    setActiveCid(parentCid);
    setParentNumber(parentNum ?? null);
    setThreadCid(postCid);
    setShowReplyModal(true);
    setSubplebbitAddress(subplebbitAddress);
  };

  return { activeCid, parentNumber, threadCid, closeModal, openReplyModal, scrollY, showReplyModal, subplebbitAddress };
};

export default useReplyModal;
