import { copyToClipboard } from './clipboard-utils';

export const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
};

export const isValidURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const copyShareLinkToClipboard = async (subplebbitAddress: string, cid: string) => {
  const shareLink = `https://pleb.bz/p/${subplebbitAddress}/c/${cid}?redirect=5chan.app`;
  await copyToClipboard(shareLink);
};

const CHAN_5_HOSTNAMES = ['pleb.bz', '5chan.app', '5chan.eth.limo', '5chan.eth.link', '5chan.eth.sucks', '5chan.netlify.app'];

// Check if a URL is a valid 5chan link that should be handled internally
export const is5chanLink = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    if (!CHAN_5_HOSTNAMES.includes(hostname)) {
      return false;
    }

    // Check both pathname and hash for the route pattern
    let routePath = parsedUrl.pathname;

    // If there's a hash that starts with #/, use that as the route path
    if (parsedUrl.hash && parsedUrl.hash.startsWith('#/')) {
      routePath = parsedUrl.hash.substring(1); // Remove the # to get the path
    }

    // For pleb.bz, only support the exact sharelink format (legacy /p/... format)
    if (hostname === 'pleb.bz') {
      // Must match exactly: /p/{subplebbitAddress}/c/{cid}
      // Allow redirect parameter since these are still valid internal links
      return /^\/p\/[^/]+\/c\/[^/]+$/.test(routePath);
    }

    // For other 5chan hostnames, support both old and new formats:
    // Old format (for backward compatibility):
    // - /p/{subplebbitAddress}
    // - /p/{subplebbitAddress}/c/{commentCid}
    // New format:
    // - /{boardIdentifier} (directory code or address)
    // - /{boardIdentifier}/thread/{commentCid}
    // - /{boardIdentifier}/catalog
    // - /{boardIdentifier}/description
    // - /{boardIdentifier}/rules
    // - /all, /subs, /mod, /pending/{index}
    return (
      /^\/p\/[^/]+(\/c\/[^/]+)?$/.test(routePath) ||
      /^\/[^/]+(\/thread\/[^/]+|\/catalog|\/description|\/rules)?$/.test(routePath) ||
      /^\/(all|subscriptions|mod)(\/catalog|\/thread\/[^/]+)?(\/[^/]+)?$/.test(routePath) ||
      /^\/pending\/[^/]+$/.test(routePath)
    );
  } catch {
    return false;
  }
};

// Transform a valid 5chan URL to an internal route
export const transform5chanLinkToInternal = (url: string): string | null => {
  if (!is5chanLink(url)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    // Check if this is a hash-based route
    if (parsedUrl.hash && parsedUrl.hash.startsWith('#/')) {
      // Extract the route from the hash, preserving any query params within the hash
      const hashPath = parsedUrl.hash.substring(1); // Remove the #
      // Transform old /p/... format to new format if needed
      return transformOldPathToNew(hashPath);
    }

    // For regular pathname-based routes, remove redirect parameter from query string
    const searchParams = new URLSearchParams(parsedUrl.search);
    searchParams.delete('redirect'); // Remove redirect parameter for cleaner internal links

    const cleanSearch = searchParams.toString();
    const searchString = cleanSearch ? `?${cleanSearch}` : '';

    // Transform old /p/... format to new format if needed
    const transformedPath = transformOldPathToNew(parsedUrl.pathname);
    return transformedPath + searchString + parsedUrl.hash;
  } catch {
    return null;
  }
};

// Transform old URL format (/p/{address}/c/{cid}) to new format (/{boardIdentifier}/thread/{cid})
// Note: This function doesn't resolve directory codes - that's handled by the routing system
const transformOldPathToNew = (path: string): string => {
  // Transform /p/{address}/c/{cid} to /{address}/thread/{cid}
  const oldPostPattern = /^\/p\/([^/]+)\/c\/([^/]+)$/;
  const postMatch = path.match(oldPostPattern);
  if (postMatch) {
    const [, address, cid] = postMatch;
    return `/${address}/thread/${cid}`;
  }

  // Transform /p/{address} to /{address}
  const oldBoardPattern = /^\/p\/([^/]+)$/;
  const boardMatch = path.match(oldBoardPattern);
  if (boardMatch) {
    const [, address] = boardMatch;
    return `/${address}`;
  }

  // Return path as-is if it doesn't match old patterns
  return path;
};

// Check if a string is a valid IPNS public key (52 chars starting with 12D3KooW)
const isValidIPNSKey = (str: string): boolean => {
  return str.length === 52 && str.startsWith('12D3KooW');
};

// Check if a string is a valid domain (contains a dot)
const isValidDomain = (str: string): boolean => {
  return str.includes('.') && str.split('.').length >= 2 && str.split('.').every((part) => part.length > 0);
};

// Check if a plain text pattern is a valid 5chan subplebbit reference
export const isValidSubplebbitPattern = (pattern: string): boolean => {
  // Must start with "p/"
  if (!pattern.startsWith('p/')) {
    return false;
  }

  const pathPart = pattern.substring(2); // Remove "p/"

  // Check if it's a post pattern: subplebbitAddress/c/cid
  const postMatch = pathPart.match(/^([^/]+)\/c\/([^/]+)$/);
  if (postMatch) {
    const [, subplebbitAddress, cid] = postMatch;
    // CID should be at least 10 characters (minimum reasonable CID length)
    return (isValidDomain(subplebbitAddress) || isValidIPNSKey(subplebbitAddress)) && cid.length >= 10;
  }

  // Check if it's just a subplebbit pattern: subplebbitAddress
  return isValidDomain(pathPart) || isValidIPNSKey(pathPart);
};

// Preprocess content to convert plain text 5chan patterns to markdown links
export const preprocess5chanPatterns = (content: string): string => {
  // Pattern to match "p/something" or "p/something/c/something"
  // Negative lookbehind prevents matching patterns that are already part of URLs
  const pattern = /(?<!https?:\/\/[^\s]*)\bp\/([a-zA-Z0-9\-.]+(?:\/c\/[a-zA-Z0-9]{10,100})?)[.,:;!?]*/g;

  return content.replace(pattern, (match, capturedPath) => {
    // Remove any trailing punctuation from the captured path
    const cleanPath = capturedPath.replace(/[.,:;!?]+$/, '');
    const fullPattern = `p/${cleanPath}`;

    if (isValidSubplebbitPattern(fullPattern)) {
      // Preserve trailing punctuation outside the link
      const trailingPunctuation = match.slice(fullPattern.length);
      return `[${fullPattern}](/${fullPattern})${trailingPunctuation}`;
    }

    return match;
  });
};
