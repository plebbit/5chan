import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Comment, useAuthorAvatar, useEditedComment } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import Plebbit from '@plebbit/plebbit-js';
import styles from '../../views/post/post.module.css';
import { CommentMediaInfo, getDisplayMediaInfoType, getHasThumbnail, getMediaDimensions } from '../../lib/utils/media-utils';
import { hashStringToColor, getTextColorForBackground } from '../../lib/utils/post-utils';
import { getFormattedDate, getFormattedTimeAgo } from '../../lib/utils/time-utils';
import { isValidURL } from '../../lib/utils/url-utils';
import { isAllView, isPendingPostView, isPostPageView, isSubscriptionsView } from '../../lib/utils/view-utils';
import { useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { getBoardPath } from '../../lib/utils/route-utils';
import useAvatarVisibilityStore from '../../stores/use-avatar-visibility-store';
import useAuthorAddressClick from '../../hooks/use-author-address-click';
import { useCommentMediaInfo } from '../../hooks/use-comment-media-info';
import useCountLinksInReplies from '../../hooks/use-count-links-in-replies';
import useFetchGifFirstFrame from '../../hooks/use-fetch-gif-first-frame';
import useHide from '../../hooks/use-hide';
import useReplies from '../../hooks/use-replies';
import useStateString from '../../hooks/use-state-string';
import CommentContent from '../comment-content';
import CommentMedia from '../comment-media';
import EditMenu from '../edit-menu/edit-menu';
import { canEmbed } from '../embed';
import LoadingEllipsis from '../loading-ellipsis';
import PostMenuDesktop from './post-menu-desktop';
import ReplyQuotePreview from '../reply-quote-preview';
import Tooltip from '../tooltip';
import { PostProps } from '../../views/post/post';
import { create } from 'zustand';
import _ from 'lodash';
import { shouldShowSnow } from '../../lib/snow';
import useReplyModalStore from '../../stores/use-reply-modal-store';

interface ShowOmittedRepliesState {
  showOmittedReplies: Record<string, boolean>;
  setShowOmittedReplies: (cid: string, showOmittedReplies: boolean) => void;
}

const useShowOmittedReplies = create<ShowOmittedRepliesState>((set) => ({
  showOmittedReplies: {},
  setShowOmittedReplies: (cid, showOmittedReplies) =>
    set((state) => ({
      showOmittedReplies: {
        ...state.showOmittedReplies,
        [cid]: showOmittedReplies,
      },
    })),
}));

const PostInfo = ({ post, postReplyCount = 0, roles, isHidden }: PostProps) => {
  const { t } = useTranslation();
  const { author, cid, deleted, locked, pinned, parentCid, postCid, reason, removed, shortCid, state, subplebbitAddress, timestamp } = post || {};
  const title = post?.title?.trim();
  const replies = useReplies(post);
  const { address, shortAddress } = author || {};
  const displayName = author?.displayName?.trim();
  const authorRole = roles?.[address]?.role;
  const { isDescription, isRules } = post || {}; // custom properties, not from api
  const stateString = useStateString(post);
  const isReply = parentCid;
  const { showOmittedReplies } = useShowOmittedReplies();
  const { imageUrl: avatarImageUrl } = useAuthorAvatar({ author });
  const { hideAvatars } = useAvatarVisibilityStore();
  const defaultSubplebbits = useDefaultSubplebbits();
  const boardPath = subplebbitAddress ? getBoardPath(subplebbitAddress, defaultSubplebbits) : '';

  const params = useParams();
  const location = useLocation();
  const isInAllView = isAllView(location.pathname);
  const isInPostPageView = isPostPageView(location.pathname, params);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, params);

  const userID = address && Plebbit.getShortAddress(address);
  const userIDBackgroundColor = hashStringToColor(userID);
  const userIDTextColor = getTextColorForBackground(userIDBackgroundColor);

  const handleUserAddressClick = useAuthorAddressClick();
  const numberOfPostsByAuthor = document.querySelectorAll(`[data-author-address="${shortAddress}"][data-post-cid="${postCid}"]`).length;

  const { hidden } = useHide(post);

  const { openReplyModal } = useReplyModalStore();

  const onReplyModalClick = () => {
    deleted
      ? isReply
        ? alert(t('this_reply_was_deleted'))
        : alert(t('this_thread_was_deleted'))
      : removed
      ? isReply
        ? alert(t('this_reply_was_removed'))
        : alert(t('this_thread_was_removed'))
      : openReplyModal && openReplyModal(cid, postCid, subplebbitAddress);
  };

  return (
    <div className={styles.postInfo}>
      {isHidden ? parentCid && <span className={styles.hiddenReplyEditMenuSpacer} /> : <EditMenu post={post} />}
      <span className={(hidden || ((removed || deleted) && !reason)) && parentCid ? styles.postDesktopHidden : ''}>
        {title &&
          (title.length <= 75 ? (
            <span className={styles.subject}>{title} </span>
          ) : (
            <Tooltip
              children={<span className={styles.subject}>{title.slice(0, 75) + '(...)'} </span>}
              content={title.length < 1000 ? title : title.slice(0, 1000) + `... ${t('title_too_long')}`}
            />
          ))}
        <span className={styles.nameBlock}>
          <span className={`${styles.name} ${(isDescription || isRules || authorRole) && !(deleted || removed) && styles.capcodeMod}`}>
            {deleted ? (
              _.capitalize(t('deleted'))
            ) : removed ? (
              _.capitalize(t('removed'))
            ) : displayName ? (
              displayName.length <= 20 ? (
                displayName
              ) : (
                <Tooltip
                  children={displayName.slice(0, 20) + '(...)'}
                  content={displayName.length < 1000 ? displayName : displayName.slice(0, 1000) + `... ${t('display_name_too_long')}`}
                />
              )
            ) : (
              _.capitalize(t('anonymous'))
            )}
            {!(deleted || removed) && <span className='capitalize'>{authorRole && ` ## Board ${authorRole}`} </span>}
          </span>
          {!(isDescription || isRules) && (
            <>
              {author?.avatar && !(deleted || removed) && !hideAvatars && avatarImageUrl ? (
                <span className={styles.authorAvatar}>
                  <img src={avatarImageUrl} alt='' />
                </span>
              ) : null}
              (ID:{' '}
              {deleted ? (
                t('deleted')
              ) : removed ? (
                t('removed')
              ) : (
                <Tooltip
                  children={
                    <span
                      title={t('highlight_posts')}
                      className={styles.userAddress}
                      onClick={() => handleUserAddressClick(userID, postCid)}
                      style={{ backgroundColor: userIDBackgroundColor, color: userIDTextColor }}
                    >
                      {userID}
                    </span>
                  }
                  content={`${numberOfPostsByAuthor === 1 ? t('1_post_by_this_id') : t('x_posts_by_this_id', { number: numberOfPostsByAuthor })}`}
                  showTooltip={isInPostPageView || showOmittedReplies[postCid] || (postReplyCount < 6 && !pinned)}
                />
              )}
              ){' '}
            </>
          )}
        </span>
        <span className={styles.dateTime}>
          <Tooltip children={<span>{getFormattedDate(timestamp)}</span>} content={getFormattedTimeAgo(timestamp)} />
          {isDescription || isRules ? '' : ' '}
        </span>
        <span className={styles.postNum}>
          {subplebbitAddress && (isInAllView || isInSubscriptionsView) && !isReply && (
            <span className={styles.postNumLink}>
              {' '}
              <Link to={`/${boardPath}`}>p/{subplebbitAddress && Plebbit.getShortAddress(subplebbitAddress)}</Link>{' '}
            </span>
          )}
          {!(isDescription || isRules) &&
            (cid ? (
              <span className={styles.postNumLink}>
                <Link to={`/${boardPath}/thread/${cid}`} className={styles.linkToPost} title={t('link_to_post')} onClick={(e) => !cid && e.preventDefault()}>
                  c/
                </Link>
                <span className={styles.replyToPost} title={t('reply_to_post')} onMouseDown={onReplyModalClick}>
                  {shortCid}
                </span>
              </span>
            ) : (
              <>
                <span>c/</span>
                <span className={styles.pendingCid}>
                  {state === 'failed' || stateString === 'Failed' ? _.capitalize(t('failed')) : state === 'pending' ? _.capitalize(t('pending')) : ''}
                </span>
              </>
            ))}
          {pinned && (
            <span className={`${styles.stickyIconWrapper} ${!locked && styles.addPaddingBeforeReply}`}>
              <img src='assets/icons/sticky.gif' alt='' className={styles.stickyIcon} title={t('sticky')} />
            </span>
          )}
          {locked && (
            <span className={`${styles.closedIconWrapper} ${styles.addPaddingBeforeReply} ${pinned && styles.addPaddingInBetween}`}>
              <img src='assets/icons/closed.gif' alt='' className={styles.closedIcon} title={t('closed')} />
            </span>
          )}
          {!isInPostPageView && !isReply && !isHidden && (
            <span className={styles.replyButton}>
              [
              <Link
                to={isInAllView && isDescription ? '/all/description' : `/${boardPath}/${isDescription ? 'description' : isRules ? 'rules' : `thread/${postCid}`}`}
                onClick={(e) => !cid && !isDescription && !isRules && e.preventDefault()}
              >
                {_.capitalize(t('reply'))}
              </Link>
              ]
            </span>
          )}
        </span>
        {!(removed || deleted) && <PostMenuDesktop post={post} />}
        {cid &&
          parentCid &&
          replies &&
          replies.map(
            (reply: Comment, index: number) =>
              reply?.parentCid === cid &&
              reply?.cid &&
              !(reply?.deleted || reply?.removed) && <ReplyQuotePreview key={index} isBacklinkReply={true} backlinkReply={reply} />,
          )}
      </span>
    </div>
  );
};

