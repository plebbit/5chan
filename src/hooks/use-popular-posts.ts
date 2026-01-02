import { useMemo, useRef } from 'react';
import { Subplebbit } from '@plebbit/plebbit-react-hooks';
import { getCommentMediaInfo, getHasThumbnail } from '../lib/utils/media-utils';

/**
 * Extracts popular posts from subplebbits.
 * Uses memoization to avoid recomputing when only updatingState changes.
 */
const usePopularPosts = (subplebbits: Subplebbit[]) => {
  // Track the previous CID list to detect actual content changes vs transient state changes
  const prevCidsRef = useRef<string>('');

  const { popularPosts, error } = useMemo(() => {
    try {
      const uniqueLinks: Set<string> = new Set();
      const allPosts: Comment[] = [];

      const postsPerSub = [0, 8, 4, 3, 2, 2, 2, 2, 1][Math.min(subplebbits.length, 8)];

      subplebbits.forEach((subplebbit: any) => {
        let subplebbitPosts: Comment[] = [];

        if (subplebbit?.posts?.pages?.hot?.comments) {
          for (const post of Object.values(subplebbit.posts.pages.hot.comments as Comment)) {
            const { deleted, link, linkHeight, linkWidth, locked, pinned, removed, replyCount, thumbnailUrl } = post;

            try {
              const commentMediaInfo = getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);
              const hasThumbnail = getHasThumbnail(commentMediaInfo, link);

              if (hasThumbnail && replyCount > 1 && !deleted && !removed && !locked && !pinned && !uniqueLinks.has(link)) {
                subplebbitPosts.push(post);
                uniqueLinks.add(link);
              }
            } catch (err) {
              console.error('Error processing post:', err);
            }
          }

          subplebbitPosts.sort((a: any, b: any) => b.timestamp - a.timestamp);
          allPosts.push(...subplebbitPosts.slice(0, postsPerSub));
        }
      });

      const sortedPosts = allPosts.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 8);

      return { popularPosts: sortedPosts, error: null };
    } catch (err) {
      console.error('Error in usePopularPosts:', err);
      return { popularPosts: [], error: 'Failed to fetch popular posts' };
    }
  }, [subplebbits]);

  // Create stable reference: only update if the CIDs actually change
  // This prevents unnecessary rerenders when only updatingState changes
  const currentCids = popularPosts.map((p: any) => p.cid).join(',');
  const stablePostsRef = useRef<Comment[]>(popularPosts);

  if (currentCids !== prevCidsRef.current) {
    prevCidsRef.current = currentCids;
    stablePostsRef.current = popularPosts;
  }

  const isLoading = stablePostsRef.current.length === 0;

  return { popularPosts: stablePostsRef.current, isLoading, error };
};

export default usePopularPosts;
