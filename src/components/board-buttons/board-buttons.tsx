import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAccountComment, useSubscribe } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import useSubplebbitsPagesStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits-pages';
import { isAllView, isCatalogView, isDescriptionView, isModView, isPendingPostView, isPostPageView, isSubscriptionsView } from '../../lib/utils/view-utils';
import { useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { getBoardPath } from '../../lib/utils/route-utils';
import { useResolvedSubplebbitAddress } from '../../hooks/use-resolved-subplebbit-address';
import useCatalogFiltersStore from '../../stores/use-catalog-filters-store';
import useCatalogStyleStore from '../../stores/use-catalog-style-store';
import useFeedResetStore from '../../stores/use-feed-reset-store';
import useSortingStore from '../../stores/use-sorting-store';
import useCountLinksInReplies from '../../hooks/use-count-links-in-replies';
import useIsMobile from '../../hooks/use-is-mobile';
import useTimeFilter from '../../hooks/use-time-filter';
import CatalogFilters from '../catalog-filters';
import CatalogSearch from '../catalog-search';
import Tooltip from '../tooltip';
import styles from './board-buttons.module.css';
import _ from 'lodash';

interface BoardButtonsProps {
  address?: string | undefined;
  isInAllView?: boolean;
  isInCatalogView?: boolean;
  isInSubscriptionsView?: boolean;
  isInModView?: boolean;
  isTopbar?: boolean;
}

const CatalogButton = ({ address, isInAllView, isInSubscriptionsView, isInModView }: BoardButtonsProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const defaultSubplebbits = useDefaultSubplebbits();

  const createCatalogLink = () => {
    if (isInAllView) {
      if (params?.timeFilterName) return `/all/catalog/${params.timeFilterName}`;
      return `/all/catalog`;
    } else if (isInSubscriptionsView) {
      if (params?.timeFilterName) return `/subscriptions/catalog/${params.timeFilterName}`;
      return `/subscriptions/catalog`;
    } else if (isInModView) {
      if (params?.timeFilterName) return `/mod/catalog/${params.timeFilterName}`;
      return `/mod/catalog`;
    }
    const boardPath = address ? getBoardPath(address, defaultSubplebbits) : address;
    return `/${boardPath}/catalog`;
  };

  return (
    <button className='button'>
      <Link to={createCatalogLink()}>{t('catalog')}</Link>
    </button>
  );
};

const SubscribeButton = ({ address }: BoardButtonsProps) => {
  const { t } = useTranslation();
  const { subscribed, subscribe, unsubscribe } = useSubscribe({ subplebbitAddress: address });

  return (
    <button className='button' onClick={subscribed ? unsubscribe : subscribe}>
      {subscribed ? t('unsubscribe') : t('subscribe')}
    </button>
  );
};

const ReturnButton = ({ address, isInAllView, isInSubscriptionsView, isInModView }: BoardButtonsProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const defaultSubplebbits = useDefaultSubplebbits();

  const createReturnLink = () => {
    if (isInAllView) {
      if (params?.timeFilterName) return `/all/${params.timeFilterName}`;
      return `/all`;
    } else if (isInSubscriptionsView) {
      if (params?.timeFilterName) return `/subscriptions/${params.timeFilterName}`;
      return `/subscriptions`;
    } else if (isInModView) {
      if (params?.timeFilterName) return `/mod/${params.timeFilterName}`;
      return `/mod`;
    }
    const boardPath = address ? getBoardPath(address, defaultSubplebbits) : address;
    return `/${boardPath}`;
  };

  return (
    <button className='button'>
      <Link to={createReturnLink()}>{t('return')}</Link>
    </button>
  );
};

const RefreshButton = () => {
  const { t } = useTranslation();
  const reset = useFeedResetStore((state) => state.reset);
  return (
    <button className='button' onClick={() => reset && reset()}>
      {t('refresh')}
    </button>
  );
};

const UpdateButton = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const handleManualUpdate = () => {
    window.alert('Manual updates are not available yet. Posts update automatically every ~2 minutes.');
  };

  return (
    <>
      {/* TODO: Implement update button once available in API  */}
      {isMobile ? (
        <button className={`button ${styles.disabledButton}`} onClick={handleManualUpdate}>
          {t('update')}
        </button>
      ) : (
        <button className={`button ${styles.disabledButton}`} onClick={handleManualUpdate}>
          {t('update')}
        </button>
      )}
    </>
  );
};

