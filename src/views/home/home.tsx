import { useEffect, useMemo, useRef, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useSubplebbits } from '@plebbit/plebbit-react-hooks';
import styles from './home.module.css';
import { useDefaultSubplebbits, useDefaultSubplebbitAddresses } from '../../hooks/use-default-subplebbits';
import useSubplebbitsStats from '../../hooks/use-subplebbits-stats';
import PopularThreadsBox from './popular-threads-box';
import BoardsList from './boards-list';
import Version from '../../components/version';
import useDisclaimerModalStore from '../../stores/use-disclaimer-modal-store';
import useDirectoryModalStore from '../../stores/use-directory-modal-store';
import DisclaimerModal from '../../components/disclaimer-modal';
import DirectoryModal from '../../components/directory-modal';
import _ from 'lodash';

// https://github.com/plebbit/lists/blob/master/5chan-multisub.json

const SearchBar = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showDisclaimerModal } = useDisclaimerModalStore();

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const searchInput = searchInputRef.current?.value;
    if (searchInput) {
      showDisclaimerModal(searchInput, navigate);
    }
  };

  return (
    <div className={styles.searchBar}>
      <form onSubmit={handleSearchSubmit}>
        <input
          autoCorrect='off'
          autoComplete='off'
          spellCheck='false'
          autoCapitalize='off'
          type='text'
          placeholder={_.lowerCase(t('enter_board_address'))}
          ref={searchInputRef}
        />
        <button className={styles.searchButton}>{t('go')}</button>
      </form>
    </div>
  );
};

const InfoBox = () => {
  const { t } = useTranslation();
  return (
    <div className={`${styles.box} ${styles.infoBox}`}>
      <div className={styles.infoboxBar}>
        <h2>{t('what_is_5chan')}</h2>
      </div>
      <div className={styles.boxContent}>
        <Trans
          i18nKey='5chan_description'
          shouldUnescape={true}
          components={{
            1: <Link key='rules-link' to='/rules' />,
            2: <Link key='faqs-link' to='/faq' />,
          }}
        />
        <br />
        <br />
        {t('no_global_rules_info')}
      </div>
    </div>
  );
};

const Stats = ({ subplebbitAddresses }: { subplebbitAddresses: string[] }) => {
  const { t } = useTranslation();
  const stats = useSubplebbitsStats({ subplebbitAddresses });

  const allStatsLoaded = useMemo(() => {
    return subplebbitAddresses.every((address) => stats[address]);
  }, [stats, subplebbitAddresses]);

  const { totalPosts, currentUsers } = useMemo(() => {
    let totalPosts = 0;
    let currentUsers = 0;

    if (allStatsLoaded) {
      Object.values(stats).forEach((stat: any) => {
        totalPosts += stat.allPostCount || 0;
        currentUsers += stat.weekActiveUserCount || 0;
      });
    }

    return { totalPosts, currentUsers };
  }, [stats, allStatsLoaded]);

  const boardsTracked = Object.values(stats).filter((stat: any) => stat && !stat.loading).length;

  return (
    <div className={styles.box}>
      <div className={`${styles.boxBar} ${styles.color2ColorBar}`}>
        <h2 className='capitalize'>{t('stats')}</h2>
      </div>
      <div className={`${styles.boxContent} ${styles.stats}`}>
        <div className={styles.stat}>
          <b>{t('total_posts')}</b> {totalPosts}
        </div>
        <div className={styles.stat}>
          <b>{t('current_users')}</b> {currentUsers}
        </div>
        <div className={styles.stat}>
          <b>{t('boards_tracked')}</b> {boardsTracked}
        </div>
      </div>
    </div>
  );
};

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <>
      <ul className={styles.footer}>
        <li>
          <a href='https://github.com/plebbit/5chan/blob/master/README.md' target='_blank' rel='noopener noreferrer'>
            {t('about')}
          </a>
        </li>
        <li>
          <a href='https://t.me/fivechandev' target='_blank' rel='noopener noreferrer'>
            {t('updates')}
          </a>
        </li>
        <li>
          <Link to='/faq'>FAQ</Link>
        </li>
        <li>
          <Link to='/rules'>Rules</Link>
        </li>
        <li>
          <a href='https://t.me/plebbit' target='_blank' rel='noopener noreferrer'>
            Telegram
          </a>
        </li>
        <li>
          <a href='https://github.com/plebbit/5chan' target='_blank' rel='noopener noreferrer'>
            GitHub
          </a>
        </li>
        <li>
          <a href='https://etherscan.io/token/0xEA81DaB2e0EcBc6B5c4172DE4c22B6Ef6E55Bd8f' target='_blank' rel='noopener noreferrer'>
            {t('token')}
          </a>
        </li>
        <li>
          <a href='https://github.com/plebbit/whitepaper/discussions/2' target='_blank' rel='noopener noreferrer'>
            {t('whitepaper')}
          </a>
        </li>
      </ul>
      <div className={styles.footerInfo}>
        <br />
        <Version /> •{' '}
        <a href='https://github.com/plebbit/5chan/issues/new' target='_blank' rel='noopener noreferrer'>
          Feedback
        </a>{' '}
        •{' '}
        <a href='https://github.com/plebbit/5chan/graphs/contributors' target='_blank' rel='noopener noreferrer'>
          Contact
        </a>
        <br />
        <br />
        <br />
        <span>5chan is free and open source software under GPLv2 license.</span>
      </div>
    </>
  );
};

export const HomeLogo = () => {
  return (
    <Link to='/'>
      <div className={styles.logo}>
        <img alt='' src='assets/logo/logo-transparent.png' />
      </div>
    </Link>
  );
};

const Home = () => {
  const defaultSubplebbits = useDefaultSubplebbits();
  const subplebbitAddresses = useDefaultSubplebbitAddresses();
  const { subplebbits } = useSubplebbits({ subplebbitAddresses });
  const { closeDirectoryModal } = useDirectoryModalStore();

  useEffect(() => {
    document.title = '5chan';
  }, []);

  // Close directory modal when navigating away from home
  useEffect(() => {
    return () => {
      closeDirectoryModal();
    };
  }, [closeDirectoryModal]);

  return (
    <>
      <DisclaimerModal />
      <DirectoryModal />
      <div className={styles.content}>
        <HomeLogo />
        <SearchBar />
        <InfoBox />
        <BoardsList multisub={defaultSubplebbits} />
        <PopularThreadsBox multisub={defaultSubplebbits} subplebbits={subplebbits} />
        <Stats subplebbitAddresses={subplebbitAddresses} />
        <Footer />
      </div>
    </>
  );
};

export default Home;
