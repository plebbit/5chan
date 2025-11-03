import { useEffect, useMemo, useState } from 'react';

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

export interface DefaultSubplebbitsState {
  subplebbits: MultisubSubplebbit[];
  loading: boolean;
  error: Error | null;
}

let cacheSubplebbits: MultisubSubplebbit[] | null = null;
let cacheMetadata: MultisubMetadata | null = null;

export const useDefaultSubplebbits = () => {
  const [state, setState] = useState<DefaultSubplebbitsState>({
    subplebbits: [],
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

    (async () => {
      try {
        const multisub = await fetch('https://raw.githubusercontent.com/plebbit/lists/master/5chan-multisub.json').then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        });

        cacheSubplebbits = multisub.subplebbits;

        setState({
          subplebbits: multisub.subplebbits,
          loading: false,
          error: null,
        });
      } catch (e) {
        console.warn(e);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e : new Error('Failed to fetch subplebbits'),
        }));
      }
    })();
  }, []);

  // To maintain backward compatibility, return the subplebbits array directly
  return cacheSubplebbits || state.subplebbits;
};

export const useDefaultSubplebbitsState = () => {
  const [state, setState] = useState<DefaultSubplebbitsState>({
    subplebbits: cacheSubplebbits || [],
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

    (async () => {
      try {
        const multisub = await fetch('https://raw.githubusercontent.com/plebbit/lists/master/5chan-multisub.json').then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        });

        cacheSubplebbits = multisub.subplebbits;

        setState({
          subplebbits: multisub.subplebbits,
          loading: false,
          error: null,
        });
      } catch (e) {
        console.warn(e);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e : new Error('Failed to fetch subplebbits'),
        }));
      }
    })();
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
    (async () => {
      try {
        const multisub = await fetch(
          'https://raw.githubusercontent.com/plebbit/lists/master/5chan-multisub.json',
          // { cache: 'no-cache' }
        ).then((res) => res.json());
        const { title, description, createdAt, updatedAt } = multisub;
        const metadata: MultisubMetadata = { title, description, createdAt, updatedAt };
        cacheMetadata = metadata;
        setMetadata(metadata);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  return cacheMetadata || metadata;
};
