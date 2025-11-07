import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Comment, Role, useComment, useEditedComment, useSubplebbit } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import { useLocation, useParams } from 'react-router-dom';
import { isAllView, isDescriptionView, isRulesView } from '../../lib/utils/view-utils';
import { useResolvedSubplebbitAddress } from '../../hooks/use-resolved-subplebbit-address';
import useIsMobile from '../../hooks/use-is-mobile';
import ErrorDisplay from '../../components/error-display/error-display';
import PostDesktop from '../../components/post-desktop';
import PostMobile from '../../components/post-mobile';
import SubplebbitDescription from '../../components/subplebbit-description';
import SubplebbitRules from '../../components/subplebbit-rules';
import styles from './post.module.css';

export interface PostProps {
  index?: number;
  isHidden?: boolean;
  hasThumbnail?: boolean;
  post?: any;
  postReplyCount?: number;
  reply?: any;
  roles?: Role[];
  showAllReplies?: boolean;
  showReplies?: boolean;
}

export const Post = ({ post, showAllReplies = false, showReplies = true }: PostProps) => {
  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[post?.subplebbitAddress]);
  const isMobile = useIsMobile();

  let comment = post;

  // handle pending mod or author edit
  const { editedComment } = useEditedComment({ comment });
  if (editedComment) {
    comment = editedComment;
  }

  return (
    <div className={styles.thread}>
      <div className={styles.postContainer}>
        {isMobile ? (
          <PostMobile post={comment} roles={subplebbit?.roles} showAllReplies={showAllReplies} showReplies={showReplies} />
        ) : (
          <PostDesktop post={comment} roles={subplebbit?.roles} showAllReplies={showAllReplies} showReplies={showReplies} />
        )}
      </div>
    </div>
  );
};

const PostPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const { commentCid } = params;
  const subplebbitAddress = useResolvedSubplebbitAddress();
  const isInAllView = isAllView(location.pathname);
  const isInDescriptionView = isDescriptionView(location.pathname, params);
  const isInRulesView = isRulesView(location.pathname, params);

  const comment = useComment({ commentCid });
  const subplebbit = useSubplebbit({ subplebbitAddress });
  const { createdAt, description, rules, shortAddress, suggested, title } = subplebbit || {};

  // if the comment is a reply, return the post comment instead, then the reply will be highlighted in the thread
  const postComment = useComment({ commentCid: comment?.postCid });
  let post: Comment;
  if (comment.parentCid) {
    post = postComment;
  } else {
    post = comment;
  }

  const { error, replyCount } = post || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const boardTitle = title ? title : shortAddress || subplebbitAddress;
    const postTitle = post?.title?.slice(0, 30) || post?.content?.slice(0, 30);
    const postDucumentTitle = (postTitle ? postTitle.trim() + '... - ' : '') + boardTitle + ' - 5chan';
    document.title = isInAllView ? `${t('all')} - 5chan` : postDucumentTitle;
  }, [title, shortAddress, subplebbitAddress, post?.title, post?.content, isInAllView, t]);

  // probably not necessary to show the error to the user if the post loaded successfully
  const shouldShowErrorToUser = post?.error && ((post?.replyCount > 0 && post?.replies?.length === 0) || (post?.state === 'failed' && post?.error));

  return (
    <div className={styles.content}>
      {/* TODO: remove this replyCount error once api supports scrolling replies pages */}
      {replyCount > 60 && <span className={styles.error}>Error: this thread has too many replies, some of them cannot be displayed right now.</span>}
      {shouldShowErrorToUser && (
        <div className={styles.error}>
          <ErrorDisplay error={error} />
        </div>
      )}
      {isInDescriptionView ? (
        <SubplebbitDescription
          avatarUrl={suggested?.avatarUrl}
          createdAt={createdAt}
          description={description}
          replyCount={location.pathname.startsWith('/all/') ? 0 : rules?.length > 0 ? 1 : 0}
          subplebbitAddress={subplebbitAddress}
          shortAddress={shortAddress}
          title={title}
        />
      ) : isInRulesView ? (
        <SubplebbitRules createdAt={createdAt} rules={rules} subplebbitAddress={subplebbitAddress} />
      ) : (
        <Post post={post} showAllReplies={true} />
      )}
    </div>
  );
};

export default PostPage;
