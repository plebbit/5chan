import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType, useParams } from 'react-router-dom';
import { Comment, useAccount, useAccountComments, useAccountSubplebbits, useBlock, useFeed, useSubplebbit } from '@plebbit/plebbit-react-hooks';
import { useSubplebbitField } from '../../hooks/use-stable-subplebbit';
import { Virtuoso, VirtuosoHandle, StateSnapshot } from 'react-virtuoso';
import { Trans, useTranslation } from 'react-i18next';
import styles from './board.module.css';
import { shouldShowSnow } from '../../lib/snow';
import { getCommentMediaInfo, getHasThumbnail } from '../../lib/utils/media-utils';
import { useDefaultSubplebbitAddresses, useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { useFilteredDefaultSubplebbitAddresses } from '../../hooks/use-filtered-default-subplebbit-addresses';
import { useResolvedSubplebbitAddress, useBoardPath } from '../../hooks/use-resolved-subplebbit-address';
import { useFeedStateString } from '../../hooks/use-state-string';
import useTimeFilter, { timeFilterNameToSeconds } from '../../hooks/use-time-filter';
import useInterfaceSettingsStore from '../../stores/use-interface-settings-store';
import useFeedResetStore from '../../stores/use-feed-reset-store';
import useSortingStore from '../../stores/use-sorting-store';
import { getSubplebbitAddress, isDirectoryBoard } from '../../lib/utils/route-utils';
import ErrorDisplay from '../../components/error-display/error-display';
import LoadingEllipsis from '../../components/loading-ellipsis';
import { Post } from '../post';

const lastVirtuosoStates: { [key: string]: StateSnapshot } = {};

const createThreadsWithoutImagesFilter = () => ({
  filter: (comment: Comment) => {
    const { link, linkHeight, linkWidth, thumbnailUrl } = comment || {};
    if (!getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), link)) {
      return false;
    }
    return true;
  },
  key: 'threads-with-images-only',
});

export interface BoardProps {
  feedCacheKey?: string;
  viewType?: 'all' | 'subs' | 'mod' | 'board';
  boardIdentifier?: string;
  timeFilterNameFromCache?: string;
  isVisible?: boolean;
}

