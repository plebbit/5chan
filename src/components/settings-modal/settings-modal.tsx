import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './settings-modal.module.css';
import AccountSettings from './account-settings';
import AvatarSettings from './avatar-settings';
import BlockedAddressesSetting from './blocked-addresses-setting';
import CryptoAddressSetting from './crypto-address-setting';
import CryptoWalletsSetting from './crypto-wallets-setting';
import InterfaceSettings from './interface-settings';
import PlebbitOptions from './pkc-options';
import SubscriptionsSetting from './subscriptions-setting';

const SettingsModal = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const hash = location.hash.slice(1);

  const closeModal = useCallback(() => {
    const newPath = location.pathname.replace(/\/settings$/, '');
    navigate(newPath);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeModal]);

  const [showInterfaceSettings, setShowInterfaceSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAvatarSettings, setShowAvatarSettings] = useState(false);
  const [showCryptoAddressSetting, setShowCryptoAddressSetting] = useState(false);
  const [showCryptoWalletSettings, setShowCryptoWalletSettings] = useState(false);
  const [showSubscriptionsSettings, setShowSubscriptionsSettings] = useState(false);
  const [showBlockedAddressesSetting, setShowBlockedAddressesSetting] = useState(false);
  const [showPlebbitOptionsSettings, setShowPlebbitOptionsSettings] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  const getExpandedCount = () => {
    return (
      Number(showInterfaceSettings) +
      Number(showAccountSettings) +
      Number(showAvatarSettings) +
      Number(showCryptoAddressSetting) +
      Number(showCryptoWalletSettings) +
      Number(showSubscriptionsSettings) +
      Number(showBlockedAddressesSetting) +
      Number(showPlebbitOptionsSettings)
    );
  };

  const getExpandedCategoryId = (excludeCategoryId?: string) => {
    if (showInterfaceSettings && 'interface-settings' !== excludeCategoryId) return 'interface-settings';
    if (showAccountSettings && 'account-settings' !== excludeCategoryId) return 'account-settings';
    if (showAvatarSettings && 'avatar-settings' !== excludeCategoryId) return 'avatar-settings';
    if (showCryptoAddressSetting && 'crypto-address-settings' !== excludeCategoryId) return 'crypto-address-settings';
    if (showCryptoWalletSettings && 'crypto-wallet-settings' !== excludeCategoryId) return 'crypto-wallet-settings';
    if (showSubscriptionsSettings && 'subscriptions-settings' !== excludeCategoryId) return 'subscriptions-settings';
    if (showBlockedAddressesSetting && 'blocked-addresses-settings' !== excludeCategoryId) return 'blocked-addresses-settings';
    if (showPlebbitOptionsSettings && 'pkc-options-settings' !== excludeCategoryId) return 'pkc-options-settings';
    return null;
  };

  const handleCategoryClick = (categoryId: string, isShowing: boolean, setShowing: (value: boolean) => void) => {
    const newState = !isShowing;
    setShowing(newState);

    const currentPath = location.pathname;
    const baseSettingsPath = currentPath.split('#')[0];

    const currentExpandedCount = getExpandedCount();

    if (newState) {
      if (currentExpandedCount === 0) {
        navigate(`${baseSettingsPath}#${categoryId}`, { replace: true });
      } else {
        navigate(baseSettingsPath, { replace: true });
      }
    } else {
      if (currentExpandedCount === 1) {
        navigate(baseSettingsPath, { replace: true });
      } else if (currentExpandedCount === 2) {
        const remainingCategory = getExpandedCategoryId(categoryId);
        if (remainingCategory) {
          navigate(`${baseSettingsPath}#${remainingCategory}`, { replace: true });
        }
      }
    }
  };

  useEffect(() => {
    if (hash) {
      setShowInterfaceSettings(hash === 'interface-settings');
      setShowAccountSettings(hash === 'account-settings');
      setShowAvatarSettings(hash === 'avatar-settings');
      setShowCryptoAddressSetting(hash === 'crypto-address-settings');
      setShowCryptoWalletSettings(hash === 'crypto-wallet-settings');
      setShowSubscriptionsSettings(hash === 'subscriptions-settings');
      setShowBlockedAddressesSetting(hash === 'blocked-addresses-settings');
      setShowPlebbitOptionsSettings(hash === 'pkc-options-settings');
    }
  }, [hash]);

  const handleExpandAll = () => {
    const newExpandState = !expandAll;
    setExpandAll(newExpandState);
    setShowInterfaceSettings(newExpandState);
    setShowAccountSettings(newExpandState);
    setShowAvatarSettings(newExpandState);
    setShowCryptoAddressSetting(newExpandState);
    setShowCryptoWalletSettings(newExpandState);
    setShowSubscriptionsSettings(newExpandState);
    setShowBlockedAddressesSetting(newExpandState);
    setShowPlebbitOptionsSettings(newExpandState);

    const baseSettingsPath = location.pathname.split('#')[0];
    navigate(baseSettingsPath, { replace: true });
  };

  return (
    <>
      <div className={styles.overlay} onClick={closeModal} />
      <div className={styles.settingsModal}>
        <div className={styles.header}>
          <span className={styles.title}>{t('settings')}</span>
          <span className={styles.closeButton} title='close' onClick={closeModal} />
        </div>
        <div className={styles.expandAllSettings}>
          [<span onClick={handleExpandAll}>{expandAll ? t('collapse_all_settings') : t('expand_all_settings')}</span>]
        </div>
        <div id='interface-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('interface-settings', showInterfaceSettings, setShowInterfaceSettings)}>
            <span className={showInterfaceSettings ? styles.hideButton : styles.showButton} />
            {t('interface')}
          </label>
        </div>
        {showInterfaceSettings && <InterfaceSettings />}
        <div id='account-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('account-settings', showAccountSettings, setShowAccountSettings)}>
            <span className={showAccountSettings ? styles.hideButton : styles.showButton} />
            {t('plebbit_account')}
          </label>
        </div>
        {showAccountSettings && <AccountSettings />}
        <div id='avatar-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('avatar-settings', showAvatarSettings, setShowAvatarSettings)}>
            <span className={showAvatarSettings ? styles.hideButton : styles.showButton} />
            {t('avatar')}
          </label>
        </div>
        {showAvatarSettings && <AvatarSettings />}
        <div id='crypto-address-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('crypto-address-settings', showCryptoAddressSetting, setShowCryptoAddressSetting)}>
            <span className={showCryptoAddressSetting ? styles.hideButton : styles.showButton} />
            {t('crypto_address')}
          </label>
        </div>
        {showCryptoAddressSetting && <CryptoAddressSetting />}
        <div id='crypto-wallet-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('crypto-wallet-settings', showCryptoWalletSettings, setShowCryptoWalletSettings)}>
            <span className={showCryptoWalletSettings ? styles.hideButton : styles.showButton} />
            {t('crypto_wallets')}
          </label>
        </div>
        {showCryptoWalletSettings && <CryptoWalletsSetting />}
        <div id='subscriptions-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('subscriptions-settings', showSubscriptionsSettings, setShowSubscriptionsSettings)}>
            <span className={showSubscriptionsSettings ? styles.hideButton : styles.showButton} />
            {t('subscriptions')}
          </label>
        </div>
        {showSubscriptionsSettings && <SubscriptionsSetting />}
        <div id='blocked-addresses-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('blocked-addresses-settings', showBlockedAddressesSetting, setShowBlockedAddressesSetting)}>
            <span className={showBlockedAddressesSetting ? styles.hideButton : styles.showButton} />
            {t('blocked_addresses')}
          </label>
        </div>
        {showBlockedAddressesSetting && <BlockedAddressesSetting />}
        <div id='pkc-options-settings' className={`${styles.setting} ${styles.category}`}>
          <label onClick={() => handleCategoryClick('pkc-options-settings', showPlebbitOptionsSettings, setShowPlebbitOptionsSettings)}>
            <span className={showPlebbitOptionsSettings ? styles.hideButton : styles.showButton} />
            {t('plebbit_options')}
          </label>
        </div>
        {showPlebbitOptionsSettings && <PlebbitOptions />}
      </div>
    </>
  );
};

export default SettingsModal;
