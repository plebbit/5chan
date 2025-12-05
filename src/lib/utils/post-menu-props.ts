import { Comment } from '@plebbit/plebbit-react-hooks';

export type PostMenuProps = {
  cid?: string;
  postCid?: string;
  parentCid?: string;
  subplebbitAddress?: string;
  isDescription?: boolean;
  isRules?: boolean;
  authorAddress?: string;
  link?: string;
  linkWidth?: number;
  linkHeight?: number;
  thumbnailUrl?: string;
  deleted?: boolean;
  removed?: boolean;
};

export const selectPostMenuProps = (post?: Comment): PostMenuProps => ({
  cid: post?.cid,
  postCid: post?.postCid,
  parentCid: post?.parentCid,
  subplebbitAddress: post?.subplebbitAddress,
  isDescription: post?.isDescription,
  isRules: post?.isRules,
  authorAddress: post?.author?.address,
  link: post?.link,
  linkWidth: post?.linkWidth,
  linkHeight: post?.linkHeight,
  thumbnailUrl: post?.thumbnailUrl,
  deleted: post?.deleted,
  removed: post?.removed,
});
