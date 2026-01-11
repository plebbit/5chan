import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useFeed, Comment, usePublishCommentModeration, useEditedComment } from '@plebbit/plebbit-react-hooks';
import useAccountsStore from '@plebbit/plebbit-react-hooks/dist/stores/accounts';
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
import Tooltip from '../../components/tooltip';

const { addChallenge } = useChallengesStore.getState();

interface ModQueueViewProps {
  boardIdentifier?: string; // If provided, shows queue for single board
}

interface ModQueueFooterProps {
  hasMore: boolean;
  subplebbitAddresses: string[];
}

// Defined outside ModQueueView to preserve component identity across renders (Virtuoso optimization)
// The useFeedStateString hook is called here instead of in ModQueueView to isolate re-renders
// caused by backend IPFS state changes to just this footer component
const ModQueueFooter = ({ hasMore, subplebbitAddresses }: ModQueueFooterProps) => {
  const { t } = useTranslation();
  const loadingStateString = useFeedStateString(subplebbitAddresses) || t('loading');

  return hasMore ? (
    <div style={{ padding: '10px', textAlign: 'center' }}>
      <LoadingEllipsis string={loadingStateString} />
    </div>
  ) : null;
};

interface ModQueueRowProps {
  comment: Comment;
  showBoardColumn?: boolean;
  isOdd?: boolean;
}

// Track which action was initiated to show appropriate completion message
type ModerationAction = 'approve' | 'reject' | null;

const ModQueueRow = ({ comment, showBoardColumn = false, isOdd = false }: ModQueueRowProps) => {
  const { t } = useTranslation();
  const { getAlertThresholdSeconds } = useModQueueStore();
  const [initiatedAction, setInitiatedAction] = useState<ModerationAction>(null);

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
  const alertThresholdSeconds = getAlertThresholdSeconds();
  const isOverThreshold = timeWaiting > alertThresholdSeconds;

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

  const rawExcerpt = title || content || (getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), link) ? t('image') : t('no_content'));
  const excerpt = rawExcerpt.length > 101 ? rawExcerpt.slice(0, 98) + '...' : rawExcerpt;
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
    <div className={`${styles.row} ${isOdd ? styles.rowOdd : ''}`}>
      <div className={styles.number}>{number ?? 'N/A'}</div>
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
        {isAwaitingApproval && isOverThreshold ? (
          <>
            <Tooltip children={<span>{getFormattedDate(timestamp)}</span>} content={getFormattedTimeAgo(timestamp)} /> (
            <span className={styles.alert}>{getFormattedTimeAgo(timestamp)}</span>)
          </>
        ) : (
          <Tooltip children={<span>{getFormattedDate(timestamp)}</span>} content={getFormattedTimeAgo(timestamp)} />
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

interface ModQueueCountItemProps {
  comment: Comment;
  alertThresholdSeconds: number;
  onStatusChange: (cid: string, status: { awaiting: boolean; urgent: boolean }) => void;
}

const ModQueueCountItem = ({ comment, alertThresholdSeconds, onStatusChange }: ModQueueCountItemProps) => {
  const { editedComment } = useEditedComment({ comment });
  const displayComment = editedComment || comment;

  const { cid, approved, removed, timestamp } = displayComment;
  const isAwaiting = approved !== true && removed !== true;
  const timeWaiting = Date.now() / 1000 - timestamp;
  const isUrgent = isAwaiting && timeWaiting > alertThresholdSeconds;

  useEffect(() => {
    onStatusChange(cid, { awaiting: isAwaiting, urgent: isUrgent });
  }, [cid, isAwaiting, isUrgent, onStatusChange]);

  return null;
};

interface ModQueueButtonContentProps {
  feed: Comment[];
  alertThresholdSeconds: number;
  boardIdentifier?: string;
  isMobile?: boolean;
}

const ModQueueButtonContent = ({ feed, alertThresholdSeconds, boardIdentifier, isMobile }: ModQueueButtonContentProps) => {
  const { t } = useTranslation();
  const [statusMap, setStatusMap] = useState<Map<string, { awaiting: boolean; urgent: boolean }>>(new Map());

  const handleStatusChange = React.useCallback((cid: string, status: { awaiting: boolean; urgent: boolean }) => {
    setStatusMap((prev) => {
      const next = new Map(prev);
      next.set(cid, status);
      return next;
    });
  }, []);

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
      {feed.map((item) => (
        <ModQueueCountItem key={item.cid} comment={item} alertThresholdSeconds={alertThresholdSeconds} onStatusChange={handleStatusChange} />
      ))}
      {isMobile ? buttonContent : <>[{buttonContent}]</>}
    </>
  );
};

export const ModQueueButton = ({ boardIdentifier, isMobile }: ModQueueButtonProps) => {
  const { getAlertThresholdSeconds } = useModQueueStore();

  const accountSubplebbitAddresses = useAccountsStore(
    (state) => {
      const activeAccountId = state.activeAccountId;
      const activeAccount = activeAccountId ? state.accounts[activeAccountId] : undefined;
      const accountSubplebbits = activeAccount?.subplebbits || {};
      return Object.keys(accountSubplebbits);
    },
    (prev, next) => {
      if (prev.length !== next.length) return false;
      return prev.every((val, idx) => val === next[idx]);
    },
  );

  const defaultSubplebbits = useDefaultSubplebbits();

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
    postsPerPage: 200, // Fetch more items to get accurate pending count for the badge
  });

  if (!shouldFetch || subplebbitAddresses.length === 0) {
    return null;
  }

  const alertThresholdSeconds = getAlertThresholdSeconds();
  // Use key to reset statusMap state when switching boards (prevents stale counts from previous board)
  const contentKey = subplebbitAddresses.join(',');
  return <ModQueueButtonContent key={contentKey} feed={feed} alertThresholdSeconds={alertThresholdSeconds} boardIdentifier={boardIdentifier} isMobile={isMobile} />;
};