const Board = ({ feedCacheKey, viewType, boardIdentifier: boardIdentifierProp, timeFilterNameFromCache, isVisible = true }: BoardProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { hideThreadsWithoutImages } = useInterfaceSettingsStore();

  const isInAllView = viewType ? viewType === 'all' : false;
  const isInSubscriptionsView = viewType ? viewType === 'subs' : false;
  const isInModView = viewType ? viewType === 'mod' : false;

  const defaultSubplebbits = useDefaultSubplebbits();
  const resolvedAddressFromUrl = useResolvedSubplebbitAddress();
  const subplebbitAddress = useMemo(() => {
    if (boardIdentifierProp) {
      return getSubplebbitAddress(boardIdentifierProp, defaultSubplebbits);
    }
    return resolvedAddressFromUrl;
  }, [boardIdentifierProp, defaultSubplebbits, resolvedAddressFromUrl]);

  const boardPath = useBoardPath(subplebbitAddress);
  const defaultSubplebbitAddresses = useDefaultSubplebbitAddresses();
  const filteredDefaultSubplebbitAddresses = useFilteredDefaultSubplebbitAddresses();

  const account = useAccount();
  const subscriptions = account?.subscriptions;

  const { accountSubplebbits } = useAccountSubplebbits();
  const accountSubplebbitAddresses = Object.keys(accountSubplebbits);

  const subplebbitAddresses = useMemo(() => {
    if (isInAllView) {
      return filteredDefaultSubplebbitAddresses;
    }
    if (isInSubscriptionsView) {
      return subscriptions || [];
    }
    if (isInModView) {
      return accountSubplebbitAddresses;
    }
    return [subplebbitAddress];
  }, [
    isInAllView,
    isInSubscriptionsView,
    isInModView,
    subplebbitAddress,
    defaultSubplebbitAddresses,
    filteredDefaultSubplebbitAddresses,
    subscriptions,
    accountSubplebbitAddresses,
  ]);

  const { sortType } = useSortingStore();
  const { timeFilterSeconds: timeFilterSecondsFromHook, timeFilterName: timeFilterNameFromHook } = useTimeFilter();
  const timeFilterName = timeFilterNameFromCache || timeFilterNameFromHook;
  const timeFilterSeconds = timeFilterNameFromCache ? timeFilterNameToSeconds(timeFilterNameFromCache) : timeFilterSecondsFromHook;

  const feedOptions = {
    subplebbitAddresses,
    sortType,
    postsPerPage: isInAllView || isInSubscriptionsView || isInModView ? 5 : 25,
    ...(isInAllView || isInSubscriptionsView || isInModView ? { newerThan: timeFilterSeconds } : {}),
    filter: hideThreadsWithoutImages ? createThreadsWithoutImagesFilter() : undefined,
  };

  const { feed, hasMore, loadMore, reset, subplebbitAddressesWithNewerPosts } = useFeed(feedOptions);
  const { accountComments } = useAccountComments();

  const resetTriggeredRef = useRef(false);

  const setResetFunction = useFeedResetStore((state) => state.setResetFunction);
  useEffect(() => {
    if (isVisible) {
      setResetFunction(reset);
    }
  }, [reset, setResetFunction, feed, isVisible]);

  // show account comments instantly in the feed once published (cid defined), instead of waiting for the feed to update
  const filteredComments = useMemo(
    () =>
      accountComments.filter((comment) => {
        const { cid, deleted, link, linkHeight, linkWidth, postCid, removed, state, thumbnailUrl, timestamp } = comment || {};
        return (
          !deleted &&
          !removed &&
          timestamp > Date.now() / 1000 - 60 * 60 &&
          state === 'succeeded' &&
          cid &&
          (hideThreadsWithoutImages ? getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), comment?.link) : true) &&
          cid === postCid &&
          comment?.subplebbitAddress === subplebbitAddress &&
          !feed.some((post) => post.cid === cid)
        );
      }),
    [accountComments, subplebbitAddress, feed, hideThreadsWithoutImages],
  );

  // show newest account comment at the top of the feed but after pinned posts
  const combinedFeed = useMemo(() => {
    const newFeed = [...feed];
    const lastPinnedIndex = newFeed.map((post) => post.pinned).lastIndexOf(true);
    if (filteredComments.length > 0) {
      newFeed.splice(lastPinnedIndex + 1, 0, ...filteredComments);
    }
    return newFeed;
  }, [feed, filteredComments]);

  useEffect(() => {
    if (filteredComments.length > 0 && !resetTriggeredRef.current) {
      reset();
      resetTriggeredRef.current = true;
    }
  }, [filteredComments, reset]);

  // Use stable subplebbit fields to avoid rerenders from updatingState
  const subplebbitTitle = useSubplebbitField(subplebbitAddress, (sub) => sub?.title);
  const shortAddress = useSubplebbitField(subplebbitAddress, (sub) => sub?.shortAddress);
  // useSubplebbitField only reads from store, doesn't trigger fetching
  const subplebbit = useSubplebbit({ subplebbitAddress });
  const { error: subplebbitError, state: subplebbitState } = subplebbit || {};
  const title = isInAllView ? t('all') : isInSubscriptionsView ? t('subscriptions') : isInModView ? t('mod') : subplebbitTitle;

  const { blocked, unblock } = useBlock({ address: subplebbitAddress });

  const handleNewerPostsButtonClick = () => {
    window.scrollTo({ top: 0, left: 0 });
    setTimeout(() => {
      reset();
    }, 300);
  };

  // suggest the user to change time filter if there aren't enough posts
  const { feed: weeklyFeed } = useFeed({
    subplebbitAddresses,
    sortType,
    newerThan: 60 * 60 * 24 * 7,
    filter: hideThreadsWithoutImages ? createThreadsWithoutImagesFilter() : undefined,
  });
  const { feed: monthlyFeed } = useFeed({
    subplebbitAddresses,
    sortType,
    newerThan: 60 * 60 * 24 * 30,
    filter: hideThreadsWithoutImages ? createThreadsWithoutImagesFilter() : undefined,
  });
  const { feed: yearlyFeed } = useFeed({
    subplebbitAddresses,
    sortType,
    newerThan: 60 * 60 * 24 * 365,
    filter: hideThreadsWithoutImages ? createThreadsWithoutImagesFilter() : undefined,
  });

  const feedLength = feed.length;
  const weeklyFeedLength = weeklyFeed.length;
  const monthlyFeedLength = monthlyFeed.length;
  const yearlyFeedLength = yearlyFeed.length;
  const hasFeedLoaded = !!feed;
  const loadingStateString =
    useFeedStateString(subplebbitAddresses) ||
    (!hasFeedLoaded || (feedLength === 0 && !(weeklyFeedLength > feedLength || monthlyFeedLength > feedLength || yearlyFeedLength > monthlyFeedLength))
      ? t('loading_feed')
      : t('looking_for_more_posts'));

  const [showMorePostsSuggestion, setShowMorePostsSuggestion] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMorePostsSuggestion(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const currentTimeFilterName = timeFilterName || params?.timeFilterName;

  const Footer = () => {
    let footerContent;
    if (combinedFeed.length === 0) {
      footerContent = t('no_threads');
    }
    if (hasMore || (subplebbitAddresses && subplebbitAddresses.length === 0)) {
      footerContent = (
        <>
          {subplebbitAddressesWithNewerPosts.length > 0 ? (
            <div className={styles.morePostsSuggestion}>
              <Trans
                i18nKey='newer_threads_available'
                components={{
                  1: <span className={styles.newerPostsButton} onClick={handleNewerPostsButtonClick} />,
                }}
              />
            </div>
          ) : (
            (isInAllView || isInSubscriptionsView || isInModView) &&
            showMorePostsSuggestion &&
            (monthlyFeed.length > feed.length || yearlyFeed.length > monthlyFeed.length) &&
            (() => {
              const basePath = isInAllView ? '/all' : isInSubscriptionsView ? '/subs' : isInModView ? '/mod' : boardPath ? `/${boardPath}` : '';
              return weeklyFeed.length > feed.length ? (
                <div className={styles.morePostsSuggestion}>
                  <Trans
                    i18nKey='more_threads_last_week'
                    values={{ currentTimeFilterName, count: feed.length }}
                    components={{
                      1: <Link to={`${basePath}/1w`} />,
                    }}
                  />
                </div>
              ) : monthlyFeed.length > feed.length ? (
                <div className={styles.morePostsSuggestion}>
                  <Trans
                    i18nKey='more_threads_last_month'
                    values={{ currentTimeFilterName, count: feed.length }}
                    components={{
                      1: <Link to={`${basePath}/1m`} />,
                    }}
                  />
                </div>
              ) : (
                <div className={styles.morePostsSuggestion}>
                  <Trans
                    i18nKey='more_threads_last_year'
                    values={{ currentTimeFilterName, count: feed.length }}
                    components={{
                      1: <Link to={`${basePath}/1y`} />,
                    }}
                  />
                </div>
              );
            })()
          )}
        </>
      );
    }
    return (
      <div className={styles.footer}>
        {footerContent}
        <div>
          {subplebbitState === 'failed' ? (
            <span className='red'>{subplebbitState}</span>
          ) : isInSubscriptionsView && subscriptions?.length === 0 ? (
            <span className='red'>{t('not_subscribed_to_any_board')}</span>
          ) : isInModView && accountSubplebbitAddresses?.length === 0 ? (
            <span className='red'>{t('not_mod_of_any_board')}</span>
          ) : blocked ? (
            <span className='red'>{t('you_have_blocked_this_board')}</span>
          ) : (
            hasMore && <LoadingEllipsis string={loadingStateString} />
          )}
          {blocked && (
            <>
              &nbsp;&nbsp;[
              <span
                className={styles.button}
                onClick={() => {
                  unblock();
                  reset();
                }}
              >
                {t('unblock')}
              </span>
              ]
            </>
          )}
        </div>
      </div>
    );
  };

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const virtuosoStateKey = feedCacheKey ? `${feedCacheKey}-${sortType}-${timeFilterSeconds}` : `${location.pathname}-${sortType}-${timeFilterSeconds}`;
  const navigationType = useNavigationType();

  const hasBeenVisibleRef = useRef(false);
  useEffect(() => {
    if (isVisible && !hasBeenVisibleRef.current) {
      hasBeenVisibleRef.current = true;
      if (navigationType !== 'POP') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }
  }, [isVisible, navigationType]);

  useEffect(() => {
    if (!isVisible) return;

    const currentKey = virtuosoStateKey;
    const setLastVirtuosoState = () => {
      virtuosoRef.current?.getState((snapshot: StateSnapshot) => {
        if (snapshot?.ranges?.length) {
          lastVirtuosoStates[currentKey] = snapshot;
        }
      });
    };
    window.addEventListener('scroll', setLastVirtuosoState);
    return () => window.removeEventListener('scroll', setLastVirtuosoState);
  }, [virtuosoStateKey, isVisible]);

  const lastVirtuosoState = navigationType === 'POP' ? lastVirtuosoStates?.[virtuosoStateKey] : undefined;

  useEffect(() => {
    if (!isVisible) return;
    const boardIdentifier = params.boardIdentifier || boardIdentifierProp;
    const isDirectory = boardIdentifier ? isDirectoryBoard(boardIdentifier, defaultSubplebbits) : false;

    let boardTitle: string;
    if (isInAllView) {
      boardTitle = t('all');
    } else if (isInSubscriptionsView) {
      boardTitle = t('subscriptions');
    } else if (isInModView) {
      boardTitle = t('mod');
    } else if (isDirectory) {
      boardTitle = `/${boardIdentifier}/`;
    } else {
      boardTitle = title ? title : shortAddress || subplebbitAddress || '';
    }
    document.title = boardTitle + ' - 5chan';
  }, [
    title,
    shortAddress,
    subplebbitAddress,
    isVisible,
    params.boardIdentifier,
    boardIdentifierProp,
    defaultSubplebbits,
    isInAllView,
    isInSubscriptionsView,
    isInModView,
    t,
  ]);

  const shouldShowErrorToUser = subplebbitError?.message && feed.length === 0;

  return (
    <>
      {shouldShowSnow() && <hr />}
      <div className={`${styles.content} ${shouldShowSnow() ? styles.garland : ''}`}>
        {shouldShowErrorToUser && (
          <div className={styles.error}>
            <ErrorDisplay error={subplebbitError} />
          </div>
        )}
        <Virtuoso
          increaseViewportBy={{ bottom: 1200, top: 1200 }}
          totalCount={combinedFeed.length}
          data={combinedFeed}
          itemContent={(index, post) => <Post index={index} post={post} />}
          useWindowScroll={true}
          components={{ Footer }}
          endReached={loadMore}
          ref={virtuosoRef}
          restoreStateFrom={lastVirtuosoState}
          initialScrollTop={lastVirtuosoState?.scrollTop}
        />
      </div>
    </>
  );
};

export default Board;
