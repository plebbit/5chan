import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Plebbit from '@plebbit/plebbit-js';
import { useDefaultSubplebbitsState, MultisubSubplebbit } from '../../../hooks/use-default-subplebbits';
import useIsMobile from '../../../hooks/use-is-mobile';
import LoadingEllipsis from '../../../components/loading-ellipsis';
import styles from './boards-list.module.css';

const Board = ({ subplebbit, isMobile }: { subplebbit: MultisubSubplebbit; isMobile: boolean }) => {
  const { t } = useTranslation();
  const { address, title, nsfw } = subplebbit || {};
  const displayAddress = address && Plebbit.getShortAddress(address);

  return (
    <tr key={address}>
      <td>
        <p className={styles.boardCell}>
          <Link to={`/p/${address}`}>{displayAddress}</Link>
          {nsfw && <span className={styles.nsfw}> ({t('nsfw')})</span>}
        </p>
      </td>
      <td>
        <p className={styles.boardCell}>{title || displayAddress}</p>
      </td>
    </tr>
  );
};

const BoardsList = ({ multisub }: { multisub: MultisubSubplebbit[] }) => {
  const { t } = useTranslation();
  const [displayCount, setDisplayCount] = useState(15);
  const isMobile = useIsMobile();
  const { loading, error } = useDefaultSubplebbitsState();

  if (loading) {
    return (
      <div className={styles.boardsBox}>
        <span className={styles.loading}>
          <LoadingEllipsis string={t('loading_default_boards')} />
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.boardsBox}>
        <div className='red'>{error.message}</div>
      </div>
    );
  }

  const filteredBoards = multisub.slice(0, displayCount);
  const totalBoardCount = multisub.length;
  const hasMoreBoards = displayCount < multisub.length;

  return (
    <div className={styles.boardsBox}>
      <table className={styles.boardsList}>
        <colgroup>
          <col className={styles.boardAddress} />
          <col className={styles.boardTitle} />
        </colgroup>
        <thead>
          <tr>
            <th>{t('board')}</th>
            <th>{t('title')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredBoards.map((sub) => (
            <Board key={sub.address} subplebbit={sub} isMobile={isMobile} />
          ))}
        </tbody>
      </table>
      <div className={styles.displayCount}>
        {t('displaying_boards', { filteredBoardsCount: filteredBoards.length, totalBoardCount: totalBoardCount, interpolation: { escapeValue: false } })}
      </div>
      {hasMoreBoards && (
        <div className={styles.loadMoreButton}>
          [<span onClick={() => setDisplayCount((prevCount) => prevCount + 15)}>{t('load_more')}</span>]
        </div>
      )}
    </div>
  );
};

export default BoardsList;
