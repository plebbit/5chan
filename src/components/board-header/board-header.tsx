import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAccount, useAccountComment } from '@plebbit/plebbit-react-hooks';
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
  const navigate = useNavigate();
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

  const account = useAccount() || {};
  const subscriptions = account?.subscriptions || [];
  const subscriptionsSubtitle = subscriptions?.length === 1 ? `${subscriptions?.length} subscription` : `${subscriptions?.length} subscriptions`;

  const title = isInAllView
    ? multisubMetadata?.title || '/all/ - 5chan Directories'
    : isInSubscriptionsView
    ? '/subs/ - Subscriptions'
    : isInModView
    ? _.startCase(t('boards_you_moderate'))
    : defaultSubplebbit?.title || subplebbit?.title;
  const subtitle = isInAllView ? '' : isInSubscriptionsView ? subscriptionsSubtitle : isInModView ? '/mod/' : `${address || subplebbitAddress || ''}`;

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
      <div
        className={`${styles.boardSubtitle} ${isInSubscriptionsView ? styles.clickableSubtitle : ''}`}
        onClick={isInSubscriptionsView ? () => navigate('/subs/settings#subscriptions-settings') : undefined}
      >
        {subtitle}
      </div>
      <hr />
    </div>
  );
};

export default BoardHeader;
