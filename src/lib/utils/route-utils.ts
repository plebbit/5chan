import { MultisubSubplebbit } from '../../hooks/use-default-subplebbits';

/**
 * Extract directory short code from title (e.g., "/biz/ - Business & Finance" -> "biz")
 */
export const extractDirectoryFromTitle = (title: string): string | null => {
  const match = title.match(/^\/([^/]+)\//);
  return match ? match[1] : null;
};

// Cache for directory-to-address map
let cachedSubplebbitsForDirectory: MultisubSubplebbit[] | null = null;
let cachedDirectoryToAddressMap: Map<string, string> | null = null;

// Cache for address-to-directory map
let cachedSubplebbitsForAddress: MultisubSubplebbit[] | null = null;
let cachedAddressToDirectoryMap: Map<string, string> | null = null;

/**
 * Create a map from directory codes to subplebbit addresses
 * Uses caching to avoid recreating the map when subplebbits array hasn't changed
 */
export const getDirectoryToAddressMap = (subplebbits: MultisubSubplebbit[]): Map<string, string> => {
  // Check if we can use cached map (same array reference)
  if (cachedDirectoryToAddressMap && cachedSubplebbitsForDirectory === subplebbits) {
    return cachedDirectoryToAddressMap;
  }

  const map = new Map<string, string>();
  for (const subplebbit of subplebbits) {
    if (subplebbit.title) {
      const directory = extractDirectoryFromTitle(subplebbit.title);
      if (directory && subplebbit.address) {
        map.set(directory, subplebbit.address);
      }
    }
  }

  // Cache the map and array reference
  cachedDirectoryToAddressMap = map;
  cachedSubplebbitsForDirectory = subplebbits;
  return map;
};

/**
 * Create a map from subplebbit addresses to directory codes
 * Uses caching to avoid recreating the map when subplebbits array hasn't changed
 */
export const getAddressToDirectoryMap = (subplebbits: MultisubSubplebbit[]): Map<string, string> => {
  // Check if we can use cached map (same array reference)
  if (cachedAddressToDirectoryMap && cachedSubplebbitsForAddress === subplebbits) {
    return cachedAddressToDirectoryMap;
  }

  const map = new Map<string, string>();
  for (const subplebbit of subplebbits) {
    if (subplebbit.title && subplebbit.address) {
      const directory = extractDirectoryFromTitle(subplebbit.title);
      if (directory) {
        map.set(subplebbit.address, directory);
      }
    }
  }

  // Cache the map and array reference
  cachedAddressToDirectoryMap = map;
  cachedSubplebbitsForAddress = subplebbits;
  return map;
};

/**
 * Convert subplebbit address to URL path (directory code if available, otherwise full address)
 */
export const getBoardPath = (subplebbitAddress: string, subplebbits: MultisubSubplebbit[]): string => {
  const addressToDirectory = getAddressToDirectoryMap(subplebbits);
  const directory = addressToDirectory.get(subplebbitAddress);
  return directory || subplebbitAddress;
};

/**
 * Convert URL path (directory code or address) to subplebbit address
 */
export const getSubplebbitAddress = (boardIdentifier: string, subplebbits: MultisubSubplebbit[]): string => {
  const directoryToAddress = getDirectoryToAddressMap(subplebbits);

  // Check if it's a directory code
  const address = directoryToAddress.get(boardIdentifier);
  if (address) {
    return address;
  }

  // Otherwise, assume it's already an address
  return boardIdentifier;
};

/**
 * Check if an identifier is a directory short code
 */
export const isDirectoryBoard = (identifier: string, subplebbits: MultisubSubplebbit[]): boolean => {
  const directoryToAddress = getDirectoryToAddressMap(subplebbits);
  return directoryToAddress.has(identifier);
};

export const isFeedRoute = (pathname: string): boolean => {
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (normalizedPath.includes('/thread/')) return false;
  if (normalizedPath.endsWith('/description')) return false;
  if (normalizedPath.endsWith('/rules')) return false;
  if (normalizedPath.startsWith('/pending/')) return false;

  const pathWithoutSettings = normalizedPath.replace(/\/settings$/, '');

  if (pathWithoutSettings.startsWith('/all')) return true;
  if (pathWithoutSettings.startsWith('/subs')) return true;
  if (pathWithoutSettings.startsWith('/mod')) return true;

  const segments = pathWithoutSettings.split('/').filter(Boolean);
  if (segments.length >= 1) {
    if (segments.length === 1) return true;
    if (segments.length === 2 && segments[1] === 'catalog') return true;
    if (segments.length === 2 && /^(?:\d+(?:h|d|w|m|y)|all)$/.test(segments[1])) return true;
    if (segments.length === 3 && segments[1] === 'catalog' && /^(?:\d+(?:h|d|w|m|y)|all)$/.test(segments[2])) return true;
  }

  return false;
};

export const isPostRoute = (pathname: string): boolean => {
  const normalizedPath = pathname.replace(/\/settings$/, '');

  if (normalizedPath.includes('/thread/')) return true;
  if (normalizedPath.endsWith('/description')) return true;
  if (normalizedPath.endsWith('/rules')) return true;

  return false;
};

export const isPendingPostRoute = (pathname: string): boolean => {
  const normalizedPath = pathname.replace(/\/settings$/, '');
  return normalizedPath.startsWith('/pending/');
};

export const getFeedCacheKey = (pathname: string): string | null => {
  let normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  normalizedPath = normalizedPath.replace(/\/settings$/, '');

  if (normalizedPath.includes('/thread/')) {
    const parts = normalizedPath.split('/thread/');
    return parts[0] || null;
  }

  if (normalizedPath.endsWith('/description') || normalizedPath.endsWith('/rules')) {
    return normalizedPath.replace(/\/(description|rules)$/, '');
  }

  if (normalizedPath.startsWith('/pending/')) {
    return null;
  }

  if (isFeedRoute(pathname)) {
    return normalizedPath;
  }

  return null;
};

export const getFeedType = (pathname: string): 'board' | 'catalog' | null => {
  const normalizedPath = pathname.replace(/\/settings$/, '');

  if (normalizedPath.includes('/catalog')) {
    return 'catalog';
  }

  if (isFeedRoute(pathname)) {
    return 'board';
  }

  if (isPostRoute(pathname)) {
    return 'board';
  }

  return null;
};
