import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Comment, useAccount, useFeed, useSubplebbit, useBlock, useAccountComments } from '@plebbit/plebbit-react-hooks';
import { Virtuoso, VirtuosoHandle, StateSnapshot } from 'react-virtuoso';
import { getCommentMediaInfo, getHasThumbnail } from '../../lib/utils/media-utils';
import { isAllView, isSubscriptionsView } from '../../lib/utils/view-utils';
import useCatalogFeedRows from '../../hooks/use-catalog-feed-rows';
import { useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { useResolvedSubplebbitAddress, useBoardPath } from '../../hooks/use-resolved-subplebbit-address';
import { useFeedStateString } from '../../hooks/use-state-string';
import useTimeFilter from '../../hooks/use-time-filter';
import useWindowWidth from '../../hooks/use-window-width';
import useCatalogStyleStore from '../../stores/use-catalog-style-store';
import useFeedResetStore from '../../stores/use-feed-reset-store';
import useInterfaceSettingsStore from '../../stores/use-interface-settings-store';
import useSortingStore from '../../stores/use-sorting-store';
import useCatalogFiltersStore from '../../stores/use-catalog-filters-store';
import CatalogRow from '../../components/catalog-row';
import LoadingEllipsis from '../../components/loading-ellipsis';
import styles from './catalog.module.css';
import { commentMatchesPattern } from '../../lib/utils/pattern-utils';

const lastVirtuosoStates: { [key: string]: StateSnapshot } = {};

const createContentFilter = (
  filterItems: { text: string; enabled: boolean; count: number; filteredCids: Set<string>; hide: boolean; top: boolean; color?: string }[],
  subplebbitAddress: string,
  onFilterMatch?: (filterIndex: number, cid: string, subplebbitAddress: string) => void,
) => {
  // Create a unique key based on the enabled filter items
  const enabledFilters = filterItems.filter((item) => item.enabled && item.text.trim() !== '');
  const filterKey =
    enabledFilters.length > 0
      ? `content-filter-${enabledFilters.map((item) => `${item.text}-${item.hide ? 'hide' : ''}-${item.top ? 'top' : ''}`).join('-')}`
      : 'no-content-filter';

  return {
    filter: (comment: Comment) => {
      if (!comment?.cid) return true;

      if (enabledFilters.length === 0) return true;

      // Check if any enabled filter matches the content
      for (let i = 0; i < enabledFilters.length; i++) {
        const item = enabledFilters[i];
        const pattern = item.text;

        if (commentMatchesPattern(comment, pattern)) {
          // Find the original filter index to increment count
          const filterIndex = filterItems.findIndex((f) => f.text === item.text && f.enabled);
          if (filterIndex !== -1) {
            if (onFilterMatch) {
              onFilterMatch(filterIndex, comment.cid, subplebbitAddress);
            } else {
              // Fallback to the store method if no callback provided
              useCatalogFiltersStore.getState().incrementFilterCount(filterIndex, comment.cid, subplebbitAddress);
            }

            // If the filter has a color, track it in the matchedFilters map
            if (item.color) {
              useCatalogFiltersStore.getState().setMatchedFilter(comment.cid, item.color);
            }
          }

          // If this filter is set to hide, filter out the comment
          if (item.hide) {
            return false;
          }

          // If this filter is set to top, we'll handle it separately in the component
          // (we don't filter it out here)
        }
      }

      return true;
    },
    key: filterKey,
  };
};

const createImageFilter = (showTextOnlyThreads: boolean) => {
  return {
    filter: (comment: Comment) => {
      if (showTextOnlyThreads) return true;

      const { link, linkHeight, linkWidth, thumbnailUrl } = comment || {};
      const hasThumbnail = getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), link);

      return hasThumbnail;
    },
    key: showTextOnlyThreads ? 'no-image-filter' : 'threads-with-images-only',
  };
};

const createCombinedFilter = (
  showTextOnlyThreads: boolean,
  filterItems: { text: string; enabled: boolean; count: number; filteredCids: Set<string>; hide: boolean; top: boolean; color?: string }[],
  searchText: string,
  subplebbitAddress: string,
  onFilterMatch?: (filterIndex: number, cid: string, subplebbitAddress: string) => void,
) => {
  const imageFilter = createImageFilter(showTextOnlyThreads);
  const contentFilter = createContentFilter(filterItems, subplebbitAddress, onFilterMatch);

  const searchFilter = {
    filter: (comment: Comment) => {
      if (!searchText.trim()) return true;
      return commentMatchesPattern(comment, searchText);
    },
    key: searchText ? `search-filter-${searchText}` : 'no-search-filter',
  };

  return {
    filter: (comment: Comment) => {
      if (!imageFilter.filter(comment)) return false;
      if (!contentFilter.filter(comment)) return false;
      if (!searchFilter.filter(comment)) return false;

      return true;
    },
    key: `${imageFilter.key}-${contentFilter.key}-${searchFilter.key}`,
  };
};

