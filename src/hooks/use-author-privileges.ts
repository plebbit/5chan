import { useMemo } from 'react';
import { useAccount } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';

interface AuthorPrivilegesProps {
  commentAuthorAddress: string;
  subplebbitAddress: string;
  postCid?: string;
}

const useAuthorPrivileges = ({ commentAuthorAddress, subplebbitAddress, postCid }: AuthorPrivilegesProps) => {
  const account = useAccount();
  const accountAuthorAddress = account?.author?.address;
  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress]);
  const { roles } = subplebbit || {};
  const { isCommentAuthorMod, isAccountMod, isAccountCommentAuthor, commentAuthorRole, accountAuthorRole } = useMemo(() => {
    const commentAuthorRole = roles?.[commentAuthorAddress]?.role;
    const isCommentAuthorMod = commentAuthorRole === 'admin' || commentAuthorRole === 'owner' || commentAuthorRole === 'moderator';
    const accountAuthorRole = roles?.[accountAuthorAddress]?.role;
    const isAccountMod = accountAuthorRole === 'admin' || accountAuthorRole === 'owner' || accountAuthorRole === 'moderator';

    const isAccountCommentAuthor = !!postCid && accountAuthorAddress === commentAuthorAddress;

    return { isCommentAuthorMod, isAccountMod, isAccountCommentAuthor, commentAuthorRole, accountAuthorRole };
  }, [roles, commentAuthorAddress, accountAuthorAddress, postCid]);

  return { isCommentAuthorMod, isAccountMod, isAccountCommentAuthor, commentAuthorRole, accountAuthorRole };
};

export default useAuthorPrivileges;
