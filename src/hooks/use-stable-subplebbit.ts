import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';

/**
 * Shallow compare two objects by keys and values.
 */
const shallowEqual = (obj1: Record<string, any> | undefined, obj2: Record<string, any> | undefined): boolean => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return obj1 === obj2;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};

/**
 * Custom equality function that ignores transient state properties
 * like updatingState, state, errors, etc. Only compares stable content fields.
 */
const isSubplebbitEqual = (prev: any, next: any): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return prev === next;

  // Compare only stable fields, ignore transient state
  // Use shallow comparison for roles object to handle new object instances with same content
  return (
    prev.address === next.address &&
    prev.title === next.title &&
    prev.shortAddress === next.shortAddress &&
    shallowEqual(prev.roles, next.roles) &&
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

/**
 * Hook to get multiple subplebbits with stable references.
 * Only re-renders when actual content changes (updatedAt, posts pages), not transient state.
 *
 * @param subplebbitAddresses - Array of subplebbit addresses
 * @returns Array of subplebbit objects
 */
export const useStableSubplebbits = (subplebbitAddresses: string[]) => {
  const subplebbits = useSubplebbitsStore(
    (state) => subplebbitAddresses.map((address) => state.subplebbits[address]),
    // Custom equality: only re-render if stable content fields change
    (prev, next) => {
      if (prev.length !== next.length) return false;
      return prev.every((p, i) => {
        const n = next[i];
        if (p === n) return true;
        if (!p || !n) return p === n;
        // Compare stable content fields only - ignore updatingState, state, clients, etc.
        return (
          p.address === n.address &&
          p.updatedAt === n.updatedAt &&
          // For PopularThreadsBox: compare posts pages reference (changes when new posts loaded)
          p.posts?.pages?.hot === n.posts?.pages?.hot
        );
      });
    },
  );

  return subplebbits;
};
