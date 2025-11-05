import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDefaultSubplebbitsState, MultisubSubplebbit } from '../../../hooks/use-default-subplebbits';
import LoadingEllipsis from '../../../components/loading-ellipsis';
import useDisclaimerModalStore from '../../../stores/use-disclaimer-modal-store';
import useBoardsFilterStore from '../../../stores/use-boards-filter-store';
import BoardsFilterModal from './boards-filter-modal';
import styles from '../home.module.css';

// Helper function to find board address by matching title pattern
const findBoardAddress = (multisub: MultisubSubplebbit[], titlePattern: string): string | null => {
  const entry = multisub.find((ms) => ms.title === titlePattern);
  return entry?.address || null;
};

const NSFWBadge = () => {
  return (
    <>
      &nbsp;
      <h3 className={styles.nsfwBadge}>
        <span title='Not Safe For Work'>
          <sup>(NSFW)</sup>
        </span>
      </h3>
    </>
  );
};

const BoardsList = ({ multisub }: { multisub: MultisubSubplebbit[] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, error } = useDefaultSubplebbitsState();
  const { showDisclaimerModal } = useDisclaimerModalStore();
  const { useCatalogLinks, boardFilter } = useBoardsFilterStore();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, address: string) => {
    e.preventDefault();
    showDisclaimerModal(address, navigate);
  };

  // Helper to generate link URL with optional catalog suffix
  const getBoardLink = (address: string | null): string => {
    if (!address) return '#';
    return `/p/${address}${useCatalogLinks ? '/catalog' : ''}`;
  };

  if (loading) {
    return (
      <div className={styles.box}>
        <div className={`${styles.boxBar} ${styles.color2ColorBar}`}>
          <h2 className='capitalize'>{t('boards')}</h2>
          <BoardsFilterModal />
        </div>
        <div className={styles.boxContent}>
          <LoadingEllipsis string={t('loading_default_boards')} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.box}>
        <div className={`${styles.boxBar} ${styles.color2ColorBar}`}>
          <h2 className='capitalize'>{t('boards')}</h2>
          <BoardsFilterModal />
        </div>
        <div className={styles.boxContent}>
          <div className='red'>{error.message}</div>
        </div>
      </div>
    );
  }

  // Find active boards
  const bizAddress = findBoardAddress(multisub, '/biz/ - Business & Finance');
  const polAddress = findBoardAddress(multisub, '/pol/ - Politically Incorrect');

  // Filtering logic: determine which categories to show
  const showAll = boardFilter === 'all';
  const showNsfwOnly = boardFilter === 'nsfw';
  const showWorksafeOnly = boardFilter === 'worksafe';

  // Category visibility based on filter
  const showJapaneseCulture = showAll || showWorksafeOnly;
  const showVideoGames = showAll || showWorksafeOnly;
  const showInterests = showAll || showWorksafeOnly;
  const showCreative = showAll || showWorksafeOnly;
  const showOther = showAll || showWorksafeOnly;
  const showMisc = showAll || showNsfwOnly;
  const showAdult = showAll || showNsfwOnly;

  return (
    <div className={styles.box}>
      <div className={`${styles.boxBar} ${styles.color2ColorBar}`}>
        <h2 className='capitalize'>{t('boards')}</h2>
        <BoardsFilterModal />
      </div>
      <div className={`${styles.boxContent} ${styles.boardsContent}`}>
        {/* Japanese Culture */}
        {showJapaneseCulture && (
          <div className={styles.boardsColumn}>
            <h3>Japanese Culture</h3>
            <ul>
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Anime & Manga
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Anime/Cute
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Anime/Wallpapers
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Video Games */}
        {showVideoGames && (
          <div className={styles.boardsColumn}>
            <h3>Video Games</h3>
            <ul>
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Video Games
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Video Game Generals
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Interests */}
        {showInterests && (
          <div className={styles.boardsColumn}>
            <h3>Interests</h3>
            <ul>
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Technology
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Comics & Cartoons
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Television & Film
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Creative */}
        {showCreative && (
          <div className={styles.boardsColumn}>
            <h3>Creative</h3>
            <ul>
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Photography
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Literature
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Music
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Other - ACTIVE: biz */}
        {showOther && (
          <div className={styles.boardsColumn}>
            <h3>Other</h3>
            <ul>
              {bizAddress && (
                <li>
                  <Link to={getBoardLink(bizAddress)} onClick={(e) => handleLinkClick(e, bizAddress)}>
                    Business & Finance
                  </Link>
                </li>
              )}
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Travel
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Fitness
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Misc. (NSFW) - ACTIVE: pol */}
        {showMisc && (
          <div className={styles.boardsColumn}>
            <h3>Misc.</h3>
            <NSFWBadge />
            <ul>
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Random
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  ROBOT9001
                </Link>
              </li>
              {polAddress && (
                <li>
                  <Link to={getBoardLink(polAddress)} onClick={(e) => handleLinkClick(e, polAddress)}>
                    Politically Incorrect
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Adult (NSFW) */}
        {showAdult && (
          <div className={styles.boardsColumn}>
            <h3>Adult</h3>
            <NSFWBadge />
            <ul>
              {/* Placeholder boards */}
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Sexy Beautiful Women
                </Link>
              </li>
              <li>
                <Link to='#' onClick={(e) => e.preventDefault()}>
                  Hardcore
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardsList;
