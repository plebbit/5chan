import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccountComment, useAccountComments } from '@plebbit/plebbit-react-hooks';
import { useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { getBoardPath } from '../../lib/utils/route-utils';
import { Post } from '../post';

const PendingPost = () => {
  const { accountComments } = useAccountComments();
  const { accountCommentIndex } = useParams<{ accountCommentIndex?: string }>();
  const commentIndex = accountCommentIndex ? parseInt(accountCommentIndex) : undefined;
  const post = useAccountComment({ commentIndex });
  const navigate = useNavigate();
  const defaultSubplebbits = useDefaultSubplebbits();

  useEffect(() => window.scrollTo(0, 0), []);

  const isValidAccountCommentIndex =
    !accountCommentIndex ||
    (!isNaN(parseInt(accountCommentIndex)) &&
      parseInt(accountCommentIndex) >= 0 &&
      Number.isInteger(parseFloat(accountCommentIndex)) &&
      accountComments?.length > 0 &&
      parseInt(accountCommentIndex) < accountComments.length);

  useEffect(() => {
    if (!isValidAccountCommentIndex) {
      navigate('/not-found', { replace: true });
    }
  }, [isValidAccountCommentIndex, navigate]);

  useEffect(() => {
    if (post?.cid && post?.subplebbitAddress) {
      const boardPath = getBoardPath(post.subplebbitAddress, defaultSubplebbits);
      navigate(`/${boardPath}/thread/${post.cid}`, { replace: true });
    }
  }, [post, navigate, defaultSubplebbits]);

  return <Post post={post} />;
};

export default PendingPost;
