import useDirectoryModalStore from '../../stores/use-directory-modal-store';
import styles from './directory-modal.module.css';

const DirectoryModal = () => {
  const { showModal, modalContext, closeDirectoryModal } = useDirectoryModalStore();

  if (!showModal) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeDirectoryModal();
    }
  };

  const isPlaceholderContext = modalContext === 'placeholder';

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.directoryDialog}>
        <div className={styles.hd}>
          <h2>{isPlaceholderContext ? 'Submit a Board to a Directory' : 'Create a Board'}</h2>
          <button className={styles.closeButton} onClick={closeDirectoryModal} title='Close' />
        </div>
        <div className={styles.bd}>
          {isPlaceholderContext && (
            <p className={styles.introMessage}>
              <strong>The board you clicked on doesn&apos;t exist yet, but it can be yours!</strong>
            </p>
          )}

          {isPlaceholderContext && (
            <div className={styles.section}>
              <h3>What is a directory board vs a regular board?</h3>
              <p>
                On 5chan, anyone can create and connect to any board using its address. A &quot;directory board&quot; is simply a board that has been assigned to a
                specific directory category (like &quot;Anime & Manga&quot; or &quot;Video Games&quot;) in the boards list on the homepage. This assignment is temporary
                and handpicked by the devs until DAO curation is implemented.
              </p>
              <p>
                <strong>Important:</strong> Anyone can create a board and users can access it at any time, regardless of whether it&apos;s assigned to a directory or not.
                You can use the search bar on the homepage to connect to any board address peer-to-peer, even if it&apos;s not added as a directory. Additionally, every
                board has a &quot;[Subscribe]&quot; button—when you subscribe to a board, it will appear in the top bar on the boards page, making it easy to access your
                favorite boards regardless of directory assignment.
              </p>
            </div>
          )}

          <div className={styles.section}>
            <h3>How to create your own board</h3>
            <p>
              You can create a board using either the{' '}
              <a href='https://plebbit.github.io/docs/learn/clients/5chan/create-a-board' target='_blank' rel='noopener noreferrer'>
                Seedit GUI client
              </a>{' '}
              or the{' '}
              <a href='https://github.com/plebbit/plebbit-cli' target='_blank' rel='noopener noreferrer'>
                plebbit-cli command line interface
              </a>
              . Once created, anyone can connect to your board using its address, regardless of whether it&apos;s assigned to a directory or not.
            </p>
            <p>
              <strong>Building a following:</strong> Every board has a &quot;[Subscribe]&quot; button that users can click to subscribe to your board. When users
              subscribe, your board will appear in the top bar on the boards page, making it easy for them to access it. This means you can build a following and have
              active users even if your board isn&apos;t assigned to a directory or known by the devs. Users can discover your board through direct links, word of mouth,
              or by searching for your board address.
            </p>
          </div>

          {isPlaceholderContext && (
            <div className={styles.section}>
              <h3>Requirements for directory assignment</h3>
              <p>
                To have your board assigned to a directory, it should be active, well-moderated, and relevant to the directory category. Most importantly, it should have
                99% uptime, since a board acts like its own server (it&apos;s a P2P node). The devs review submissions and reserve the right to approve or reject them
                based on these criteria.
              </p>
            </div>
          )}

          <div className={styles.section}>
            <h3>How to submit your board</h3>
            <p>
              To request your board be added to a directory, open a pull request on GitHub by editing the{' '}
              <a href='https://github.com/plebbit/lists/blob/master/5chan-multisub.json' target='_blank' rel='noopener noreferrer'>
                5chan-multisub.json file
              </a>
              . Add your board&apos;s entry with its title, address, and NSFW status (if applicable). The devs will review your PR and merge it if approved.
            </p>
          </div>

          <div className={styles.section}>
            <h3>Future roadmap</h3>
            <p>
              In the future, directory board assignments will be determined through gasless voting using pubsub. Community members will vote on which board should be
              assigned to each directory, and the highest voted board will automatically become the directory board. This will make the process fully decentralized and
              community-driven.
            </p>
            <p>
              <strong>Discovery through voting pages:</strong> Each directory will have its own pubsub voting page that will serve as a discovery page for boards in that
              category. Even low-voted or low-quality boards will appear in these voting lists, giving them visibility and helping them find users. This means boards
              don&apos;t need to win the directory slot or be approved by devs to gain exposure—they can still be discovered and grow their subscriber base through the
              voting pages. See the{' '}
              <a href='https://github.com/plebbit/plebbit-js/issues/25' target='_blank' rel='noopener noreferrer'>
                pubsub voting design draft
              </a>{' '}
              for more details.
            </p>
          </div>

          <div className={styles.section}>
            <h3>Dev veto power</h3>
            <p>
              While the devs reserve the right to change directory resolutions, this is done through commits in the fully open-source repository. There is no centralized
              or server-side action required—anyone can change the directory resolution by modifying the code and redeploying to their own domain. 5chan is adminless, and
              the app itself has no owner or central authority.
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
