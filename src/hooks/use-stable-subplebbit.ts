import { useMemo } from 'react';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';

/**
 * Custom equality function that ignores transient state properties
 * like updatingState, state, errors, etc. Only compares stable content fields.
 */
const isSubplebbitEqual = (prev: any, next: any): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return prev === next;

  // Compare only stable fields, ignore transient state
  return (
    prev.address === next.address &&
    prev.title === next.title &&
    prev.shortAddress === next.shortAddress &&
    prev.roles === next.roles &&
    prev.updatedAt === next.updatedAt &&
    prev.createdAt === next.createdAt &&
    prev.description === next.description
  );
};

/**
 * Hook to get a subplebbit with stable reference that ignores updatingState changes.
 * Use this when you only need content fields and don't care about loading states.
 *
 * @param subplebbitAddress - The address of the subplebbit to retrieve
 * @returns The subplebbit object, or undefined if not found
 */
export const useStableSubplebbit = (subplebbitAddress: string | undefined) => {
  // Use selector with custom equality to ignore transient state
  const subplebbit = useSubplebbitsStore((state) => (subplebbitAddress ? state.subplebbits[subplebbitAddress] : undefined), isSubplebbitEqual);

  return subplebbit;
};

/**
 * Hook to get only specific fields from a subplebbit, ignoring updatingState.
 * This is more efficient when you only need a few fields.
 *
 * @param subplebbitAddress - The address of the subplebbit
 * @param selector - Function to extract the needed fields
 * @returns The selected fields
 */
export const useSubplebbitField = <T>(subplebbitAddress: string | undefined, selector: (subplebbit: any) => T): T | undefined => {
  const field = useSubplebbitsStore(
    (state) => {
      const subplebbit = subplebbitAddress ? state.subplebbits[subplebbitAddress] : undefined;
      return subplebbit ? selector(subplebbit) : undefined;
    },
    (prev, next) => prev === next,
  );

  return field;
};
