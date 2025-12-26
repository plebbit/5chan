import { setAccount, useAccount, useBlock } from '@plebbit/plebbit-react-hooks';
import Plebbit from '@plebbit/plebbit-js';
import styles from './blocked-addresses-setting.module.css';
import { useTranslation } from 'react-i18next';

const UnblockButton = ({ address }: { address: string }) => {
  const { t } = useTranslation();
  const { unblock } = useBlock({ address });

  return (
    <span className={styles.unblockButton}>
      [
      <span className={styles.button} onClick={unblock}>
        {t('unblock')}
      </span>
      ]
    </span>
  );
};

const BlockedAddressesSetting = () => {
  const { t } = useTranslation();
  const { blockedAddresses } = useAccount() || {};
  const addressList = blockedAddresses ? Object.keys(blockedAddresses) : [];
  const account = useAccount();

  const unblockAll = () => {
    window.confirm(t('unblock_all_confirm')) && setAccount({ ...account, blockedAddresses: {} });
  };

  return (
    <div className={styles.setting}>
      {addressList.length > 0 ? (
        <>
          {addressList.length > 1 && (
            <div className={styles.unblockAll}>
              [
              <span className={styles.button} onClick={unblockAll}>
                {t('unblock_all')}
              </span>
              ]
            </div>
          )}
          <ul className={styles.blockedAddresses}>
            {addressList.map((address: string) => (
              <li key={address} className={styles.blockedAddress}>
                {address && Plebbit.getShortAddress({ address })} <UnblockButton address={address} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className={styles.notBlocked}>{t('you_have_not_blocked')}</div>
      )}
    </div>
  );
};

export default BlockedAddressesSetting;
