import { useAccountSubplebbits } from '@plebbit/plebbit-react-hooks';
import { useMemo } from 'react';
import { MultisubSubplebbit } from './use-default-subplebbits';

export const useAccountSubplebbitsWithMetadata = (): MultisubSubplebbit[] => {
  const { accountSubplebbits } = useAccountSubplebbits();

  return useMemo(() => {
    return Object.entries(accountSubplebbits || {}).map(([address, sub]) => ({
      address,
      title: (sub as any).title,
      // We can map other fields if needed
    }));
  }, [accountSubplebbits]);
};
