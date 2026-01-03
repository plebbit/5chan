import { useMemo, useRef } from 'react';
import { Comment, Subplebbit } from '@plebbit/plebbit-react-hooks';
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

  // Create stable reference: only update if the post content actually changes
  // Build a key from relevant mutable fields, not just CIDs
  const currentKey = popularPosts.map((p) => `${p.cid}:${p.replyCount}:${p.timestamp}:${p.locked}:${p.pinned}`).join(',');
  const stablePostsRef = useRef<Comment[]>(popularPosts);

  if (currentKey !== prevCidsRef.current) {
    prevCidsRef.current = currentKey;
    stablePostsRef.current = popularPosts;
  }

  // Derive loading state from subplebbit states rather than post count
  // A subplebbit is still loading if it has no posts pages yet and isn't in a terminal state
  const hasLoadedData = subplebbits.some((sub) => sub?.posts?.pages?.hot?.comments);
  const isLoading = subplebbits.length > 0 && !hasLoadedData;

  return { popularPosts: stablePostsRef.current, isLoading, error };
};

export default usePopularPosts;
