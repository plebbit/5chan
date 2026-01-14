import { useEffect, useMemo } from 'react';
import { useAccount } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import { create } from 'zustand';

const pendingFetchCid: { [cid: string]: boolean } = {};

/**
 * Hook to get stats for multiple subplebbits.
 * Uses stable store selector to avoid re-renders from updatingState changes.
 */
const useSubplebbitsStats = (options: any) => {
  const { subplebbitAddresses, accountName } = options || {};
  const account = useAccount({ accountName });

  // Use stable selector to only get statsCid for each address
  // This avoids re-renders when only updatingState changes
  const statsCids = useSubplebbitsStore(
    (state) =>
      (subplebbitAddresses || []).map((address: string) => ({
        address,
        statsCid: state.subplebbits[address]?.statsCid,
      })),
    // Custom equality: only re-render if statsCid values change
    (prev, next) => {
      if (prev.length !== next.length) return false;
      return prev.every((p: any, i: number) => p.address === next[i].address && p.statsCid === next[i].statsCid);
    },
  );

  const { setSubplebbitStats, subplebbitsStats } = useSubplebbitsStatsStore();

  useEffect(() => {
    if (!subplebbitAddresses || subplebbitAddresses.length === 0 || !account) {
      return;
    }

    statsCids.forEach(({ address, statsCid }: { address: string; statsCid: string | undefined }) => {
      if (statsCid && !subplebbitsStats[address] && !pendingFetchCid[statsCid]) {
        pendingFetchCid[statsCid] = true;
        account.plebbit
          .fetchCid(statsCid)
          .then((fetchedStats: any) => {
            setSubplebbitStats(address, JSON.parse(fetchedStats));
          })
          .catch((error: any) => {
            pendingFetchCid[statsCid] = false;
            console.error('Fetching subplebbit stats failed', { subplebbitAddress: address, error });
          });
      }
    });
  }, [account, statsCids, setSubplebbitStats, subplebbitsStats, subplebbitAddresses]);

  return useMemo(() => {
    return subplebbitAddresses.reduce((acc: any, address: any) => {
      acc[address] = subplebbitsStats[address] || { loading: true };
      return acc;
    }, {});
  }, [subplebbitsStats, subplebbitAddresses]);
};

export type SubplebbitsStatsState = {
  subplebbitsStats: { [subplebbitAddress: string]: any };
  setSubplebbitStats: Function;
};

const useSubplebbitsStatsStore = create<SubplebbitsStatsState>((set) => ({
  subplebbitsStats: {},
  setSubplebbitStats: (subplebbitAddress: string, subplebbitStats: any) =>
    set((state) => ({
      subplebbitsStats: { ...state.subplebbitsStats, [subplebbitAddress]: subplebbitStats },
    })),
}));

export default useSubplebbitsStats;
