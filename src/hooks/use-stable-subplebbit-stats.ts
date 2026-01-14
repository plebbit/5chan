import { useEffect } from 'react';
import { useAccount } from '@plebbit/plebbit-react-hooks';
import { create } from 'zustand';
import { useSubplebbitField } from './use-stable-subplebbit';

// Store to cache fetched stats and track pending fetches
interface SubplebbitStatsState {
  stats: { [address: string]: any };
  pendingCids: { [cid: string]: boolean };
  setStats: (address: string, stats: any) => void;
  setPending: (cid: string, pending: boolean) => void;
}

const useStableSubplebbitStatsStore = create<SubplebbitStatsState>((set) => ({
  stats: {},
  pendingCids: {},
  setStats: (address, stats) =>
    set((state) => ({
      stats: { ...state.stats, [address]: stats },
    })),
  setPending: (cid, pending) =>
    set((state) => ({
      pendingCids: { ...state.pendingCids, [cid]: pending },
    })),
}));

/**
 * Stable version of useSubplebbitStats that doesn't depend on useSubplebbit internally.
 * Uses useSubplebbitField to get the statsCid without re-rendering on updatingState changes.
 */
export const useStableSubplebbitStats = (subplebbitAddress: string | undefined) => {
  const account = useAccount();

  // Get statsCid using stable field selector - won't re-render on updatingState changes
  const statsCid = useSubplebbitField(subplebbitAddress, (sub) => sub?.statsCid);

  const stats = useStableSubplebbitStatsStore((state) => (subplebbitAddress ? state.stats[subplebbitAddress] : undefined));
  const pendingCids = useStableSubplebbitStatsStore((state) => state.pendingCids);
  const setStats = useStableSubplebbitStatsStore((state) => state.setStats);
  const setPending = useStableSubplebbitStatsStore((state) => state.setPending);

  useEffect(() => {
    if (!subplebbitAddress || !statsCid || !account) {
      return;
    }

    // Don't fetch if already fetched or pending
    if (stats || pendingCids[statsCid]) {
      return;
    }

    setPending(statsCid, true);

    account.plebbit
      .fetchCid(statsCid)
      .then((fetchedStats: any) => {
        setStats(subplebbitAddress, JSON.parse(fetchedStats));
      })
      .catch((error: any) => {
        setPending(statsCid, false);
        console.error('useStableSubplebbitStats fetchCid error', { subplebbitAddress, statsCid, error });
      });
  }, [subplebbitAddress, statsCid, account, stats, pendingCids, setStats, setPending]);

  return stats;
};
