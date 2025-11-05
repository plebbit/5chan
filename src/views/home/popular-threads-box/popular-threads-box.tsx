import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Comment, Subplebbit } from '@plebbit/plebbit-react-hooks';
import styles from '../home.module.css';
import usePopularPosts from '../../../hooks/use-popular-posts';
import usePopularThreadsOptionsStore from '../../../stores/use-popular-threads-options-store';
import { getCommentMediaInfo } from '../../../lib/utils/media-utils';
import { CatalogPostMedia } from '../../../components/catalog-row';
import LoadingEllipsis from '../../../components/loading-ellipsis';
import BoxModal from '../box-modal';
import { MultisubSubplebbit } from '../../../hooks/use-default-subplebbits';
import { removeMarkdown } from '../../../lib/utils/post-utils';

interface PopularThreadProps {
  post: Comment;
  multisub: MultisubSubplebbit[];
}

export const ContentPreview = ({ content, maxLength = 99 }: { content: string; maxLength?: number }) => {
  const plainText = removeMarkdown(content).trim().replaceAll('&nbsp;', '').replace(/\n\n/g, '\n').replaceAll('\n\n', '');
  const truncatedText = plainText.length > maxLength ? `${plainText.substring(0, maxLength).trim()}...` : plainText;

  return truncatedText;
};

const PopularThreadCard = ({ post, multisub }: PopularThreadProps) => {
  const { cid, content, link, linkHeight, linkWidth, subplebbitAddress, thumbnailUrl, title } = post || {};
  const commentMediaInfo = getCommentMediaInfo(link, thumbnailUrl, linkWidth, linkHeight);

  // Find the matching MultisubSubplebbit entry and get its title
  const multisubEntry = multisub.find((ms) => ms?.address === subplebbitAddress);
  const boardTitle = multisubEntry?.title?.replace(/^\/[^/]+\/\s*-\s*/, '') || '';

  return (
    <div className={styles.popularThread} key={cid}>
      <div className={styles.title}>{boardTitle}</div>
      <div className={styles.mediaContainer}>
        <Link to={`/p/${subplebbitAddress}/c/${cid}`}>
          <CatalogPostMedia commentMediaInfo={commentMediaInfo} isOutOfFeed={true} cid={cid} />
        </Link>
      </div>
      <div className={styles.threadContent}>
        {title && (
          <>
            <b>{title.trim()}</b>
            {content && ': '}
          </>
        )}
        {content && <ContentPreview content={content} maxLength={99} />}
      </div>
    </div>
  );
};

const PopularThreadsBox = ({ multisub, subplebbits }: { multisub: MultisubSubplebbit[]; subplebbits: any }) => {
  const { t } = useTranslation();
  const { showWorksafeContentOnly, showNsfwContentOnly } = usePopularThreadsOptionsStore();

  const getFilteredSubplebbits = () => {
    if (showWorksafeContentOnly) {
      return subplebbits.filter((sub: Subplebbit) => {
        const multisubEntry = multisub.find((ms) => ms?.address === sub?.address);
        return multisubEntry ? !multisubEntry.nsfw : true;
      });
    }
    if (showNsfwContentOnly) {
      return subplebbits.filter((sub: Subplebbit) => {
        const multisubEntry = multisub.find((ms) => ms?.address === sub?.address);
        return multisubEntry ? multisubEntry.nsfw : false;
      });
    }
    return subplebbits;
  };

  const filteredSubplebbits = useMemo(getFilteredSubplebbits, [subplebbits, showWorksafeContentOnly, showNsfwContentOnly, multisub]);
  const { popularPosts } = usePopularPosts(filteredSubplebbits);

  return (
    <div className={styles.box}>
      <div className={`${styles.boxBar} ${styles.color2ColorBar}`}>
        <h2 className='capitalize'>{t('popular_threads')}</h2>
        <BoxModal />
      </div>
      <div className={`${styles.boxContent} ${popularPosts.length !== 0 ? styles.popularThreads : ''}`}>
        {popularPosts.length === 0 ? (
          <LoadingEllipsis string={t('loading')} />
        ) : (
          popularPosts.map((post: any) => <PopularThreadCard key={post.cid} post={post} multisub={multisub} />)
        )}
      </div>
    </div>
  );
};

export default PopularThreadsBox;
