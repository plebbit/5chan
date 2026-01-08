import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useAccountSubplebbits, useFeed, Comment, usePublishCommentModeration } from '@plebbit/plebbit-react-hooks';
import { Virtuoso } from 'react-virtuoso';
import { formatDistanceToNow } from 'date-fns';
import styles from './mod-queue.module.css';
import useModQueueStore from '../../stores/use-mod-queue-store';
import { useAccountSubplebbitsWithMetadata } from '../../hooks/use-account-subplebbits-with-metadata';
import LoadingEllipsis from '../../components/loading-ellipsis';
import { useFeedStateString } from '../../hooks/use-state-string';
import { getSubplebbitAddress, getBoardPath } from '../../lib/utils/route-utils';
import { useDefaultSubplebbits, MultisubSubplebbit } from '../../hooks/use-default-subplebbits';
import { useBoardPath } from '../../hooks/use-resolved-subplebbit-address';
import { getHasThumbnail, getCommentMediaInfo } from '../../lib/utils/media-utils';
import useFeedResetStore from '../../stores/use-feed-reset-store';

interface ModQueueViewProps {
  boardIdentifier?: string; // If provided, shows queue for single board
}

interface ModQueueRowProps {
  comment: Comment;
  showBoardColumn?: boolean;
}

const ModQueueRow = ({ comment, showBoardColumn = false }: ModQueueRowProps) => {
  const { t } = useTranslation();
  const { alertThresholdHours } = useModQueueStore();
  const [isModerating, setIsModerating] = useState(false);

  const { content, title, timestamp, subplebbitAddress, cid, threadCid, link, thumbnailUrl, linkWidth, linkHeight } = comment;

  const boardPath = useBoardPath(subplebbitAddress);
  const timeWaiting = Date.now() / 1000 - timestamp;
  const isOverThreshold = timeWaiting > alertThresholdHours * 3600;

  const { publishCommentModeration: approve } = usePublishCommentModeration({
    commentCid: cid,
    subplebbitAddress,
    commentModeration: { approved: true },
  });

  const { publishCommentModeration: reject } = usePublishCommentModeration({
    commentCid: cid,
    subplebbitAddress,
    commentModeration: { removed: true },
  });

  const handleApprove = async () => {
    try {
      setIsModerating(true);
      await approve();
    } catch (e) {
      console.error(e);
    } finally {
      setIsModerating(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsModerating(true);
      await reject();
    } catch (e) {
      console.error(e);
    } finally {
      setIsModerating(false);
    }
  };

  const excerpt = title || content || (getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), link) ? t('image') : t('no_content'));
  const postUrl = `/${boardPath}/thread/${threadCid || cid}`;

  return (
    <div className={styles.row}>
      {showBoardColumn && (
        <div className={styles.board}>
          <Link to={`/${boardPath}`}>/{boardPath}/</Link>
        </div>
      )}
      <div className={styles.excerpt}>
        <Link to={postUrl} title={excerpt}>
          {excerpt}
        </Link>
      </div>
      <div className={`${styles.time} ${isOverThreshold ? styles.alert : ''}`}>{formatDistanceToNow(timestamp * 1000, { addSuffix: false })}</div>
      <div className={styles.actions}>
        <button className={`${styles.button} ${styles.approve}`} onClick={handleApprove} disabled={isModerating}>
          {t('approve')}
        </button>
        <button className={`${styles.button} ${styles.reject}`} onClick={handleReject} disabled={isModerating}>
          {t('reject')}
        </button>
        <Link to={postUrl} className={styles.button}>
          {t('view')}
        </Link>
      </div>
    </div>
  );
};

interface ModQueueBoardFilterProps {
  subplebbits: MultisubSubplebbit[];
}

const ModQueueBoardFilter = ({ subplebbits }: ModQueueBoardFilterProps) => {
  const { t } = useTranslation();
  const { selectedBoardFilter, setSelectedBoardFilter } = useModQueueStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBoardFilter(value === '' ? null : value);
  };

  if (!subplebbits || subplebbits.length === 0) {
    return null;
  }

  return (
    <div className={styles.filterContainer}>
      <label>{t('filter_by_board')}:</label>
      <select className={styles.filterSelect} value={selectedBoardFilter || ''} onChange={handleChange}>
        <option value=''>{t('all_boards')}</option>
        {subplebbits.map((sub) => {
          const address = sub.address;
          if (!address) return null;
          return (
            <option key={address} value={address}>
              /{getBoardPath(address, subplebbits)}/
            </option>
          );
        })}
      </select>
    </div>
  );
};

interface ModQueueButtonProps {
  boardIdentifier?: string;
  isMobile?: boolean;
}

