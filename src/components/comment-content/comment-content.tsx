import { Fragment, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Comment } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsPagesStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits-pages';
import { getFormattedDate, getFormattedTimeAgo } from '../../lib/utils/time-utils';
import { isPostPageView } from '../../lib/utils/view-utils';
import useIsMobile from '../../hooks/use-is-mobile';
import useStateString from '../../hooks/use-state-string';
import LoadingEllipsis from '../../components/loading-ellipsis';
import ReplyQuotePreview from '../../components/reply-quote-preview';
import Markdown from '../../components/markdown';
import Tooltip from '../../components/tooltip';
import styles from '../../views/post/post.module.css';
import _ from 'lodash';

const CommentContent = ({ comment: post }: { comment: Comment }) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const isInPostView = isPostPageView(location.pathname, params);
  const [showOriginal, setShowOriginal] = useState(false);
  const isMobile = useIsMobile();

  // TODO: commentAuthor is not yet available outside of editedComment, wait for API to be updated
  const { cid, content, deleted, edit, original, parentCid, postCid, reason, removed, state } = post || {};
  // const banned = !!post?.commentAuthor?.banExpiresAt;

  const [showFullComment, setShowFullComment] = useState(false);
  const displayContent =
    content &&
    (!isInPostView && content.length > 1000 && !showFullComment
      ? content.slice(0, 1000)
      : isInPostView && content.length > 2000 && !showFullComment
      ? content.slice(0, 2000)
      : content);

  const quotelinkReply = useSubplebbitsPagesStore((state) => state.comments[parentCid]);

  const isReply = !!parentCid;
  const isReplyingToReply = isReply && parentCid !== postCid;

  const stateString = useStateString(post);

  const loadingString = <div className={styles.stateString}>{stateString !== 'Failed' ? <LoadingEllipsis string={stateString || t('loading')} /> : stateString}</div>;

  return (
    <blockquote className={`${styles.postMessage} ${!isReply && isMobile && styles.clampLines}`}>
      {isReply && state !== 'failed' && isReplyingToReply && !(deleted || removed) && <ReplyQuotePreview isQuotelinkReply={true} quotelinkReply={quotelinkReply} />}
      {removed ? (
        reason ? (
          <>
            <span className={styles.redEditMessage}>({t('this_post_was_removed')})</span>
            <br />
            <br />
            <span className={styles.grayEditMessage}>{`${_.capitalize(t('reason'))}: "${reason}"`}</span>
          </>
        ) : (
          <span className={styles.grayEditMessage}>{_.capitalize(t('this_post_was_removed'))}.</span>
        )
      ) : deleted ? (
        reason ? (
          <>
            <span className={styles.grayEditMessage}>{t('user_deleted_this_post')}</span>{' '}
            <span className={styles.grayEditMessage}>{`${_.capitalize(t('reason'))}: "${reason}"`}</span>
          </>
        ) : (
          <span className={styles.grayEditMessage}>{t('user_deleted_this_post')}</span>
        )
      ) : (
        <>
          {!showOriginal && <Markdown content={displayContent} />}
          {((!isInPostView && content?.length > 1000 && !showFullComment) || (isInPostView && content?.length > 2000 && !showFullComment)) && (
            <span className={styles.abbr}>
              <br />
              <br />
              <Trans i18nKey={'comment_too_long'} shouldUnescape={true} components={{ 1: <span key={cid} onClick={() => setShowFullComment(true)} /> }} />
            </span>
          )}
          {edit && original?.content !== content && (
            <span className={styles.editedInfo}>
              {showOriginal && <Markdown content={original?.content} />}
              <br />
              <br />
              <Trans
                i18nKey={'comment_edited_at_timestamp'}
                values={{ timestamp: getFormattedDate(edit?.timestamp) }}
                shouldUnescape={true}
                components={{
                  1: <Tooltip key={edit?.timestamp} content={getFormattedTimeAgo(edit?.timestamp)} children={<Fragment key={edit?.timestamp}></Fragment>} />,
                }}
              />{' '}
              {reason && <>{t('reason_reason', { reason: reason, interpolation: { escapeValue: false } })} </>}
              {showOriginal ? (
                <Trans
                  i18nKey={'click_here_to_hide_original'}
                  shouldUnescape={true}
                  components={{ 1: <span key={cid} className={styles.showOriginal} onClick={() => setShowOriginal(!showOriginal)} /> }}
                />
              ) : (
                <Trans
                  i18nKey={'click_here_to_show_original'}
                  shouldUnescape={true}
                  components={{ 1: <span key={cid} className={styles.showOriginal} onClick={() => setShowOriginal(!showOriginal)} /> }}
                />
              )}
            </span>
          )}
        </>
      )}
      {/* TODO: commentAuthor is not yet available outside of editedComment, wait for API to be updated */}
      {/* {banned && (
        <span className={styles.removedContent}>
          <br />
          <br />
          <Tooltip
            children={`(${t('user_banned')})`}
            content={`${t('ban_expires_at', {
              address: subplebbitAddress && Plebbit.getShortAddress(subplebbitAddress),
              timestamp: getFormattedDate(commentAuthor?.banExpiresAt),
              interpolation: { escapeValue: false },
            })}${reason ? `. ${_.capitalize(t('reason'))}: "${reason}"` : ''}`}
          />
        </span>
      )} */}
      {!cid && state === 'pending' && stateString !== 'Failed' && (
        <>
          <br />
          <br />
          {loadingString}
        </>
      )}
    </blockquote>
  );
};

export default CommentContent;
