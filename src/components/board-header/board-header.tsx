import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { useAccountComment } from '@plebbit/plebbit-react-hooks';
import Plebbit from '@plebbit/plebbit-js';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import { isAllView, isSubscriptionsView, isModView } from '../../lib/utils/view-utils';
import styles from './board-header.module.css';
import { useMultisubMetadata, useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { useResolvedSubplebbitAddress } from '../../hooks/use-resolved-subplebbit-address';
import useIsMobile from '../../hooks/use-is-mobile';
import useIsSubplebbitOffline from '../../hooks/use-is-subplebbit-offline';
import { shouldShowSnow } from '../../lib/snow';
import Tooltip from '../tooltip';
import _ from 'lodash';
import { BANNERS } from '../../generated/asset-manifest';

const ImageBanner = () => {
  const [banner] = useState(() => BANNERS[Math.floor(Math.random() * BANNERS.length)]);

  return <img src={banner} alt='' />;
};

const BoardHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const isInAllView = isAllView(location.pathname);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());
  const isInModView = isModView(location.pathname);
  const accountComment = useAccountComment({ commentIndex: params?.accountCommentIndex as any });
  const resolvedAddress = useResolvedSubplebbitAddress();
  const subplebbitAddress = resolvedAddress || accountComment?.subplebbitAddress;

  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress]);

  const { address, shortAddress } = subplebbit || {};

  const multisubMetadata = useMultisubMetadata();
  const defaultSubplebbits = useDefaultSubplebbits();

  // Find matching subplebbit from default list to get its title
  const defaultSubplebbit = subplebbitAddress ? defaultSubplebbits.find((s) => s.address === subplebbitAddress) : null;

  const title = isInAllView
    ? multisubMetadata?.title || 'all'
    : isInSubscriptionsView
    ? 'Subscriptions'
    : isInModView
    ? _.startCase(t('boards_you_moderate'))
    : defaultSubplebbit?.title || subplebbit?.title;
  const subtitle = isInAllView ? 'p/all' : isInSubscriptionsView ? 'p/subscriptions' : isInModView ? 'p/mod' : `p/${address || subplebbitAddress || ''}`;

  const { isOffline, isOnlineStatusLoading, offlineIconClass, offlineTitle } = useIsSubplebbitOffline(subplebbit);

  return (
    <div className={`${styles.content} ${shouldShowSnow() ? styles.garland : ''}`}>
      {!useIsMobile() && (
        <div className={styles.bannerCnt}>
          <ImageBanner key={isInAllView ? 'all' : isInSubscriptionsView ? 'subscriptions' : subplebbitAddress} />
        </div>
      )}
      <div className={styles.boardTitle}>
        {title ||
          (shortAddress
            ? shortAddress.endsWith('.eth') || shortAddress.endsWith('.sol')
              ? shortAddress.slice(0, -4)
              : shortAddress
            : subplebbitAddress && Plebbit.getShortAddress(subplebbitAddress))}
        {(isOffline || isOnlineStatusLoading) && !isInAllView && !isInSubscriptionsView && !isInModView && (
          <span className={styles.offlineIconWrapper}>
            <Tooltip content={offlineTitle}>
              <span className={`${styles.offlineIcon} ${offlineIconClass}`} />
            </Tooltip>
          </span>
        )}
      </div>
      <div className={styles.boardSubtitle}>{subtitle}</div>
      <hr />
    </div>
  );
};

export default BoardHeader;
