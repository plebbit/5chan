import { useLocation } from 'react-router-dom';
import useDirectoryModalStore from '../../stores/use-directory-modal-store';
import styles from './directory-modal.module.css';

const DirectoryModal = () => {
  const { showModal, closeDirectoryModal } = useDirectoryModalStore();
  const location = useLocation();
  const isHomeView = location.pathname === '/';

  if (!showModal) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeDirectoryModal();
    }
  };

  return (
    <div className={`${styles.backdrop} ${isHomeView ? styles.backdropHome : ''}`} onClick={handleBackdropClick}>
      <div className={styles.directoryDialog}>
        <div className={styles.hd}>
          <h2>Submit a Board to a Directory</h2>
          <button className={styles.closeButton} onClick={closeDirectoryModal} title='Close' />
        </div>
        <div className={styles.bd}>
          <p className={styles.introMessage}>
            <strong>The board you clicked on doesn&apos;t exist yet, but it can be yours!</strong>
          </p>

          <div className={styles.section}>
            <h3>Directory vs Regular Board</h3>
            <p>
              A &quot;directory board&quot; is assigned to a category on the homepage (like &quot;Anime & Manga&quot; or &quot;Video Games&quot;). Directory assignments
              are temporary and handpicked by devs until DAO curation is implemented.{' '}
              <strong>Anyone can create a board and users can access it anytime using its address</strong>—use the search bar, direct links, or the
              &quot;[Subscribe]&quot; button to access boards regardless of directory assignment.
            </p>
          </div>

          <div className={styles.section}>
            <h3>Creating Your Board</h3>
            <p>
              Create a board using the{' '}
              <a href='https://plebbit.github.io/docs/learn/clients/5chan/create-a-board' target='_blank' rel='noopener noreferrer'>
                Seedit GUI client
              </a>{' '}
              or{' '}
              <a href='https://github.com/plebbit/plebbit-cli' target='_blank' rel='noopener noreferrer'>
                plebbit-cli
              </a>
              . <strong>Build a following:</strong> Users can subscribe to your board via the &quot;[Subscribe]&quot; button, which adds it to their top bar. You can gain
              subscribers through direct links, word of mouth, or search—no directory assignment or dev approval needed.
            </p>
          </div>

          <div className={styles.section}>
            <h3>Directory Requirements</h3>
            <p>
              Boards need 99% uptime (they&apos;re P2P nodes), plus be active, well-moderated, and relevant to the category. Devs review and approve/reject based on these
              criteria.
            </p>
          </div>

          <div className={styles.section}>
            <h3>Submitting to a Directory</h3>
            <p>
              Open a PR editing{' '}
              <a href='https://github.com/plebbit/lists/blob/master/5chan-multisub.json' target='_blank' rel='noopener noreferrer'>
                5chan-multisub.json
              </a>{' '}
              with your board&apos;s title, address, and NSFW status. Devs will review and merge if approved. 99% uptime is required.
            </p>
          </div>

          <div className={styles.section}>
            <h3>Future: DAO Voting</h3>
            <p>
              Directory assignments will use gasless pubsub voting—communities vote, highest-voted board wins the slot. <strong>Voting pages = discovery:</strong> Each
              directory&apos;s voting page lists all competing boards (even low-voted ones), giving visibility without winning or dev approval. See{' '}
              <a href='https://github.com/plebbit/plebbit-js/issues/25' target='_blank' rel='noopener noreferrer'>
                design draft
              </a>
              .
            </p>
          </div>

          <div className={styles.section}>
            <h3>Decentralization</h3>
            <p>
              Devs can change directories via commits in the open-source repo. No centralized servers—anyone can fork, modify, and redeploy to their own domain. 5chan is
              adminless with no central authority.
            </p>
          </div>
        </div>
        <div className={styles.directoryFooter}>
          <button onClick={closeDirectoryModal}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DirectoryModal;
