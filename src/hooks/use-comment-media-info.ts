import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getCommentMediaInfo, fetchWebpageThumbnailIfNeeded, CommentMediaInfo } from '../lib/utils/media-utils';
import { isPendingPostView, isPostPageView } from '../lib/utils/view-utils';

/**
 * Hook to fetch and cache media info with thumbnail dimensions for comments.
 * Properly tracks thumbnail dimensions using state so they're available after the image loads.
 */
export const useCommentMediaInfo = (link: string, thumbnailUrl: string, linkWidth: number, linkHeight: number): CommentMediaInfo | undefined => {
  const location = useLocation();
  const params = useParams();
  const isInPostPageView = isPostPageView(location.pathname, params);
  const isInPendingPostView = isPendingPostView(location.pathname, params);

  const [thumbnailDimensions, setThumbnailDimensions] = useState<{ width: number; height: number } | null>(null);

  // Fetch and cache thumbnail dimensions for webpage media
  useEffect(() => {
    if (!(isInPostPageView || isInPendingPostView)) return;

    const fetchAndCacheThumbnail = async () => {
      const mediaInfo = getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);

      if (mediaInfo?.type === 'webpage' && !mediaInfo.thumbnail) {
        const newMediaInfo = await fetchWebpageThumbnailIfNeeded(mediaInfo);

        if (newMediaInfo.thumbnail) {
          const img = new Image();
          img.onload = () => {
            setThumbnailDimensions({ width: img.width, height: img.height });
          };
          img.onerror = () => {
            // Silently handle failed image loads
          };
          img.src = newMediaInfo.thumbnail;
        }
      }
    };

    fetchAndCacheThumbnail();
  }, [link, thumbnailUrl, linkWidth, linkHeight, isInPostPageView, isInPendingPostView]);

  const mediaInfo = getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);

  // Return media info with cached thumbnail dimensions if available
  if (thumbnailDimensions && mediaInfo) {
    return {
      ...mediaInfo,
      thumbnailWidth: thumbnailDimensions.width,
      thumbnailHeight: thumbnailDimensions.height,
    };
  }

  return mediaInfo;
};
