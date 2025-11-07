import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import { useDefaultSubplebbits } from '../../hooks/use-default-subplebbits';
import { getSubplebbitAddress } from '../../lib/utils/route-utils';
import { HomeLogo } from '../home';
import styles from './not-found.module.css';
import { NOT_FOUND_IMAGES } from '../../generated/asset-manifest';

const NotFoundImage = () => {
  const [imagePath] = useState(() => NOT_FOUND_IMAGES[Math.floor(Math.random() * NOT_FOUND_IMAGES.length)]);

  return <img src={imagePath} alt='' />;
};

const NotFound = () => {
  const location = useLocation();
  // Extract boardIdentifier from pathname (could be directory code or address)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const boardIdentifier = pathParts[0] && pathParts[0] !== 'not-found' && pathParts[0] !== 'faq' ? pathParts[0] : '';
  const defaultSubplebbits = useDefaultSubplebbits();
  const subplebbitAddress = boardIdentifier ? getSubplebbitAddress(boardIdentifier, defaultSubplebbits) : '';
  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress]);
  const { address, shortAddress } = subplebbit || {};

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <HomeLogo />
        <div className={styles.boxOuter}>
          <div className={styles.boxInner}>
            <div className={styles.boxBar}>
              <h2>404 Not Found</h2>
            </div>
            <div className={styles.boxContent}>
              <NotFoundImage />
              {address && (
                <>
                  <br />
                  <div className={styles.backToBoard}>
                    [<Link to={`/${boardIdentifier || subplebbitAddress}`}>Back to p/{shortAddress || subplebbitAddress}</Link>]
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
