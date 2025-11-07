import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDefaultSubplebbits } from './use-default-subplebbits';
import { getSubplebbitAddress, getBoardPath } from '../lib/utils/route-utils';

/**
 * Hook to resolve boardIdentifier from URL params to subplebbitAddress
 * Handles both directory codes (e.g., "biz") and full addresses (e.g., "someboard.eth")
 *
 * Performance: Uses useMemo to avoid recalculating when params/defaultSubplebbits haven't changed.
 * The defaultSubplebbits reference is stable (from cache) after initial load, so memoization works effectively.
 */
export const useResolvedSubplebbitAddress = (): string | undefined => {
  const params = useParams();
  const defaultSubplebbits = useDefaultSubplebbits();

  // Try boardIdentifier first (new format), then subplebbitAddress (old format for backward compatibility)
  const boardIdentifier = params.boardIdentifier || params.subplebbitAddress;

  return useMemo(() => {
    if (!boardIdentifier) {
      return undefined;
    }

    // Resolve directory code to address if needed
    // getSubplebbitAddress uses internal caching, so this is efficient
    return getSubplebbitAddress(boardIdentifier, defaultSubplebbits);
  }, [boardIdentifier, defaultSubplebbits]);
};

/**
 * Hook to get the board path (directory code or address) for use in links
 *
 * Performance: Uses useMemo to avoid recalculating when subplebbitAddress/defaultSubplebbits haven't changed.
 * The defaultSubplebbits reference is stable (from cache) after initial load, so memoization works effectively.
 */
export const useBoardPath = (subplebbitAddress: string | undefined): string | undefined => {
  const defaultSubplebbits = useDefaultSubplebbits();

  return useMemo(() => {
    if (!subplebbitAddress) {
      return undefined;
    }

    // getBoardPath uses internal caching, so this is efficient
    return getBoardPath(subplebbitAddress, defaultSubplebbits);
  }, [subplebbitAddress, defaultSubplebbits]);
};
