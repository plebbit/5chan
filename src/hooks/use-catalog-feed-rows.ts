import { useMemo } from 'react';
import { useAccountComments, Subplebbit } from '@plebbit/plebbit-react-hooks';
import useInterfaceSettingsStore from '../stores/use-interface-settings-store';
import { getCommentMediaInfo, getHasThumbnail } from '../lib/utils/media-utils';

const useCatalogFeedRows = (columnCount: number, feed: any, isFeedLoaded: boolean, subplebbit: Subplebbit) => {
  const { address } = subplebbit || {};
  const { hideThreadsWithoutImages } = useInterfaceSettingsStore();

  const { accountComments } = useAccountComments();

  const feedWithFakePostsOnTop = useMemo(() => {
    if (!isFeedLoaded) {
      return []; // prevent temporary/mock posts from appearing while the actual feed is loading
    }

    const _feed = [...feed];

    // show account comments instantly in the feed once published (cid defined), instead of waiting for the feed to update
    const filteredComments = accountComments.filter((comment) => {
      const { cid, deleted, link, postCid, removed, state, subplebbitAddress, timestamp, thumbnailUrl, linkWidth, linkHeight } = comment || {};
      const commentMediaInfo = getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);
      const isMediaShowed = getHasThumbnail(commentMediaInfo, link);

      return (
        !deleted &&
        !removed &&
        timestamp > Date.now() - 60 * 60 * 1000 &&
        state === 'succeeded' &&
        (!hideThreadsWithoutImages || (hideThreadsWithoutImages && isMediaShowed)) &&
        cid &&
        cid === postCid &&
        subplebbitAddress === address &&
        !_feed.some((feedItem) => feedItem.cid === cid)
      );
    });

    // show newest account comment at the top of the feed but after pinned posts
    const lastPinnedIndex = _feed.map((post) => post.pinned).lastIndexOf(true);
    if (filteredComments.length > 0) {
      _feed.splice(
        lastPinnedIndex + 1,
        0,
        ...filteredComments.map((comment) => ({
          ...comment,
          isAccountComment: true,
        })),
      );
    }

    return _feed;
  }, [accountComments, feed, address, isFeedLoaded, hideThreadsWithoutImages]);

  const rows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < feedWithFakePostsOnTop.length; i += columnCount) {
      rows.push(feedWithFakePostsOnTop.slice(i, i + columnCount));
    }
    return rows;
  }, [feedWithFakePostsOnTop, columnCount]);

  return rows;
};

export default useCatalogFeedRows;
