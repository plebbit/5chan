import { RefObject, useRef, useState } from 'react';
import { setAccount, useAccount, usePlebbitRpcSettings } from '@plebbit/plebbit-react-hooks';
import { useTranslation } from 'react-i18next';
import styles from './plebbit-options.module.css';

interface SettingsProps {
  ipfsGatewayUrlsRef?: RefObject<HTMLTextAreaElement>;
  mediaIpfsGatewayUrlRef?: RefObject<HTMLInputElement>;
  pubsubProvidersRef?: RefObject<HTMLTextAreaElement>;
  ethRpcRef?: RefObject<HTMLTextAreaElement>;
  solRpcRef?: RefObject<HTMLTextAreaElement>;
  maticRpcRef?: RefObject<HTMLTextAreaElement>;
  plebbitRpcRef?: RefObject<HTMLInputElement>;
  plebbitDataPathRef?: RefObject<HTMLInputElement>;
}

const IPFSGatewaysSettings = ({ ipfsGatewayUrlsRef, mediaIpfsGatewayUrlRef }: SettingsProps) => {
  const account = useAccount();
  const { plebbitOptions, mediaIpfsGatewayUrl } = account || {};
  const { ipfsGatewayUrls } = plebbitOptions || {};
  const plebbitRpc = usePlebbitRpcSettings();
  const isConnectedToRpc = plebbitRpc?.state === 'connected';
  const ipfsGatewayUrlsDefaultValue = ipfsGatewayUrls?.join('\n');

  return (
    <div className={styles.ipfsGatewaysSettings}>
      <div className={styles.ipfsGatewaysSetting}>
        <textarea
          defaultValue={ipfsGatewayUrlsDefaultValue}
          ref={ipfsGatewayUrlsRef}
          disabled={isConnectedToRpc}
          autoCorrect='off'
          autoComplete='off'
          spellCheck='false'
        />
      </div>
      <span className={styles.settingTip}>NFT profile pics gateway</span>
      <div>
        <input
          type='text'
          defaultValue={mediaIpfsGatewayUrl}
          ref={mediaIpfsGatewayUrlRef}
          disabled={isConnectedToRpc}
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck='false'
        />
      </div>
    </div>
  );
};

const PubsubProvidersSettings = ({ pubsubProvidersRef }: SettingsProps) => {
  const account = useAccount();
  const { plebbitOptions } = account || {};
  const { pubsubHttpClientsOptions } = plebbitOptions || {};
  const plebbitRpc = usePlebbitRpcSettings();
  const isConnectedToRpc = plebbitRpc?.state === 'connected';
  const pubsubProvidersDefaultValue = pubsubHttpClientsOptions?.join('\n');

  return (
    <div className={styles.pubsubProvidersSettings}>
      <textarea
        defaultValue={pubsubProvidersDefaultValue}
        ref={pubsubProvidersRef}
        disabled={isConnectedToRpc}
        autoCorrect='off'
        autoCapitalize='off'
        autoComplete='off'
        spellCheck='false'
      />
    </div>
  );
};

const BlockchainProvidersSettings = ({ ethRpcRef, solRpcRef, maticRpcRef }: SettingsProps) => {
  const account = useAccount();
  const { plebbitOptions } = account || {};
  const { chainProviders } = plebbitOptions || {};
  const ethRpcDefaultValue = chainProviders?.['eth']?.urls.join('\n');
  const solRpcDefaultValue = chainProviders?.['sol']?.urls.join('\n');
  const maticRpcDefaultValue = chainProviders?.['matic']?.urls.join('\n');

  return (
    <div className={styles.blockchainProvidersSettings}>
      <span className={styles.settingTip}>Ethereum RPC, for .eth domains</span>
      <div>
        <textarea defaultValue={ethRpcDefaultValue} ref={ethRpcRef} autoCorrect='off' autoComplete='off' spellCheck='false' />
      </div>
      <span className={styles.settingTip}>Solana RPC, for .sol domains</span>
      <div>
        <textarea defaultValue={solRpcDefaultValue} ref={solRpcRef} autoCorrect='off' autoComplete='off' spellCheck='false' />
      </div>
      <span className={styles.settingTip}>Polygon RPC, for avatar NFTs</span>
      <div>
        <textarea defaultValue={maticRpcDefaultValue} ref={maticRpcRef} autoCorrect='off' autoComplete='off' spellCheck='false' />
      </div>
    </div>
  );
};

