import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useBoardsFilterStore from '../../../stores/use-boards-filter-store';
import { DISCLAIMER_ACCEPTED_KEY } from '../../../stores/use-disclaimer-modal-store';
import styles from '../home.module.css';

const BoardsFilterModal = () => {
  const { t } = useTranslation();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);

  const { useCatalogLinks, setUseCatalogLinks, boardFilter, setBoardFilter } = useBoardsFilterStore();

  // Check if disclaimer has been accepted
  const hasAcceptedDisclaimer = (): boolean => {
    try {
      return localStorage.getItem(DISCLAIMER_ACCEPTED_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const disclaimerAccepted = hasAcceptedDisclaimer();

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowFilterModal(false);
      }
    },
    [modalRef, buttonRef, setShowFilterModal],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <>
      <span ref={buttonRef} onClick={() => !showFilterModal && setShowFilterModal(true)}>
        {t('filter')} ▼
      </span>
      {showFilterModal && (
        <div ref={modalRef} className={styles.filterModal}>
          {/* Always shown: Use Catalog */}
          <div
            className={`${styles.option} ${useCatalogLinks && styles.selected}`}
            onClick={() => {
              setUseCatalogLinks(!useCatalogLinks);
              setShowFilterModal(false);
            }}
          >
            {t('use_catalog')}
          </div>

          {/* Conditionally shown: Filtering options (only after disclaimer accepted) */}
          {disclaimerAccepted && (
            <>
              <div className={styles.separator} />
              <div
                className={`${styles.option} ${boardFilter === 'all' && styles.selected}`}
                onClick={() => {
                  setBoardFilter('all');
                  setShowFilterModal(false);
                }}
              >
                {t('show_all_boards')}
              </div>
              <div
                className={`${styles.option} ${boardFilter === 'nsfw' && styles.selected}`}
                onClick={() => {
                  setBoardFilter('nsfw');
                  setShowFilterModal(false);
                }}
              >
                {t('show_nsfw_boards_only')}
              </div>
              <div
                className={`${styles.option} ${boardFilter === 'worksafe' && styles.selected}`}
                onClick={() => {
                  setBoardFilter('worksafe');
                  setShowFilterModal(false);
                }}
              >
                {t('show_worksafe_boards_only')}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default BoardsFilterModal;
