import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useAccountSubplebbits, useFeed, Comment, usePublishCommentModeration, useEditedComment } from '@plebbit/plebbit-react-hooks';
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
import { getFormattedDate, getFormattedTimeAgo } from '../../lib/utils/time-utils';
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

  // handle pending mod or author edit
  const { editedComment } = useEditedComment({ comment });
  const displayComment = editedComment || comment;

  const { content, title, timestamp, subplebbitAddress, cid, threadCid, link, thumbnailUrl, linkWidth, linkHeight, removed, approved, number } = displayComment;

  // Check if already moderated (from previous session or API update)
  // Note: `approved` and `removed` are direct fields on the comment from CommentUpdate,
  // not nested under commentModeration (which is the options object for publishing moderation actions)
  const alreadyApproved = approved === true;
  const alreadyRejected = removed === true;

  const boardPath = useBoardPath(subplebbitAddress);
  const timeWaiting = Date.now() / 1000 - timestamp;
  const isOverThreshold = timeWaiting > alertThresholdHours * 3600;

  // Only show alert animation for comments awaiting approval (not approved or rejected)
  const isAwaitingApproval = !alreadyApproved && !alreadyRejected;

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
      <div className={styles.number}>{number ?? '—'}</div>
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
      <div className={styles.time}>
        {isAwaitingApproval ? (
          <>
            {getFormattedDate(timestamp)} (<span className={`${isOverThreshold ? styles.alert : ''}`}>{getFormattedTimeAgo(timestamp)}</span>)
          </>
        ) : (
          getFormattedDate(timestamp)
        )}
      </div>
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

// Counter item that uses useEditedComment to get real-time moderation status
// and reports its status via callback
interface ModQueueCountItemProps {
  comment: Comment;
  alertThresholdHours: number;
  onStatusChange: (cid: string, status: { awaiting: boolean; urgent: boolean }) => void;
}

const ModQueueCountItem = ({ comment, alertThresholdHours, onStatusChange }: ModQueueCountItemProps) => {
  const { editedComment } = useEditedComment({ comment });
  const displayComment = editedComment || comment;

  const { cid, approved, removed, timestamp } = displayComment;
  const isAwaiting = approved !== true && removed !== true;
  const timeWaiting = Date.now() / 1000 - timestamp;
  const isUrgent = isAwaiting && timeWaiting > alertThresholdHours * 3600;

  // Report status changes to parent - useEffect is appropriate here for syncing with parent state
  useEffect(() => {
    onStatusChange(cid, { awaiting: isAwaiting, urgent: isUrgent });
  }, [cid, isAwaiting, isUrgent, onStatusChange]);

  return null;
};

// Inner component that handles counting with useEditedComment for each item
interface ModQueueButtonContentProps {
  feed: Comment[];
  alertThresholdHours: number;
  boardIdentifier?: string;
  isMobile?: boolean;
}

const ModQueueButtonContent = ({ feed, alertThresholdHours, boardIdentifier, isMobile }: ModQueueButtonContentProps) => {
  const { t } = useTranslation();
  const [statusMap, setStatusMap] = useState<Map<string, { awaiting: boolean; urgent: boolean }>>(new Map());

  const handleStatusChange = React.useCallback((cid: string, status: { awaiting: boolean; urgent: boolean }) => {
    setStatusMap((prev) => {
      const next = new Map(prev);
      next.set(cid, status);
      return next;
    });
  }, []);

  // Calculate counts from status map
  const { normalCount, urgentCount } = useMemo(() => {
    let normal = 0;
    let urgent = 0;
    for (const { awaiting, urgent: isUrgent } of statusMap.values()) {
      if (awaiting) {
        if (isUrgent) urgent++;
        else normal++;
      }
    }
    return { normalCount: normal, urgentCount: urgent };
  }, [statusMap]);

  const totalCount = normalCount + urgentCount;
  const to = boardIdentifier ? `/${boardIdentifier}/queue` : '/mod/queue';

  const buttonContent = (
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

  return (
    <>
      {/* Render counter items to track real-time moderation status */}
      {feed.map((item) => (
        <ModQueueCountItem key={item.cid} comment={item} alertThresholdHours={alertThresholdHours} onStatusChange={handleStatusChange} />
      ))}
      {isMobile ? buttonContent : <>[{buttonContent}]</>}
    </>
  );
};

export const ModQueueButton = ({ boardIdentifier, isMobile }: ModQueueButtonProps) => {
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
    sortType: 'new',
  });

  if (!shouldFetch || subplebbitAddresses.length === 0) {
    return null;
  }

  return <ModQueueButtonContent feed={feed} alertThresholdHours={alertThresholdHours} boardIdentifier={boardIdentifier} isMobile={isMobile} />;
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

  // Synchronize blinking animation across all rows
  // Set a CSS variable with the current animation phase so all elements start from the same point
  // Update frequently to ensure elements rendered at different times stay synchronized
  useEffect(() => {
    const ANIMATION_DURATION = 2000; // 2 seconds
    const UPDATE_INTERVAL = 100; // Update every 100ms for smooth synchronization

    const updateAnimationPhase = () => {
      // Calculate current phase in the animation cycle (0 to 2 seconds)
      const phase = (Date.now() % ANIMATION_DURATION) / 1000;
      document.documentElement.style.setProperty('--mod-queue-blink-phase', `${phase}s`);
    };

    // Update immediately and then at regular intervals
    updateAnimationPhase();
    const interval = setInterval(updateAnimationPhase, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

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

      {feed.length === 0 && !hasMore ? (
        <div className={styles.empty}>{t('queue_is_empty')}</div>
      ) : (
        <>
          <div className={styles.tableHeader}>
            <div className={styles.numberHeader}>No.</div>
            {showBoardColumn && <div className={styles.boardHeader}>{t('board')}</div>}
            <div className={styles.excerptHeader}>{t('excerpt')}</div>
            <div className={styles.timeHeader}>{t('submitted')}</div>
            <div className={styles.actionsHeader}>{t('actions')}</div>
          </div>

          <Virtuoso
            useWindowScroll
            data={feed}
            totalCount={feed.length}
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
