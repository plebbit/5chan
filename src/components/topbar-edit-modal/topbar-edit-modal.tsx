import { useEffect, useState } from 'react';
import { useAccount } from '@plebbit/plebbit-react-hooks';
import Plebbit from '@plebbit/plebbit-js';
import useTopbarEditModalStore from '../../stores/use-topbar-edit-modal-store';
import useTopbarVisibilityStore from '../../stores/use-topbar-visibility-store';
import { getAllBoardCodes } from '../../constants/board-codes';
import { getBoardPath } from '../../lib/utils/route-utils';
import { useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import styles from './topbar-edit-modal.module.css';

const TopbarEditModal = () => {
  const { showModal, closeTopbarEditModal } = useTopbarEditModalStore();
  const { visibleDirectories, visibleSubscriptions, setDirectoryVisibility, setSubscriptionVisibility } = useTopbarVisibilityStore();
  const account = useAccount();
  const subscriptions = account?.subscriptions || [];
  const defaultSubplebbits = useDefaultSubplebbits();

  // Convert visible directories set to space-separated string for input
  const directoriesToString = (dirs: Set<string>): string => {
    return Array.from(dirs).sort().join(' ');
  };

  // Convert space-separated string to set of directory codes
  const stringToDirectories = (str: string): Set<string> => {
    const codes = str
      .trim()
      .split(/\s+/)
      .filter((code) => code.length > 0)
      .map((code) => code.toLowerCase());
    return new Set(codes);
  };

  // Local state for text input (will be saved on Save click)
  const [localDirectoryInput, setLocalDirectoryInput] = useState<string>(directoriesToString(visibleDirectories));
  const [localSubscriptionVisibility, setLocalSubscriptionVisibility] = useState<Set<string>>(visibleSubscriptions);

  // Update local state when modal opens or store changes
  useEffect(() => {
    if (showModal) {
      setLocalDirectoryInput(directoriesToString(visibleDirectories));
      setLocalSubscriptionVisibility(new Set(visibleSubscriptions));
    }
  }, [showModal, visibleDirectories, visibleSubscriptions]);

  if (!showModal) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeTopbarEditModal();
    }
  };

  const handleSubscriptionToggle = (address: string) => {
    const newSet = new Set(localSubscriptionVisibility);
    if (newSet.has(address)) {
      newSet.delete(address);
    } else {
      newSet.add(address);
    }
    setLocalSubscriptionVisibility(newSet);
  };

  const handleSave = () => {
    // Parse directory input and apply changes
    const inputDirectories = stringToDirectories(localDirectoryInput);
    const allCodes = getAllBoardCodes();

    // Hide all directories first, then show only the ones in the input
    allCodes.forEach((code) => {
      setDirectoryVisibility(code, inputDirectories.has(code));
    });

    // Apply subscription visibility changes
    subscriptions.forEach((address: string) => {
      setSubscriptionVisibility(address, localSubscriptionVisibility.has(address));
    });

    closeTopbarEditModal();
  };

  const handleCancel = () => {
    // Reset local state to match store
    setLocalDirectoryInput(directoriesToString(visibleDirectories));
    setLocalSubscriptionVisibility(new Set(visibleSubscriptions));
    closeTopbarEditModal();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.topbarEditDialog}>
        <div className={styles.hd}>
          <h2>Custom Board List</h2>
          <button className={styles.closeButton} onClick={handleCancel} title='Close' />
        </div>
        <div className={styles.bd}>
          <div className={styles.section}>
            <h3>Directory Boards</h3>
            <p>Enter directory codes separated by spaces (e.g., "jp tg mu"):</p>
            <input
              type='text'
              className={styles.directoryInput}
              placeholder='Example: jp tg mu'
              value={localDirectoryInput}
              onChange={(e) => setLocalDirectoryInput(e.target.value)}
            />
          </div>

          {subscriptions.length > 0 && (
            <div className={styles.section}>
              <h3>Subscriptions</h3>
              <p>Select which subscriptions to show in the topbar:</p>
              <div className={styles.checkboxGroup}>
                {subscriptions.map((address: string) => {
                  const boardPath = getBoardPath(address, defaultSubplebbits);
                  const displayText = address.endsWith('.eth') || address.endsWith('.sol') ? address : Plebbit.getShortAddress(address);
                  const isChecked = localSubscriptionVisibility.has(address);
                  return (
                    <div key={address} className={styles.checkboxItem}>
                      <input type='checkbox' id={`subscription-${address}`} checked={isChecked} onChange={() => handleSubscriptionToggle(address)} />
                      <label htmlFor={`subscription-${address}`}>{boardPath || displayText}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className={styles.topbarEditFooter}>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default TopbarEditModal;
