import { useEffect, useMemo, useState } from 'react';
import defaultSubplebbitsData from '../data/default-subplebbits.json';

export interface MultisubMetadata {
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface MultisubSubplebbit {
  title?: string;
  address: string;
  nsfw?: boolean;
}

export interface MultisubData {
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  subplebbits: MultisubSubplebbit[];
}

export interface DefaultSubplebbitsState {
  subplebbits: MultisubSubplebbit[];
  loading: boolean;
  error: Error | null;
}

const GITHUB_URL = 'https://raw.githubusercontent.com/plebbit/lists/master/5chan-multisub.json';
const LOCALSTORAGE_KEY = '5chan-subplebbits-cache';
const LOCALSTORAGE_TIMESTAMP_KEY = '5chan-subplebbits-cache-timestamp';
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

let cacheSubplebbits: MultisubSubplebbit[] | null = null;
let cacheMetadata: MultisubMetadata | null = null;

const getFromLocalStorage = (): MultisubData | null => {
  try {
    const cached = localStorage.getItem(LOCALSTORAGE_KEY);
    const timestamp = localStorage.getItem(LOCALSTORAGE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_MAX_AGE_MS) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
  }
  return null;
};

const saveToLocalStorage = (data: MultisubData) => {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(LOCALSTORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

const fetchMultisubData = async (): Promise<MultisubData> => {
  try {
    const response = await fetch(GITHUB_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Save successful fetch to localStorage
    saveToLocalStorage(data);
    return data;
  } catch (e) {
    console.warn('Failed to fetch subplebbits from GitHub, using vendored fallback:', e);
    // Fall back to vendored file
    return defaultSubplebbitsData as MultisubData;
  }
};

export const useDefaultSubplebbits = () => {
  // Use vendored data as initial state to prevent theme flash on first load
  // This ensures NSFW status is known synchronously before first render
  const [state, setState] = useState<DefaultSubplebbitsState>({
    subplebbits: (defaultSubplebbitsData as MultisubData).subplebbits,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (cacheSubplebbits) {
      setState({
        subplebbits: cacheSubplebbits,
        loading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        // Check localStorage first
        const cachedData = getFromLocalStorage();
        if (cachedData) {
          cacheSubplebbits = cachedData.subplebbits;
          if (isMounted) {
            setState({
              subplebbits: cachedData.subplebbits,
              loading: false,
              error: null,
            });
          }
          // Still try to fetch fresh data in background (don't await)
          fetchMultisubData()
            .then((data) => {
              if (isMounted) {
                cacheSubplebbits = data.subplebbits;
                setState({
                  subplebbits: data.subplebbits,
                  loading: false,
                  error: null,
                });
              }
            })
            .catch((e) => {
              console.warn('Background fetch failed:', e);
            });
          return;
        }

        // No cache, fetch fresh data
        const multisub = await fetchMultisubData();
        if (isMounted) {
          cacheSubplebbits = multisub.subplebbits;
          setState({
            subplebbits: multisub.subplebbits,
            loading: false,
            error: null,
          });
        }
      } catch (e) {
        console.warn('Failed to load subplebbits:', e);
        // Fallback to vendored data
        const fallbackData = defaultSubplebbitsData as MultisubData;
        if (isMounted) {
          cacheSubplebbits = fallbackData.subplebbits;
          setState({
            subplebbits: fallbackData.subplebbits,
            loading: false,
            error: null,
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Always prefer cacheSubplebbits (module-level, stable reference) when available
  // Only use state.subplebbits during initial load before cache is populated
  // This ensures a stable reference for memoization in consuming hooks
  return cacheSubplebbits || state.subplebbits;
};

export const useDefaultSubplebbitsState = () => {
  // Use vendored data as fallback to prevent theme flash on first load
  const [state, setState] = useState<DefaultSubplebbitsState>({
    subplebbits: cacheSubplebbits || (defaultSubplebbitsData as MultisubData).subplebbits,
    loading: !cacheSubplebbits,
    error: null,
  });

  useEffect(() => {
    if (cacheSubplebbits) {
      setState({
        subplebbits: cacheSubplebbits,
        loading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        // Check localStorage first
        const cachedData = getFromLocalStorage();
        if (cachedData) {
          cacheSubplebbits = cachedData.subplebbits;
          if (isMounted) {
            setState({
              subplebbits: cachedData.subplebbits,
              loading: false,
              error: null,
            });
          }
          // Still try to fetch fresh data in background (don't await)
          fetchMultisubData()
            .then((data) => {
              if (isMounted) {
                cacheSubplebbits = data.subplebbits;
                setState({
                  subplebbits: data.subplebbits,
                  loading: false,
                  error: null,
                });
              }
            })
            .catch((e) => {
              console.warn('Background fetch failed:', e);
            });
          return;
        }

        // No cache, fetch fresh data
        const multisub = await fetchMultisubData();
        if (isMounted) {
          cacheSubplebbits = multisub.subplebbits;
          setState({
            subplebbits: multisub.subplebbits,
            loading: false,
            error: null,
          });
        }
      } catch (e) {
        console.warn('Failed to load subplebbits:', e);
        // Fallback to vendored data
        const fallbackData = defaultSubplebbitsData as MultisubData;
        if (isMounted) {
          cacheSubplebbits = fallbackData.subplebbits;
          setState({
            subplebbits: fallbackData.subplebbits,
            loading: false,
            error: null,
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

export const useDefaultSubplebbitAddresses = () => {
  const defaultSubplebbits = useDefaultSubplebbits();
  return useMemo(() => defaultSubplebbits.map((subplebbit) => subplebbit.address), [defaultSubplebbits]);
};

export const useMultisubMetadata = () => {
  const [metadata, setMetadata] = useState<MultisubMetadata | null>(null);

  useEffect(() => {
    if (cacheMetadata) {
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        // Check localStorage first
        const cachedData = getFromLocalStorage();
        if (cachedData) {
          const metadata: MultisubMetadata = {
            title: cachedData.title,
            description: cachedData.description,
            createdAt: cachedData.createdAt,
            updatedAt: cachedData.updatedAt,
          };
          cacheMetadata = metadata;
          if (isMounted) {
            setMetadata(metadata);
          }
          // Still try to fetch fresh data in background (don't await)
          fetchMultisubData()
            .then((data) => {
              if (isMounted) {
                const freshMetadata: MultisubMetadata = {
                  title: data.title,
                  description: data.description,
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt,
                };
                cacheMetadata = freshMetadata;
                setMetadata(freshMetadata);
              }
            })
            .catch((e) => {
              console.warn('Background metadata fetch failed:', e);
            });
          return;
        }

        // No cache, fetch fresh data
        const multisub = await fetchMultisubData();
        if (isMounted) {
          const metadata: MultisubMetadata = {
            title: multisub.title,
            description: multisub.description,
            createdAt: multisub.createdAt,
            updatedAt: multisub.updatedAt,
          };
          cacheMetadata = metadata;
          setMetadata(metadata);
        }
      } catch (e) {
        console.warn('Failed to load metadata, using vendored fallback:', e);
        // Fallback to vendored data
        const fallbackData = defaultSubplebbitsData as MultisubData;
        if (isMounted) {
          const metadata: MultisubMetadata = {
            title: fallbackData.title,
            description: fallbackData.description,
            createdAt: fallbackData.createdAt,
            updatedAt: fallbackData.updatedAt,
          };
          cacheMetadata = metadata;
          setMetadata(metadata);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return cacheMetadata || metadata;
};