export const ModQueueButton = ({ boardIdentifier, isMobile }: ModQueueButtonProps) => {
  const { t } = useTranslation();
  const { alertThresholdHours } = useModQueueStore();
  const { accountSubplebbits } = useAccountSubplebbits();
  const accountSubplebbitAddresses = useMemo(() => Object.keys(accountSubplebbits || {}), [accountSubplebbits]);
  const defaultSubplebbits = useDefaultSubplebbits();

  // Resolve boardIdentifier to address if it exists
  const resolvedAddress = useMemo(() => {
    if (boardIdentifier) {
      return getSubplebbitAddress(boardIdentifier, defaultSubplebbits);
    }
    return undefined;
  }, [boardIdentifier, defaultSubplebbits]);

  const subplebbitAddresses = useMemo(() => {
    if (resolvedAddress) {
      return [resolvedAddress];
    }
    return accountSubplebbitAddresses;
  }, [resolvedAddress, accountSubplebbitAddresses]);

  // If specific board, check if user is mod using resolved address
  const isModOfBoard = resolvedAddress ? accountSubplebbitAddresses.includes(resolvedAddress) : true;

  // Only fetch if we have addresses to check and permissions
  const shouldFetch = subplebbitAddresses.length > 0 && isModOfBoard;

  const { feed } = useFeed({
    subplebbitAddresses: shouldFetch ? subplebbitAddresses : [],
    modQueue: ['pendingApproval'],
    postsPerPage: 100, // Fetch enough to check timestamps
  });

  if (!shouldFetch || subplebbitAddresses.length === 0) {
    return null;
  }

  // Separate comments into normal and urgent based on threshold
  // Match ModQueueRow logic: use > (strictly greater) to be consistent
  const { normalCount, urgentCount } = useMemo(() => {
    const thresholdSeconds = alertThresholdHours * 3600;
    const now = Date.now() / 1000;

    let normal = 0;
    let urgent = 0;

    for (const item of feed) {
      const timeWaiting = now - item.timestamp;
      if (timeWaiting > thresholdSeconds) {
        urgent++;
      } else {
        normal++;
      }
    }

    return { normalCount: normal, urgentCount: urgent };
  }, [feed, alertThresholdHours]);

  const totalCount = normalCount + urgentCount;

  // Use boardIdentifier for the route, but resolvedAddress for mod check
  const to = boardIdentifier ? `/${boardIdentifier}/queue` : '/mod/queue';

  return (
    <button className='button'>
      <Link to={to}>
        {t('mod_queue')}
        {totalCount > 0 && (
          <strong>
            (
            {urgentCount > 0 && normalCount > 0 ? (
              <>
                <span className={styles.modQueueButtonCount}>{normalCount}</span>
                <span className={`${styles.modQueueButtonCount} ${styles.modQueueButtonCountAlert}`}>
                  {'+'}
                  {urgentCount}
                </span>
              </>
            ) : urgentCount > 0 ? (
              <span className={`${styles.modQueueButtonCount} ${styles.modQueueButtonCountAlert}`}>{urgentCount}</span>
            ) : (
              <span className={styles.modQueueButtonCount}>{totalCount}</span>
            )}
            )
          </strong>
        )}
      </Link>
    </button>
  );
};

export const ModQueueView = ({ boardIdentifier: propBoardIdentifier }: ModQueueViewProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const { selectedBoardFilter, alertThresholdHours, setAlertThresholdHours } = useModQueueStore();
  const { accountSubplebbits } = useAccountSubplebbits();
  const accountSubplebbitAddresses = Object.keys(accountSubplebbits);
  const defaultSubplebbits = useDefaultSubplebbits();

  const boardIdentifier = propBoardIdentifier || params.boardIdentifier;

  // Resolve boardIdentifier to address if it exists
  const resolvedAddress = useMemo(() => {
    if (boardIdentifier) {
      return getSubplebbitAddress(boardIdentifier, defaultSubplebbits);
    }
    return undefined;
  }, [boardIdentifier, defaultSubplebbits]);

  // Get metadata for filter dropdown
  const subplebbitsWithMetadata = useAccountSubplebbitsWithMetadata();

  const subplebbitAddresses = useMemo(() => {
    if (resolvedAddress) {
      return [resolvedAddress];
    }

    if (selectedBoardFilter) {
      return [selectedBoardFilter];
    }

    return accountSubplebbitAddresses;
  }, [resolvedAddress, selectedBoardFilter, accountSubplebbitAddresses]);

  const { feed, hasMore, loadMore, reset } = useFeed({
    subplebbitAddresses,
    modQueue: ['pendingApproval'],
    postsPerPage: 50,
  });

  // Register reset function with feed reset store so refresh button works
  const setResetFunction = useFeedResetStore((state) => state.setResetFunction);
  useEffect(() => {
    setResetFunction(reset);
  }, [reset, setResetFunction]);

  const loadingStateString = useFeedStateString(subplebbitAddresses) || t('loading');
  const showBoardColumn = !resolvedAddress && !selectedBoardFilter;

  const Footer = () => {
    return hasMore ? (
      <div style={{ padding: '10px', textAlign: 'center' }}>
        <LoadingEllipsis string={loadingStateString} />
      </div>
    ) : null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{t('moderation_queue')}</div>
        <div className={styles.alertThresholdSetting}>
          <label>
            {t('mod_queue_alert_threshold')}:
            <input
              type='number'
              min='1'
              value={alertThresholdHours}
              onChange={(e) => setAlertThresholdHours(Number(e.target.value))}
              className={styles.alertThresholdInput}
            />{' '}
            {t('hours')}
          </label>
        </div>
      </div>

      {!resolvedAddress && <ModQueueBoardFilter subplebbits={subplebbitsWithMetadata} />}

      {feed.length === 0 && !hasMore ? (
        <div className={styles.empty}>{t('queue_is_empty')}</div>
      ) : (
        <>
          <div className={styles.tableHeader}>
            {showBoardColumn && <div className={styles.boardHeader}>{t('board')}</div>}
            <div className={styles.excerptHeader}>{t('excerpt')}</div>
            <div className={styles.timeHeader}>{t('waiting')}</div>
            <div className={styles.actionsHeader}>{t('actions')}</div>
          </div>

          <Virtuoso
            useWindowScroll
            data={feed}
            totalCount={feed.length}
            endReached={loadMore}
            itemContent={(index, comment) => <ModQueueRow key={comment.cid} comment={comment} showBoardColumn={showBoardColumn} />}
            components={{ Footer }}
          />
        </>
      )}
    </div>
  );
};

export default ModQueueView;
