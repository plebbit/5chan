import { MultisubSubplebbit } from '../../hooks/use-default-subplebbits';

/**
 * Extract directory short code from title (e.g., "/biz/ - Business & Finance" -> "biz")
 */
export const extractDirectoryFromTitle = (title: string): string | null => {
  const match = title.match(/^\/([^/]+)\//);
  return match ? match[1] : null;
};

// Cache for maps to avoid recreating them on every call
let cachedSubplebbits: MultisubSubplebbit[] | null = null;
let cachedDirectoryToAddressMap: Map<string, string> | null = null;
let cachedAddressToDirectoryMap: Map<string, string> | null = null;

/**
 * Create a map from directory codes to subplebbit addresses
 * Uses caching to avoid recreating the map when subplebbits array hasn't changed
 */
export const getDirectoryToAddressMap = (subplebbits: MultisubSubplebbit[]): Map<string, string> => {
  // Check if we can use cached map (same array reference)
  if (cachedDirectoryToAddressMap && cachedSubplebbits === subplebbits) {
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
  cachedSubplebbits = subplebbits;
  return map;
};

/**
 * Create a map from subplebbit addresses to directory codes
 * Uses caching to avoid recreating the map when subplebbits array hasn't changed
 */
export const getAddressToDirectoryMap = (subplebbits: MultisubSubplebbit[]): Map<string, string> => {
  // Check if we can use cached map (same array reference)
  if (cachedAddressToDirectoryMap && cachedSubplebbits === subplebbits) {
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
  cachedSubplebbits = subplebbits;
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
