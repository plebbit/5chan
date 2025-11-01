import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import { HomeLogo } from '../home';
import styles from './not-found.module.css';
import { NOT_FOUND_IMAGES } from '../../generated/asset-manifest';

const NotFoundImage = () => {
  const [imagePath] = useState(() => NOT_FOUND_IMAGES[Math.floor(Math.random() * NOT_FOUND_IMAGES.length)]);

  return <img src={imagePath} alt='' />;
};

const NotFound = () => {
  const location = useLocation();
  const subplebbitAddress = location.pathname.startsWith('/p/') ? location.pathname.split('/')[2] : '';
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
                    [<Link to={`/p/${subplebbitAddress}`}>Back to p/{shortAddress}</Link>]
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