const AutoButton = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const handleManualUpdate = () => {
    window.alert('Manual updates are not available yet. Posts update automatically every ~2 minutes.');
  };

  return (
    <>
      {isMobile ? (
        <button className='button' onClick={handleManualUpdate}>
          <label>
            <input type='checkbox' className={styles.autoCheckbox} checked disabled />
            {t('Auto')}
          </label>
        </button>
      ) : (
        <label onClick={handleManualUpdate}>
          {' '}
          <input type='checkbox' className={styles.autoCheckbox} checked disabled /> {t('Auto')}
        </label>
      )}
    </>
  );
};

const SortOptions = () => {
  const { t } = useTranslation();
  const { sortType, setSortType } = useSortingStore();

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as 'active' | 'new';
    setSortType(type);
  };
  return (
    <>
      <span>{t('sort_by')}</span>:&nbsp;
      <select className='capitalize' value={sortType} onChange={handleSortChange}>
        <option value='active'>{t('bump_order')}</option>
        <option value='new'>{t('creation_date')}</option>
      </select>
    </>
  );
};

const ImageSizeOptions = () => {
  const { t } = useTranslation();
  const { imageSize, setImageSize } = useCatalogStyleStore();

  return (
    <>
      <span>{t('image_size')}:</span>&nbsp;
      <select className='capitalize' value={imageSize} onChange={(e) => setImageSize(e.target.value as 'Small' | 'Large')}>
        <option value='Small'>{t('small')}</option>
        <option value='Large'>{t('large')}</option>
      </select>
    </>
  );
};

const ShowOPCommentOption = () => {
  const { t } = useTranslation();
  const { showOPComment, setShowOPComment } = useCatalogStyleStore();

  return (
    <>
      <span>{t('show_op_comment')}:</span>&nbsp;
      <select className='capitalize' value={showOPComment ? 'On' : 'Off'} onChange={(e) => setShowOPComment(e.target.value === 'On')}>
        <option value='Off'>{t('off')}</option>
        <option value='On'>{t('on')}</option>
      </select>
    </>
  );
};

export const TimeFilter = ({ isInAllView, isInCatalogView, isInSubscriptionsView, isInModView, isTopbar = false }: BoardButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { timeFilterName, timeFilterNames } = useTimeFilter();

  const changeTimeFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const timeFilterName = event.target.value;
    const link = isInAllView
      ? isInCatalogView
        ? `/all/catalog/${timeFilterName}`
        : `/all/${timeFilterName}`
      : isInSubscriptionsView
      ? isInCatalogView
        ? `/subscriptions/catalog/${timeFilterName}`
        : `/subscriptions/${timeFilterName}`
      : isInModView
      ? isInCatalogView
        ? `/mod/catalog/${timeFilterName}`
        : `/mod/${timeFilterName}`
      : null;
    link && navigate(link);
  };

  const { sortType } = useSortingStore();

  const allTimeFilterNames = timeFilterName ? Array.from(new Set([timeFilterName, ...timeFilterNames])) : timeFilterNames;

  return (
    <>
      {!isTopbar ? (
        <>
          <span>{isInCatalogView ? (sortType === 'active' ? t('last_bumped') : t('newer_than')) : t('last_bumped')}</span>:&nbsp;
        </>
      ) : (
        <> </>
      )}
      <select onChange={changeTimeFilter} className={[styles.feedName, styles.menuItem, 'capitalize'].join(' ')} value={timeFilterName}>
        {allTimeFilterNames.map((name, i) => (
          <option key={name + i} value={name}>
            {name}
          </option>
        ))}
      </select>
    </>
  );
};

