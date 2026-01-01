import { useMemo } from 'react';
import { useDefaultSubplebbits } from './use-default-subplebbits';
import useAllFeedFilterStore from '../stores/use-all-feed-filter-store';

export const useFilteredDefaultSubplebbitAddresses = () => {
  const defaultSubplebbits = useDefaultSubplebbits();
  const { filter } = useAllFeedFilterStore();

  return useMemo(() => {
    if (filter === 'all') {
      return defaultSubplebbits.map((subplebbit) => subplebbit.address);
    }
    if (filter === 'nsfw') {
      return defaultSubplebbits.filter((subplebbit) => subplebbit.nsfw === true).map((subplebbit) => subplebbit.address);
    }
    // filter === 'sfw'
    return defaultSubplebbits.filter((subplebbit) => subplebbit.nsfw !== true).map((subplebbit) => subplebbit.address);
  }, [defaultSubplebbits, filter]);
};
