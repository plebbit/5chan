import { useEffect, useState } from 'react';
import { Subplebbit } from '@plebbit/plebbit-react-hooks';
import { getCommentMediaInfo, getHasThumbnail } from '../lib/utils/media-utils';

const usePopularPosts = (subplebbits: Subplebbit[]) => {
  const [popularPosts, setPopularPosts] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularPosts = () => {
      try {
        setIsLoading(true);
        setError(null);
        const uniqueLinks: Set<string> = new Set();
        const allPosts: Comment[] = [];

        const postsPerSub = [0, 8, 4, 3, 2, 2, 2, 2, 1][Math.min(subplebbits.length, 8)];

        subplebbits.forEach((subplebbit: any) => {
          let subplebbitPosts: Comment[] = [];

          if (subplebbit?.posts?.pages?.hot?.comments) {
            for (const post of Object.values(subplebbit.posts.pages.hot.comments as Comment)) {
              const {
                deleted,
                link,
                linkHeight,
                linkWidth,
                locked,
                pinned,
                removed,
                replyCount,
                thumbnailUrl,
                // timestamp
              } = post;

              try {
                const commentMediaInfo = getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);
                const hasThumbnail = getHasThumbnail(commentMediaInfo, link);

                if (
                  hasThumbnail &&
                  replyCount > 1 &&
                  !deleted &&
                  !removed &&
                  !locked &&
                  !pinned &&
                  // timestamp > Date.now() / 1000 - 60 * 60 * 24 * 30 &&
                  !uniqueLinks.has(link)
                ) {
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

        setPopularPosts(sortedPosts);
      } catch (err) {
        console.error('Error in usePopularPosts:', err);
        setError('Failed to fetch popular posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularPosts();
  }, [subplebbits]);

  return { popularPosts, isLoading, error };
};

export default usePopularPosts;