interface PostMediaProps {
  commentMediaInfo: CommentMediaInfo | undefined;
  hasThumbnail: boolean;
  isDescription: boolean;
  isRules: boolean;
  spoiler: boolean;
  deleted: boolean;
  removed: boolean;
  linkHeight: number;
  linkWidth: number;
  parentCid: string;
}

const PostMedia = ({ commentMediaInfo, hasThumbnail, isDescription, isRules, spoiler, deleted, removed, linkHeight, linkWidth, parentCid }: PostMediaProps) => {
  const { t } = useTranslation();
  const { url } = commentMediaInfo || {};
  let type = commentMediaInfo?.type;
  const gifFrameUrl = useFetchGifFirstFrame(url);

  if (type === 'gif' && gifFrameUrl !== null) {
    type = 'animated gif';
  } else if (type === 'gif' && gifFrameUrl === null) {
    type = 'static gif';
  }

  const embedUrl = url && new URL(url);
  const [showThumbnail, setShowThumbnail] = useState(true);

  const mediaDimensions = getMediaDimensions(commentMediaInfo);

  return (
    <div className={styles.file}>
      <div className={styles.fileText}>
        {t('link')}:{' '}
        <a href={url} target='_blank' rel='noopener noreferrer'>
          {spoiler ? _.capitalize(t('spoiler')) : url && url.length > 30 ? url.slice(0, 30) + '...' : url}
        </a>{' '}
        ({type && _.lowerCase(getDisplayMediaInfoType(type, t))}
        {mediaDimensions && `, ${mediaDimensions}`})
        {!showThumbnail && (type === 'iframe' || type === 'video' || type === 'audio') && (
          <span>
            -[
            <span className={styles.closeMedia} onClick={() => setShowThumbnail(true)}>
              {t('close')}
            </span>
            ]
          </span>
        )}
        {showThumbnail && !hasThumbnail && embedUrl && canEmbed(embedUrl) && (
          <span>
            -[
            <span className={styles.closeMedia} onClick={() => setShowThumbnail(false)}>
              {t('open')}
            </span>
            ]
          </span>
        )}
      </div>
      {(hasThumbnail || (!hasThumbnail && !showThumbnail) || spoiler) && (
        <div className={styles.fileThumbnail}>
          <CommentMedia
            commentMediaInfo={commentMediaInfo}
            deleted={deleted}
            isDescription={isDescription}
            isRules={isRules}
            removed={removed}
            linkHeight={linkHeight}
            linkWidth={linkWidth}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            isOutOfFeed={isDescription || isRules}
            parentCid={parentCid}
            spoiler={spoiler}
          />
        </div>
      )}
    </div>
  );
};

