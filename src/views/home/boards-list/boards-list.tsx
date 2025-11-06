import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDefaultSubplebbitsState, MultisubSubplebbit } from '../../../hooks/use-default-subplebbits';
import LoadingEllipsis from '../../../components/loading-ellipsis';
import useDisclaimerModalStore from '../../../stores/use-disclaimer-modal-store';
import useDirectoryModalStore from '../../../stores/use-directory-modal-store';
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
  const { openDirectoryModal } = useDirectoryModalStore();
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

  // Handler for placeholder board links
  const handlePlaceholderClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    openDirectoryModal();
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
  const showJapaneseCulture = showAll || showWorksafeOnly || showNsfwOnly;
  const showVideoGames = showAll || showWorksafeOnly;
  const showInterests = showAll || showWorksafeOnly;
  const showCreative = showAll || showWorksafeOnly || showNsfwOnly;
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
        {/* Column 1: Japanese Culture + Video Games */}
        {(showJapaneseCulture || showVideoGames) && (
          <div className={styles.boardsColumn}>
            {/* Japanese Culture */}
            {showJapaneseCulture && (
              <>
                <h3>Japanese Culture</h3>
                <ul>
                  {(showAll || showWorksafeOnly) && (
                    <>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Anime & Manga
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Anime/Cute
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Anime/Wallpapers
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Mecha
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Cosplay & EGL
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Cute/Male
                        </Link>
                      </li>
                    </>
                  )}
                  {(showAll || showNsfwOnly) && (
                    <li>
                      <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                        Flash
                      </Link>
                    </li>
                  )}
                  {(showAll || showWorksafeOnly) && (
                    <>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Transportation
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Otaku Culture
                        </Link>
                      </li>
                      <li>
                        <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                          Virtual YouTubers
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </>
            )}

            {/* Video Games */}
            {showVideoGames && (
              <>
                <h3>Video Games</h3>
                <ul>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Video Games
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Video Game Generals
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Video Games/Multiplayer
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Video Games/Mobile
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Pokémon
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Retro Games
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Video Games/RPG
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Video Games/Strategy
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </div>
        )}

        {/* Column 2: Interests */}
        {showInterests && (
          <div className={styles.boardsColumn}>
            <h3>Interests</h3>
            <ul>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Comics & Cartoons
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Technology
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Television & Film
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Weapons
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Auto
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Animals & Nature
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Traditional Games
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Sports
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Extreme Sports
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Professional Wrestling
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Science & Math
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  History & Humanities
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  International
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Outdoors
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Toys
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Column 3: Creative */}
        {showCreative && (
          <div className={styles.boardsColumn}>
            <h3>Creative</h3>
            <ul>
              {(showAll || showNsfwOnly) && (
                <li>
                  <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                    Oekaki
                  </Link>
                </li>
              )}
              {(showAll || showWorksafeOnly) && (
                <>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Papercraft & Origami
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Photography
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Food & Cooking
                    </Link>
                  </li>
                </>
              )}
              {(showAll || showNsfwOnly) && (
                <li>
                  <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                    Artwork/Critique
                  </Link>
                </li>
              )}
              {(showAll || showNsfwOnly) && (
                <li>
                  <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                    Wallpapers/General
                  </Link>
                </li>
              )}
              {(showAll || showWorksafeOnly) && (
                <>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Literature
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Music
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Fashion
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      3DCG
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Graphic Design
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Do-It-Yourself
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Worksafe GIF
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Quests
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Column 4: Other + Misc. */}
        {(showOther || showMisc) && (
          <div className={styles.boardsColumn}>
            {/* Other */}
            {showOther && (
              <>
                <h3>Other</h3>
                <ul>
                  {bizAddress ? (
                    <li>
                      <Link to={getBoardLink(bizAddress)} onClick={(e) => handleLinkClick(e, bizAddress)}>
                        Business & Finance
                      </Link>
                    </li>
                  ) : (
                    <li>
                      <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                        Business & Finance
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Travel
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Fitness
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Paranormal
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Advice
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      LGBT
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Pony
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Current News
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Worksafe Requests
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Very Important Posts
                    </Link>
                  </li>
                </ul>
              </>
            )}

            {/* Misc. (NSFW) */}
            {showMisc && (
              <>
                <h3>Misc.</h3>
                <NSFWBadge />
                <ul>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Random
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      ROBOT9001
                    </Link>
                  </li>
                  {polAddress ? (
                    <li>
                      <Link to={getBoardLink(polAddress)} onClick={(e) => handleLinkClick(e, polAddress)}>
                        Politically Incorrect
                      </Link>
                    </li>
                  ) : (
                    <li>
                      <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                        Politically Incorrect
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      International/Random
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Cams & Meetups
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                      Shit 4chan Says
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </div>
        )}

        {/* Column 5: Adult (NSFW) */}
        {showAdult && (
          <div className={styles.boardsColumn}>
            <h3>Adult</h3>
            <NSFWBadge />
            <ul>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Sexy Beautiful Women
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Hardcore
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Handsome Men
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Hentai
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Ecchi
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Yuri
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Hentai/Alternative
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Yaoi
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Torrents
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  High Resolution
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Adult GIF
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Adult Cartoons
                </Link>
              </li>
              <li>
                <Link to='#' onClick={handlePlaceholderClick} className={styles.placeholder}>
                  Adult Requests
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