const PlebbitRPCSettings = ({ plebbitRpcRef }: SettingsProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const account = useAccount();
  const { plebbitOptions } = account || {};
  const { plebbitRpcClientsOptions } = plebbitOptions || {};

  return (
    <div className={styles.plebbitRPCSettings}>
      <div>
        <input type='text' defaultValue={plebbitRpcClientsOptions} ref={plebbitRpcRef} autoCorrect='off' autoCapitalize='off' spellCheck='false' />
        <button onClick={() => setShowInfo(!showInfo)}>{showInfo ? 'X' : '?'}</button>
      </div>
      {showInfo && (
        <div className={styles.plebbitRpcSettingsInfo}>
          use a plebbit full node locally, or remotely with SSL
          <br />
          <ol>
            <li>get secret auth key from the node</li>
            <li>get IP address and port used by the node</li>
            <li>
              enter: <code>{`ws://<IP>:<port>/<secretAuthKey>`}</code>
            </li>
            <li>click save to connect</li>
          </ol>
        </div>
      )}
    </div>
  );
};

const PlebbitDataPathSettings = ({ plebbitDataPathRef }: SettingsProps) => {
  const plebbitRpc = usePlebbitRpcSettings();
  const { plebbitRpcSettings } = plebbitRpc || {};
  const isConnectedToRpc = plebbitRpc?.state === 'connected';
  const path = plebbitRpcSettings?.plebbitOptions?.dataPath || '';

  return (
    <div className={styles.plebbitDataPathSettings}>
      <div>
        <input autoCorrect='off' autoCapitalize='off' spellCheck='false' type='text' defaultValue={path} disabled={!isConnectedToRpc} ref={plebbitDataPathRef} />
      </div>
    </div>
  );
};

const isElectron = window.electronApi?.isElectron === true;

const PlebbitOptions = () => {
  const { t } = useTranslation();
  const account = useAccount();
  const { plebbitOptions } = account || {};

  const ipfsGatewayUrlsRef = useRef<HTMLTextAreaElement>(null);
  const mediaIpfsGatewayUrlRef = useRef<HTMLInputElement>(null);
  const pubsubProvidersRef = useRef<HTMLTextAreaElement>(null);
  const ethRpcRef = useRef<HTMLTextAreaElement>(null);
  const solRpcRef = useRef<HTMLTextAreaElement>(null);
  const maticRpcRef = useRef<HTMLTextAreaElement>(null);
  const httpRoutersRef = useRef<HTMLTextAreaElement>(null);
  const plebbitRpcRef = useRef<HTMLInputElement>(null);
  const plebbitDataPathRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const ipfsGatewayUrls = ipfsGatewayUrlsRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const mediaIpfsGatewayUrl = mediaIpfsGatewayUrlRef.current?.value.trim();

    const pubsubHttpClientsOptions = pubsubProvidersRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const ethRpcUrls = ethRpcRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const solRpcUrls = solRpcRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const maticRpcUrls = maticRpcRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const httpRoutersOptions = httpRoutersRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const plebbitRpcClientsOptions = plebbitRpcRef.current?.value.trim() ? [plebbitRpcRef.current.value.trim()] : undefined;
    const dataPath = plebbitDataPathRef.current?.value.trim() || undefined;

    const chainProviders = {
      eth: {
        urls: ethRpcUrls,
        chainId: 1,
      },
      sol: {
        urls: solRpcUrls,
        chainId: 1,
      },
      matic: {
        urls: maticRpcUrls,
        chainId: 137,
      },
    };

    try {
      await setAccount({
        ...account,
        mediaIpfsGatewayUrl,
        plebbitOptions: {
          ...plebbitOptions,
          ipfsGatewayUrls,
          pubsubHttpClientsOptions,
          chainProviders,
          httpRoutersOptions,
          plebbitRpcClientsOptions,
          dataPath,
        },
      });
      alert('Options saved, reloading...');
      window.location.reload();
    } catch (e) {
      if (e instanceof Error) {
        alert('Error saving options: ' + e.message);
        console.log(e);
      } else {
        alert('Error');
      }
    }
  };

  return (
    <div className={styles.content}>
      <button className={styles.saveOptions} onClick={handleSave}>
        {t('save_options')}
      </button>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>IPFS gateways:</span>
        <span className={styles.categorySettings}>
          <IPFSGatewaysSettings ipfsGatewayUrlsRef={ipfsGatewayUrlsRef} mediaIpfsGatewayUrlRef={mediaIpfsGatewayUrlRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>pubsub providers:</span>
        <span className={styles.categorySettings}>
          <PubsubProvidersSettings pubsubProvidersRef={pubsubProvidersRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle} style={{ marginBottom: '-5px' }}>
          blockchain providers:
        </span>
        <span className={styles.categorySettings}>
          <BlockchainProvidersSettings ethRpcRef={ethRpcRef} solRpcRef={solRpcRef} maticRpcRef={maticRpcRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>plebbit RPC:</span>
        <span className={styles.categorySettings}>
          <PlebbitRPCSettings plebbitRpcRef={plebbitRpcRef} />
        </span>
      </div>
      {isElectron && (
        <div className={styles.category}>
          <span className={styles.categoryTitle}>plebbit data path:</span>
          <span className={styles.categorySettings}>
            <PlebbitDataPathSettings plebbitDataPathRef={plebbitDataPathRef} />
          </span>
        </div>
      )}
    </div>
  );
};

export default PlebbitOptions;