const Reply = ({ postReplyCount, reply, roles }: PostProps) => {
  let post = reply;
  // handle pending mod or author edit
  const { editedComment } = useEditedComment({ comment: reply });
  if (editedComment) {
    post = editedComment;
  }

  const { author, cid, deleted, link, linkHeight, linkWidth, postCid, reason, removed, spoiler, subplebbitAddress, thumbnailUrl, parentCid } = post || {};
  const { isDescription, isRules } = post || {}; // custom properties, not from api
  const defaultSubplebbits = useDefaultSubplebbits();
  const boardPath = subplebbitAddress ? getBoardPath(subplebbitAddress, defaultSubplebbits) : '';

  const isRouteLinkToReply = useLocation().pathname.startsWith(`/${boardPath}/thread/${cid}`);
  const { hidden } = useHide({ cid });

  const commentMediaInfo = useCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);
  const hasThumbnail = getHasThumbnail(commentMediaInfo, link);

  return (
    <div className={styles.replyDesktop}>
      <div className={styles.sideArrows}>{'>>'}</div>
      <div className={`${styles.reply} ${isRouteLinkToReply && styles.highlight}`} data-cid={cid} data-author-address={author?.shortAddress} data-post-cid={postCid}>
        <PostInfo post={post} postReplyCount={postReplyCount} roles={roles} isHidden={hidden} />
        {link && !hidden && !(deleted || removed) && isValidURL(link) && (
          <PostMedia
            commentMediaInfo={commentMediaInfo}
            hasThumbnail={hasThumbnail}
            isDescription={isDescription}
            isRules={isRules}
            spoiler={spoiler}
            deleted={deleted}
            removed={removed}
            linkHeight={linkHeight}
            linkWidth={linkWidth}
            parentCid={parentCid}
          />
        )}
        {!hidden && (!(removed || deleted) || ((removed || deleted) && reason)) && <CommentContent comment={post} />}
      </div>
    </div>
  );
};

