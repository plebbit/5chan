import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useFeedCacheStore, { CachedFeed } from '../../stores/use-feed-cache-store';
import { getFeedCacheKey, getFeedType, isFeedRoute } from '../../lib/utils/route-utils';
import Board from '../../views/board';
import Catalog from '../../views/catalog';
import styles from './feed-cache-container.module.css';

interface FeedContextFromKey {
  viewType: 'all' | 'subs' | 'mod' | 'board';
  boardIdentifier?: string;
  timeFilterName?: string;
}

const parseFeedKey = (key: string): FeedContextFromKey => {
  const segments = key.split('/').filter(Boolean);

  const filteredSegments = segments.filter((s) => s !== 'catalog');
  if (filteredSegments[0] === 'all') {
    return {
      viewType: 'all',
      timeFilterName: filteredSegments[1],
    };
  }
  if (filteredSegments[0] === 'subs') {
    return {
      viewType: 'subs',
      timeFilterName: filteredSegments[1],
    };
  }
  if (filteredSegments[0] === 'mod') {
    return {
      viewType: 'mod',
      timeFilterName: filteredSegments[1],
    };
  }

  return {
    viewType: 'board',
    boardIdentifier: filteredSegments[0],
    timeFilterName: filteredSegments[1],
  };
};

interface CachedFeedWrapperProps {
  feed: CachedFeed;
  isVisible: boolean;
}

const CachedFeedWrapper = ({ feed, isVisible }: CachedFeedWrapperProps) => {
  const context = parseFeedKey(feed.key);

  return (
    <div className={isVisible ? styles.visible : styles.hidden}>
      {feed.type === 'catalog' ? (
        <Catalog
          feedCacheKey={feed.key}
          viewType={context.viewType}
          boardIdentifier={context.boardIdentifier}
          timeFilterNameFromCache={context.timeFilterName}
          isVisible={isVisible}
        />
      ) : (
        <Board
          feedCacheKey={feed.key}
          viewType={context.viewType}
          boardIdentifier={context.boardIdentifier}
          timeFilterNameFromCache={context.timeFilterName}
          isVisible={isVisible}
        />
      )}
    </div>
  );
};

const FeedCacheContainer = () => {
  const location = useLocation();
  const { cachedFeeds, accessFeed } = useFeedCacheStore();

  const currentFeedKey = getFeedCacheKey(location.pathname);
  const isOnFeedRoute = isFeedRoute(location.pathname);
  const feedType = getFeedType(location.pathname);

  useEffect(() => {
    if (isOnFeedRoute && currentFeedKey && feedType) {
      accessFeed(currentFeedKey, feedType);
    }
  }, [currentFeedKey, isOnFeedRoute, feedType, accessFeed]);

  return (
    <>
      {cachedFeeds.map((feed) => (
        <CachedFeedWrapper key={feed.key} feed={feed} isVisible={isOnFeedRoute && feed.key === currentFeedKey} />
      ))}
    </>
  );
};

export default FeedCacheContainer;