const Catalog = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const subplebbitAddress = useResolvedSubplebbitAddress();
  const boardPath = useBoardPath(subplebbitAddress);

  const isInAllView = isAllView(location.pathname);
  const defaultSubplebbits = useDefaultSubplebbits();
  const { hideAdultBoards } = useInterfaceSettingsStore();
  const { showTextOnlyThreads, filterItems, searchText, clearMatchedFilters } = useCatalogFiltersStore();

  const account = useAccount();
  const subscriptions = account?.subscriptions;
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());

  const subplebbitAddresses = useMemo(() => {
    const filteredDefaultSubplebbits = defaultSubplebbits
      .filter((subplebbit) => {
        // Hide NSFW boards if hideAdultBoards is enabled (treating NSFW as adult content)
        if (subplebbit.nsfw && hideAdultBoards) {
          return false;
        }
        return true;
      })
      .map((subplebbit) => subplebbit.address)
      .filter(Boolean); // Filter out any undefined/null values

    if (isInAllView) {
      return filteredDefaultSubplebbits;
    }
    if (isInSubscriptionsView) {
      return (subscriptions || []).filter(Boolean); // Filter out any undefined/null values
    }
    // Only include subplebbitAddress if it's defined
    return subplebbitAddress ? [subplebbitAddress] : [];
  }, [isInAllView, isInSubscriptionsView, subplebbitAddress, defaultSubplebbits, subscriptions, hideAdultBoards]);

  const { imageSize } = useCatalogStyleStore();
  const columnWidth = imageSize === 'Large' ? 270 : 180;

  const columnCount = Math.floor(useWindowWidth() / columnWidth);
  const postsPerPage = columnCount <= 2 ? 10 : columnCount === 3 ? 15 : columnCount === 4 ? 20 : 25;

  const { timeFilterSeconds, timeFilterName } = useTimeFilter();
  const { sortType } = useSortingStore();

  // Create a stable callback for filter matching
  const handleFilterMatch = useCallback((filterIndex: number, cid: string, subplebbitAddress: string) => {
    useCatalogFiltersStore.getState().incrementFilterCount(filterIndex, cid, subplebbitAddress);
  }, []);

  // Set the current subplebbit address
  useEffect(() => {
    useCatalogFiltersStore.getState().setCurrentSubplebbitAddress(subplebbitAddress || null);
    return () => {
      useCatalogFiltersStore.getState().setCurrentSubplebbitAddress(null);
    };
  }, [subplebbitAddress]);

  const feedOptions = useMemo(() => {
    const options: any = {
      subplebbitAddresses,
      sortType,
      postsPerPage: isInAllView || isInSubscriptionsView ? 10 : postsPerPage,
      filter: createCombinedFilter(showTextOnlyThreads, filterItems, searchText, subplebbitAddress || 'all', handleFilterMatch),
    };

    if (isInAllView || isInSubscriptionsView) {
      options.newerThan = timeFilterSeconds;
    }

    return options;
  }, [
    subplebbitAddresses,
    sortType,
    isInAllView,
    isInSubscriptionsView,
    postsPerPage,
    timeFilterSeconds,
    showTextOnlyThreads,
    filterItems,
    searchText,
    subplebbitAddress,
    handleFilterMatch,
  ]);

  const { feed, hasMore, loadMore, reset, subplebbitAddressesWithNewerPosts } = useFeed(feedOptions);
  const { accountComments } = useAccountComments();

  const resetTriggeredRef = useRef(false);

  // show account comments instantly in the feed once published (cid defined), instead of waiting for the feed to update
  const filteredComments = useMemo(
    () =>
      accountComments.filter((comment) => {
        const { cid, deleted, link, linkHeight, linkWidth, postCid, removed, state, thumbnailUrl, timestamp } = comment || {};

        // Basic filtering conditions
        const basicConditions =
          !deleted &&
          !removed &&
          timestamp > Date.now() / 1000 - 60 * 60 &&
          state === 'succeeded' &&
          cid &&
          (showTextOnlyThreads ? getHasThumbnail(getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight), comment?.link) : true) &&
          cid === postCid &&
          comment?.subplebbitAddress === subplebbitAddress &&
          !feed.some((post) => post.cid === cid);

        // If search is active, also check search conditions
        if (basicConditions && searchText.trim()) {
          const titleLower = comment?.title?.toLowerCase() || '';
          const contentLower = comment?.content?.toLowerCase() || '';
          const searchPattern = searchText.toLowerCase();

          return titleLower.includes(searchPattern) || contentLower.includes(searchPattern);
        }

        return basicConditions;
      }),
    [accountComments, subplebbitAddress, feed, showTextOnlyThreads, searchText],
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
    filter: createCombinedFilter(showTextOnlyThreads, filterItems, searchText, subplebbitAddress || 'all', handleFilterMatch),
  });

  const { feed: monthlyFeed } = useFeed({
    subplebbitAddresses,
    sortType,
    newerThan: 60 * 60 * 24 * 30,
    filter: createCombinedFilter(showTextOnlyThreads, filterItems, searchText, subplebbitAddress || 'all', handleFilterMatch),
  });

  const { feed: yearlyFeed } = useFeed({
    subplebbitAddresses,
    sortType,
    newerThan: 60 * 60 * 24 * 365,
    filter: createCombinedFilter(showTextOnlyThreads, filterItems, searchText, subplebbitAddress || 'all', handleFilterMatch),
  });

  const [showMorePostsSuggestion, setShowMorePostsSuggestion] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMorePostsSuggestion(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const setResetFunction = useFeedResetStore((state) => state.setResetFunction);
  useEffect(() => {
    setResetFunction(reset);
  }, [reset, setResetFunction]);

  const subplebbit = useSubplebbit({ subplebbitAddress });
  const { error, shortAddress, state, title } = subplebbit || {};
  const { blocked, unblock } = useBlock({ address: subplebbitAddress });

  const feedLength = feed.length;
  const weeklyFeedLength = weeklyFeed.length;
  const monthlyFeedLength = monthlyFeed.length;
  const yearlyFeedLength = yearlyFeed.length;
  const hasFeedLoaded = !!feed;
  const loadingStateString =
    useFeedStateString(subplebbitAddresses) ||
    !hasFeedLoaded ||
    (feedLength === 0 && !(weeklyFeedLength > feedLength || monthlyFeedLength > feedLength || yearlyFeedLength > monthlyFeedLength))
      ? t('loading_feed')
      : t('looking_for_more_posts');

  const loadingString = (
    <div className={styles.stateString}>
      {state === 'failed' ? (
        <span className='red'>{state}</span>
      ) : isInSubscriptionsView && subscriptions?.length === 0 ? (
        t('not_subscribed_to_any_board')
      ) : blocked ? (
        t('you_have_blocked_this_board')
      ) : !hasMore && combinedFeed.length === 0 ? (
        t('no_threads')
      ) : (
        hasMore && <LoadingEllipsis string={loadingStateString} />
      )}
      {error && (
        <div className='red'>
          <br />
          {error.message}
        </div>
      )}
    </div>
  );

  const params = useParams<{ sortType?: string; timeFilterName?: string }>();
  const currentTimeFilterName = params?.timeFilterName || timeFilterName;

  const Footer = () => {
    let footerContent;
    if (feed.length === 0) {
      if (blocked) {
        footerContent = t('you_have_blocked_this_board');
      } else if (combinedFeed.length === 0) {
        footerContent = t('no_threads');
      }
    }
    if (hasMore || (subplebbitAddresses && subplebbitAddresses.length === 0)) {
      footerContent = (
        <>
          {subplebbitAddressesWithNewerPosts.length > 0 ? (
            <div className={styles.stateString}>
              <Trans
                i18nKey='newer_threads_available'
                components={{
                  1: <span className={styles.newerPostsButton} onClick={handleNewerPostsButtonClick} />,
                }}
              />
            </div>
          ) : (
            (isInAllView || isInSubscriptionsView) &&
            showMorePostsSuggestion &&
            (monthlyFeed.length > feed.length || yearlyFeed.length > monthlyFeed.length) &&
            (weeklyFeed.length > feed.length ? (
              <div className={styles.stateString}>
                <Trans
                  i18nKey='more_threads_last_week'
                  values={{ currentTimeFilterName, count: feed.length }}
                  components={{
                    1: <Link to={(isInAllView ? '/all/catalog' : isInSubscriptionsView ? '/subs/catalog' : `/${boardPath}/catalog`) + '/1w'} />,
                  }}
                />
              </div>
            ) : monthlyFeed.length > feed.length ? (
              <div className={styles.stateString}>
                <Trans
                  i18nKey='more_threads_last_month'
                  values={{ currentTimeFilterName, count: feed.length }}
                  components={{
                    1: <Link to={(isInAllView ? '/all/catalog' : isInSubscriptionsView ? '/subs/catalog' : `/${boardPath}/catalog`) + '/1m'} />,
                  }}
                />
              </div>
            ) : (
              <div className={styles.stateString}>
                <Trans
                  i18nKey='more_threads_last_year'
                  values={{ currentTimeFilterName, count: feed.length }}
                  components={{
                    1: <Link to={(isInAllView ? '/all/catalog' : isInSubscriptionsView ? '/subs/catalog' : `/${boardPath}/catalog`) + '/1y'} />,
                  }}
                />
              </div>
            ))
          )}
          <div className={styles.stateString}>
            <LoadingEllipsis string={loadingStateString} />
          </div>
        </>
      );
    }
    return <div className={styles.footer}>{footerContent}</div>;
  };

  const isFeedLoaded = feed.length > 0 || state === 'failed';

  // Process the feed to move "top" posts to the top
  const processedFeed = useMemo(() => {
    if (!combinedFeed || combinedFeed.length === 0) return combinedFeed;

    const enabledTopFilters = filterItems.filter((item) => item.enabled && item.text.trim() !== '' && item.top);
    if (enabledTopFilters.length === 0) return combinedFeed;

    // Separate posts that match "top" filters
    const topPosts: Comment[] = [];
    const regularPosts: Comment[] = [];

    combinedFeed.forEach((comment) => {
      if (!comment) return;

      let isTop = false;
      for (const filter of enabledTopFilters) {
        if (commentMatchesPattern(comment, filter.text)) {
          isTop = true;
          break;
        }
      }

      if (isTop) {
        topPosts.push(comment);
      } else {
        regularPosts.push(comment);
      }
    });

    // Return top posts followed by regular posts
    return [...topPosts, ...regularPosts];
  }, [combinedFeed, filterItems]);

  const rows = useCatalogFeedRows(columnCount, processedFeed, isFeedLoaded, subplebbit);

  // save the last Virtuoso state to restore it when navigating back
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  useEffect(() => {
    const setLastVirtuosoState = () =>
      virtuosoRef.current?.getState((snapshot: StateSnapshot) => {
        if (snapshot?.ranges?.length) {
          lastVirtuosoStates[sortType + timeFilterSeconds + 'catalog'] = snapshot;
        }
      });
    window.addEventListener('scroll', setLastVirtuosoState);
    return () => window.removeEventListener('scroll', setLastVirtuosoState);
  }, [sortType, timeFilterSeconds]);

  const lastVirtuosoState = lastVirtuosoStates?.[sortType + timeFilterSeconds + 'catalog'];

  useEffect(() => {
    let documentTitle = title ? title : shortAddress;
    if (isInAllView) documentTitle = t('all');
    else if (isInSubscriptionsView) documentTitle = t('subscriptions');
    document.title = documentTitle + ` - ${t('catalog')} - 5chan`;
  }, [title, shortAddress, isInAllView, isInSubscriptionsView, t]);

  // Clear matched filters when component mounts or when subplebbit changes
  useEffect(() => {
    clearMatchedFilters();
    return () => {
      clearMatchedFilters();
    };
  }, [clearMatchedFilters, subplebbitAddress]);

  // Memoize filter color application to avoid redundant iterations
  useMemo(() => {
    if (combinedFeed.length > 0 && filterItems.length > 0) {
      // Clear existing matched filters
      clearMatchedFilters();

      // Apply colors to posts that match filters
      combinedFeed.forEach((comment) => {
        if (!comment?.cid) return;

        // Check each filter
        for (const item of filterItems) {
          if (item.enabled && item.text.trim() !== '' && item.color) {
            if (commentMatchesPattern(comment, item.text)) {
              useCatalogFiltersStore.getState().setMatchedFilter(comment.cid, item.color);
              break; // Use the first matching filter's color
            }
          }
        }
      });
    }
  }, [combinedFeed, filterItems, clearMatchedFilters]);

  return (
    <div className={styles.content}>
      <hr />
      <div className={styles.catalog}>
        {processedFeed?.length !== 0 ? (
          <>
            <Virtuoso
              increaseViewportBy={{ bottom: 1200, top: 1200 }}
              totalCount={rows?.length || 0}
              data={rows}
              itemContent={(index, row) => <CatalogRow index={index} row={row} />}
              useWindowScroll={true}
              components={{ Footer }}
              endReached={loadMore}
              ref={virtuosoRef}
              restoreStateFrom={lastVirtuosoState}
              initialScrollTop={lastVirtuosoState?.scrollTop}
            />
          </>
        ) : (
          <div className={styles.footer}>
            {loadingString}
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
        )}
      </div>
    </div>
  );
};

export default Catalog;
