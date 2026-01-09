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
import useChallengesStore from '../../stores/use-challenges-store';
import { alertChallengeVerificationFailed } from '../../lib/utils/challenge-utils';

const { addChallenge } = useChallengesStore.getState();

interface ModQueueViewProps {
  boardIdentifier?: string; // If provided, shows queue for single board
}

interface ModQueueFooterProps {
  hasMore: boolean;
  loadingStateString: string;
}

// Defined outside ModQueueView to preserve component identity across renders (Virtuoso optimization)
const ModQueueFooter = ({ hasMore, loadingStateString }: ModQueueFooterProps) => {
  return hasMore ? (
    <div style={{ padding: '10px', textAlign: 'center' }}>
      <LoadingEllipsis string={loadingStateString} />
    </div>
  ) : null;
};

interface ModQueueRowProps {
  comment: Comment;
  showBoardColumn?: boolean;
}

// Track which action was initiated to show appropriate completion message
type ModerationAction = 'approve' | 'reject' | null;

const ModQueueRow = ({ comment, showBoardColumn = false }: ModQueueRowProps) => {
  const { t } = useTranslation();
  const { alertThresholdHours } = useModQueueStore();
  const [initiatedAction, setInitiatedAction] = useState<ModerationAction>(null);

  const { content, title, timestamp, subplebbitAddress, cid, threadCid, link, thumbnailUrl, linkWidth, linkHeight, removed, approved } = comment;

  // Check if already moderated (from previous session or API update)
  // Note: `approved` and `removed` are direct fields on the comment from CommentUpdate,
  // not nested under commentModeration (which is the options object for publishing moderation actions)
  const alreadyApproved = approved === true;
  const alreadyRejected = removed === true;

  const boardPath = useBoardPath(subplebbitAddress);
  const timeWaiting = Date.now() / 1000 - timestamp;
  const isOverThreshold = timeWaiting > alertThresholdHours * 3600;

  const {
    publishCommentModeration: approve,
    state: approveState,
    error: approveError,
  } = usePublishCommentModeration({
    commentCid: cid,
    subplebbitAddress,
    commentModeration: { approved: true },
    onChallenge: async (...args: any) => {
      addChallenge([...args, comment]);
    },
    onChallengeVerification: async (challengeVerification, comment) => {
      alertChallengeVerificationFailed(challengeVerification, comment);
    },
    onError: (error: Error) => {
      console.error('Approve failed:', error);
    },
  });

  const {
    publishCommentModeration: reject,
    state: rejectState,
    error: rejectError,
  } = usePublishCommentModeration({
    commentCid: cid,
    subplebbitAddress,
    commentModeration: { removed: true },
    onChallenge: async (...args: any) => {
      addChallenge([...args, comment]);
    },
    onChallengeVerification: async (challengeVerification, comment) => {
      alertChallengeVerificationFailed(challengeVerification, comment);
    },
    onError: (error: Error) => {
      console.error('Reject failed:', error);
    },
  });

  const handleApprove = async () => {
    setInitiatedAction('approve');
    try {
      await approve();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    setInitiatedAction('reject');
    try {
      await reject();
    } catch (e) {
      console.error(e);
    }
  };

  // Determine the current moderation state based on which action was initiated
  const isApproving = initiatedAction === 'approve' && approveState !== 'initializing' && approveState !== 'succeeded' && approveState !== 'failed';
  const isRejecting = initiatedAction === 'reject' && rejectState !== 'initializing' && rejectState !== 'succeeded' && rejectState !== 'failed';
  const isPublishing = isApproving || isRejecting;

  const approveSucceeded = initiatedAction === 'approve' && approveState === 'succeeded';
  const rejectSucceeded = initiatedAction === 'reject' && rejectState === 'succeeded';

  const approveFailed = initiatedAction === 'approve' && approveState === 'failed';
  const rejectFailed = initiatedAction === 'reject' && rejectState === 'failed';

  const excerpt = title || content || (getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), link) ? t('image') : t('no_content'));
  const threadTargetCid = threadCid || cid;
  const postUrl = boardPath && threadTargetCid ? `/${boardPath}/thread/${threadTargetCid}` : undefined;

  // Render the status or action buttons
  const renderActions = () => {
    // Check existing moderation state first (from API/previous sessions)
    if (alreadyApproved || approveSucceeded) {
      return <span className={`${styles.button} ${styles.approve}`}>{t('approved')}</span>;
    }
    if (alreadyRejected || rejectSucceeded) {
      return <span className={`${styles.button} ${styles.reject}`}>{t('rejected')}</span>;
    }
    if (approveFailed) {
      return (
        <span className={`${styles.button} ${styles.reject}`}>
          {t('failed')}: {approveError?.message}
        </span>
      );
    }
    if (rejectFailed) {
      return (
        <span className={`${styles.button} ${styles.reject}`}>
          {t('failed')}: {rejectError?.message}
        </span>
      );
    }
    if (isPublishing) {
      return <LoadingEllipsis string={t('publishing')} />;
    }

    return (
      <>
        [
        <button className={styles.button} onClick={handleApprove} disabled={isPublishing}>
          {t('approve')}
        </button>
        ] [
        <button className={styles.button} onClick={handleReject} disabled={isPublishing}>
          {t('reject')}
        </button>
        ]
      </>
    );
  };

  return (
    <div className={styles.row}>
      {showBoardColumn && <div className={styles.board}>{boardPath ? <Link to={`/${boardPath}`}>/{boardPath}/</Link> : <span>—</span>}</div>}
      <div className={styles.excerpt}>
        {postUrl ? (
          <Link to={postUrl} title={excerpt}>
            {excerpt}
          </Link>
        ) : (
          <span title={excerpt}>{excerpt}</span>
        )}
      </div>
      <div className={`${styles.time} ${isOverThreshold ? styles.alert : ''}`}>{formatDistanceToNow(timestamp * 1000, { addSuffix: false })}</div>
      <div className={styles.actions}>{renderActions()}</div>
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

  // Sort feed by timestamp (oldest first) to match ModQueueView sorting
  const sortedFeed = useMemo(() => {
    return [...feed].sort((a, b) => a.timestamp - b.timestamp);
  }, [feed]);

  // Separate comments into normal and urgent based on threshold
  // Match ModQueueRow logic: use > (strictly greater) to be consistent
  const { normalCount, urgentCount } = useMemo(() => {
    const thresholdSeconds = alertThresholdHours * 3600;
    const now = Date.now() / 1000;

    let normal = 0;
    let urgent = 0;

    for (const item of sortedFeed) {
      const timeWaiting = now - item.timestamp;
      if (timeWaiting > thresholdSeconds) {
        urgent++;
      } else {
        normal++;
      }
    }

    return { normalCount: normal, urgentCount: urgent };
  }, [sortedFeed, alertThresholdHours]);

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

  // Sort feed by timestamp (oldest first) to show items waiting longest at the top
  const sortedFeed = useMemo(() => {
    return [...feed].sort((a, b) => a.timestamp - b.timestamp);
  }, [feed]);

  // Register reset function with feed reset store so refresh button works
  const setResetFunction = useFeedResetStore((state) => state.setResetFunction);
  useEffect(() => {
    setResetFunction(reset);
  }, [reset, setResetFunction]);

  const loadingStateString = useFeedStateString(subplebbitAddresses) || t('loading');
  const showBoardColumn = !resolvedAddress && !selectedBoardFilter;

  // Memoize footer components object to preserve identity across renders (Virtuoso optimization)
  const footerComponents = useMemo(
    () => ({
      Footer: () => <ModQueueFooter hasMore={hasMore} loadingStateString={loadingStateString} />,
    }),
    [hasMore, loadingStateString],
  );

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

      {sortedFeed.length === 0 && !hasMore ? (
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
            data={sortedFeed}
            totalCount={sortedFeed.length}
            endReached={loadMore}
            itemContent={(index, comment) => <ModQueueRow key={comment.cid} comment={comment} showBoardColumn={showBoardColumn} />}
            components={footerComponents}
          />
        </>
      )}
    </div>
  );
};

export default ModQueueView;