const PostDesktop = ({ post, roles, showAllReplies, showReplies = true }: PostProps) => {
  const { t } = useTranslation();
  const { author, cid, content, deleted, link, linkHeight, linkWidth, pinned, postCid, removed, spoiler, state, subplebbitAddress, thumbnailUrl, parentCid } = post || {};
  const { isDescription, isRules } = post || {}; // custom properties, not from api
  const params = useParams();
  const location = useLocation();
  const isInPendingPostView = isPendingPostView(location.pathname, params);
  const isInPostPageView = isPostPageView(location.pathname, params);
  const defaultSubplebbits = useDefaultSubplebbits();
  const boardPath = subplebbitAddress ? getBoardPath(subplebbitAddress, defaultSubplebbits) : '';

  const { hidden, unhide, hide } = useHide({ cid });
  const isHidden = hidden && !isInPostPageView;

  const replies = useReplies(post);
  const visiblelinksCount = useCountLinksInReplies(post, 5);
  const totalLinksCount = useCountLinksInReplies(post);
  const replyCount = replies?.length;

  const repliesCount = pinned ? replyCount : replyCount - 5;
  const linksCount = pinned ? totalLinksCount : totalLinksCount - visiblelinksCount;
  const { showOmittedReplies, setShowOmittedReplies } = useShowOmittedReplies();

  const stateString = useStateString(post) || t('loading_board');

  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress]);

  const subplebbitRulesReply = {
    isRules: true,
    subplebbitAddress,
    timestamp: subplebbit?.createdAt,
    author: { displayName: `## ${t('board_mods')}` },
    content: `${subplebbit?.rules?.map((rule: string, index: number) => `${index + 1}. ${rule}`).join('\n')}`,
    replyCount: 0,
  };

  const commentMediaInfo = useCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);
  const hasThumbnail = getHasThumbnail(commentMediaInfo, link);

  return (
    <div className={styles.postDesktop}>
      {showReplies ? (
        <div className={styles.hrWrapper}>
          <hr />
        </div>
      ) : (
        <div className={styles.replyQuotePreviewSpacer} />
      )}
      <div className={isHidden ? styles.postDesktopHidden : ''}>
        {!isInPostPageView && !isDescription && !isRules && showReplies && (
          <span className={`${styles.hideButtonWrapper} ${!hasThumbnail ? styles.hideButtonWrapperNoImage : ''}`}>
            <span className={`${styles.hideButton} ${hidden ? styles.unhideThread : styles.hideThread}`} onClick={hidden ? unhide : hide} />
          </span>
        )}
        <div data-cid={cid} data-author-address={author?.shortAddress} data-post-cid={postCid} className={shouldShowSnow() && hasThumbnail ? styles.xmasHatWrapper : ''}>
          {shouldShowSnow() && hasThumbnail && <img src='assets/xmashat.gif' className={styles.xmasHat} alt='' />}
          {link && !isHidden && !(deleted || removed) && isValidURL(link) && (
            <PostMedia
              commentMediaInfo={commentMediaInfo}
              hasThumbnail={hasThumbnail}
              isDescription={isDescription}
              isRules={isRules}
              spoiler={spoiler}
              deleted={deleted}
              removed={removed}
              linkHeight={linkHeight}
              linkWidth={linkWidth}
              parentCid={parentCid}
            />
          )}
          <PostInfo isHidden={hidden} post={post} postReplyCount={replyCount} roles={roles} />
          {!isHidden && !content && !(deleted || removed) && <div className={styles.spacer} />}
          {!isHidden && <CommentContent comment={post} />}
        </div>
        {!isHidden && !isDescription && !isRules && !isInPendingPostView && (replyCount > 5 || (pinned && repliesCount > 0)) && !isInPostPageView && (
          <span className={styles.summary}>
            <span
              className={`${showOmittedReplies[cid] ? styles.hideOmittedReplies : styles.showOmittedReplies} ${styles.omittedRepliesButtonWrapper}`}
              onClick={() => setShowOmittedReplies(cid, !showOmittedReplies[cid])}
            />
            {showOmittedReplies[cid] ? (
              t('showing_all_replies')
            ) : linksCount > 0 ? (
              <Trans
                i18nKey={'replies_and_links_omitted'}
                shouldUnescape={true}
                components={{ 1: <Link key={cid} to={`/${boardPath}/thread/${cid}`} /> }}
                values={{ repliesCount, linksCount }}
              />
            ) : (
              <Trans
                i18nKey={'replies_omitted'}
                shouldUnescape={true}
                components={{ 1: <Link key={cid} to={`/${boardPath}/thread/${cid}`} /> }}
                values={{ repliesCount }}
              />
            )}
          </span>
        )}
        {!isHidden &&
          !(pinned && !isInPostPageView && !showOmittedReplies[cid]) &&
          !isInPendingPostView &&
          replies &&
          showReplies &&
          (showAllReplies || showOmittedReplies[cid] ? replies : replies.slice(-5))
            // Don't render deleted replies that have no children (replyCount = 0)
            .filter((reply) => !(reply.deleted && (reply.replyCount === 0 || !reply.replyCount)))
            .map((reply, index) => (
              <div key={index} className={styles.replyContainer}>
                <Reply reply={reply} roles={roles} postReplyCount={replyCount} />
              </div>
            ))}
        {isDescription && subplebbit?.rules && subplebbit?.rules.length > 0 && (
          <div className={styles.replyContainer}>
            <Reply reply={subplebbitRulesReply} />
          </div>
        )}
      </div>
      {!isInPendingPostView &&
      (!isDescription || (isDescription && !subplebbit?.updatedAt)) &&
      !isRules &&
      stateString &&
      stateString !== 'Failed' &&
      state !== 'succeeded' &&
      isInPostPageView &&
      !(!showReplies && !showAllReplies) ? (
        <div className={styles.stateString}>
          <br />
          <LoadingEllipsis string={stateString} />
        </div>
      ) : (
        state === 'failed' && <span className={styles.error}>{t('failed')}</span>
      )}
    </div>
  );
};

export default PostDesktop;