export const ModQueueView = ({ boardIdentifier: propBoardIdentifier }: ModQueueViewProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const { selectedBoardFilter, alertThresholdValue, alertThresholdUnit, setAlertThreshold } = useModQueueStore();

  const accountSubplebbitAddresses = useAccountsStore(
    (state) => {
      const activeAccountId = state.activeAccountId;
      const activeAccount = activeAccountId ? state.accounts[activeAccountId] : undefined;
      const accountSubplebbits = activeAccount?.subplebbits || {};
      return Object.keys(accountSubplebbits);
    },
    (prev, next) => {
      if (prev.length !== next.length) return false;
      return prev.every((val, idx) => val === next[idx]);
    },
  );

  const defaultSubplebbits = useDefaultSubplebbits();

  const boardIdentifier = propBoardIdentifier || params.boardIdentifier;

  const resolvedAddress = useMemo(() => {
    if (boardIdentifier) {
      return getSubplebbitAddress(boardIdentifier, defaultSubplebbits);
    }
    return undefined;
  }, [boardIdentifier, defaultSubplebbits]);

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

  const showBoardColumn = !resolvedAddress && !selectedBoardFilter;

  // Memoize footer components object to preserve identity across renders (Virtuoso optimization)
  // Note: useFeedStateString is called inside ModQueueFooter to isolate re-renders from backend state changes
  const footerComponents = useMemo(
    () => ({
      Footer: () => <ModQueueFooter hasMore={hasMore} subplebbitAddresses={subplebbitAddresses} />,
    }),
    [hasMore, subplebbitAddresses],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{t('moderation_queue')}</div>
        <div className={styles.alertThresholdSetting}>
          <label>
            {t('alert_threshold')}:
            <input
              type='number'
              min='1'
              step={alertThresholdUnit === 'minutes' ? '1' : '1'}
              value={alertThresholdValue}
              onChange={(e) => setAlertThreshold(Number(e.target.value), alertThresholdUnit)}
              className={styles.alertThresholdInput}
            />
            <select
              value={alertThresholdUnit}
              onChange={(e) => {
                const newUnit = e.target.value as 'hours' | 'minutes';
                const newValue =
                  alertThresholdUnit === 'hours' && newUnit === 'minutes'
                    ? alertThresholdValue * 60
                    : alertThresholdUnit === 'minutes' && newUnit === 'hours'
                      ? Math.round(alertThresholdValue / 60)
                      : alertThresholdValue;
                setAlertThreshold(Math.max(1, newValue), newUnit);
              }}
              className={styles.alertThresholdUnitSelect}
            >
              <option value='minutes'>{t('minutes')}</option>
              <option value='hours'>{t('hours')}</option>
            </select>
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

          {/* Use Virtuoso for infinite scroll only when feed is large enough to warrant it */}
          {feed.length > 25 ? (
            <Virtuoso
              useWindowScroll
              data={feed}
              totalCount={feed.length}
              endReached={loadMore}
              increaseViewportBy={{ bottom: 1200, top: 1200 }}
              itemContent={(index, comment) => <ModQueueRow key={comment.cid} comment={comment} showBoardColumn={showBoardColumn} isOdd={index % 2 === 0} />}
              components={footerComponents}
            />
          ) : (
            <>
              {feed.map((comment, index) => (
                <ModQueueRow key={comment.cid} comment={comment} showBoardColumn={showBoardColumn} isOdd={index % 2 === 0} />
              ))}
              <ModQueueFooter hasMore={hasMore} subplebbitAddresses={subplebbitAddresses} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ModQueueView;