export const MobileBoardButtons = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const isInAllView = isAllView(location.pathname);
  const isInCatalogView = isCatalogView(location.pathname, params);
  const isInPendingPostPage = isPendingPostView(location.pathname, params);
  const isInPostView = isPostPageView(location.pathname, params);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());
  const isInModView = isModView(location.pathname);

  const accountComment = useAccountComment({ commentIndex: params?.accountCommentIndex as any });
  const resolvedAddress = useResolvedSubplebbitAddress();
  const subplebbitAddress = resolvedAddress || accountComment?.subplebbitAddress;

  const { filteredCount, searchText } = useCatalogFiltersStore();

  return (
    <div className={`${styles.mobileBoardButtons} ${!isInCatalogView ? styles.addMargin : ''}`}>
      {isInPostView || isInPendingPostPage ? (
        <>
          <ReturnButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />
          <CatalogButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />
          <SubscribeButton address={subplebbitAddress} />
          <div className={styles.secondRow}>
            <UpdateButton />
            <AutoButton />
          </div>
        </>
      ) : (
        <>
          {isInCatalogView ? (
            <ReturnButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />
          ) : (
            <CatalogButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />
          )}
          {!(isInAllView || isInSubscriptionsView || isInModView) && <SubscribeButton address={subplebbitAddress} />}
          <RefreshButton />
          {isInCatalogView && searchText ? (
            <span className={styles.filteredThreadsCount}>
              {' '}
              — {t('search_results_for')}: <strong>{searchText}</strong>
            </span>
          ) : (
            isInCatalogView &&
            filteredCount > 0 && (
              <span className={styles.filteredThreadsCount}>
                {' '}
                — {t('filtered_threads')}: <strong>{filteredCount}</strong>
              </span>
            )
          )}
          {isInCatalogView && (
            <>
              <hr />
              <div className={styles.options}>
                <div>
                  <SortOptions /> <ImageSizeOptions />
                </div>
                <div className={styles.mobileCatalogOptionsPadding}>
                  <ShowOPCommentOption /> <CatalogFilters /> <CatalogSearch />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const PostPageStats = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const isInDescriptionView = isDescriptionView(location.pathname, params);
  const resolvedAddress = useResolvedSubplebbitAddress();

  const comment = useSubplebbitsPagesStore((state) => state.comments[params?.commentCid as string]);
  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[resolvedAddress as string]);

  const descriptionReplyCount = location?.pathname.startsWith('/all/') ? 0 : subplebbit?.rules?.length > 0 ? 1 : 0;
  const { closed, pinned, replyCount } = comment || {};
  const linkCount = useCountLinksInReplies(comment);

  const displayReplyCount = replyCount !== undefined ? replyCount.toString() : isInDescriptionView ? descriptionReplyCount : '?';
  const replyCountTooltip = replyCount !== undefined || isInDescriptionView ? _.capitalize(t('replies')) : t('loading');

  return (
    <span>
      {(pinned || isInDescriptionView) && `${_.capitalize(t('sticky'))} / `}
      {(closed || isInDescriptionView) && `${_.capitalize(t('closed'))} / `}
      <Tooltip children={displayReplyCount} content={replyCountTooltip} /> / <Tooltip children={linkCount?.toString()} content={_.capitalize(t('links'))} />
    </span>
  );
};

export const DesktopBoardButtons = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const accountComment = useAccountComment({ commentIndex: params?.accountCommentIndex as any });
  const resolvedAddress = useResolvedSubplebbitAddress();
  const subplebbitAddress = resolvedAddress || accountComment?.subplebbitAddress;
  const isInCatalogView = isCatalogView(location.pathname, params);
  const isInAllView = isAllView(location.pathname);
  const isInPendingPostPage = isPendingPostView(location.pathname, params);
  const isInPostView = isPostPageView(location.pathname, params);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());
  const isInModView = isModView(location.pathname);

  const { filteredCount, searchText } = useCatalogFiltersStore();

  return (
    <>
      <hr />
      <div className={styles.desktopBoardButtons}>
        {isInPostView || isInPendingPostPage ? (
          <>
            [
            <ReturnButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />
            ] [
            <CatalogButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />] [
            <UpdateButton />
            ] [
            <AutoButton />]
            <span className={styles.rightSideButtons}>
              <PostPageStats />
            </span>
          </>
        ) : (
          <>
            {isInCatalogView ? (
              <>
                [
                <ReturnButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />]{' '}
              </>
            ) : (
              <>
                <SearchOPsBar />
                [
                <CatalogButton address={subplebbitAddress} isInAllView={isInAllView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />]{' '}
              </>
            )}
            [<RefreshButton />]
            {isInCatalogView && searchText ? (
              <span className={styles.filteredThreadsCount}>
                {' '}
                — {t('search_results_for')}: <strong>{searchText}</strong>
              </span>
            ) : (
              isInCatalogView &&
              filteredCount > 0 && (
                <span className={styles.filteredThreadsCount}>
                  {' '}
                  — {t('filtered_threads')}: <strong>{filteredCount}</strong>
                </span>
              )
            )}
            <span className={styles.rightSideButtons}>
              {isInCatalogView && (
                <>
                  <SortOptions />
                  <ImageSizeOptions />
                  <ShowOPCommentOption />
                </>
              )}
              {(isInAllView || isInSubscriptionsView || isInModView) && (
                <TimeFilter isInAllView={isInAllView} isInCatalogView={isInCatalogView} isInSubscriptionsView={isInSubscriptionsView} isInModView={isInModView} />
              )}
              {!(isInAllView || isInSubscriptionsView || isInModView) && (
                <>
                  [
                  <SubscribeButton address={subplebbitAddress} />]
                </>
              )}{' '}
              {isInCatalogView && (
                <>
                  [<CatalogFilters />] <CatalogSearch />
                </>
              )}
            </span>
          </>
        )}
      </div>
    </>
  );
};

const SearchOPsBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const isInAllView = isAllView(location.pathname);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());
  const isInModView = isModView(location.pathname);
  const defaultSubplebbits = useDefaultSubplebbits();
  const resolvedAddress = useResolvedSubplebbitAddress();
  const boardPath = resolvedAddress ? getBoardPath(resolvedAddress, defaultSubplebbits) : params?.boardIdentifier || params?.subplebbitAddress;

  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const searchQuery = (event.target as HTMLInputElement).value.trim();
      if (searchQuery) {
        let catalogUrl = '';

        if (isInAllView) {
          catalogUrl = params?.timeFilterName
            ? `/all/catalog/${params.timeFilterName}?q=${encodeURIComponent(searchQuery)}`
            : `/all/catalog?q=${encodeURIComponent(searchQuery)}`;
        } else if (isInSubscriptionsView) {
          catalogUrl = params?.timeFilterName
            ? `/subscriptions/catalog/${params.timeFilterName}?q=${encodeURIComponent(searchQuery)}`
            : `/subscriptions/catalog?q=${encodeURIComponent(searchQuery)}`;
        } else if (isInModView) {
          catalogUrl = params?.timeFilterName
            ? `/mod/catalog/${params.timeFilterName}?q=${encodeURIComponent(searchQuery)}`
            : `/mod/catalog?q=${encodeURIComponent(searchQuery)}`;
        } else {
          catalogUrl = `/${boardPath}/catalog?q=${encodeURIComponent(searchQuery)}`;
        }

        navigate(catalogUrl);
      }
    }
  };

  return <input type='text' placeholder={t('search_ops_placeholder', 'Search OPs...')} onKeyDown={handleSearch} className={styles.searchOPsInput} />;
};
