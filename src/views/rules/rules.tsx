import { useEffect, useState, FormEvent } from 'react';
import { useSubplebbit } from '@plebbit/plebbit-react-hooks';
import { Footer, HomeLogo } from '../home';
import { useDefaultSubplebbits, MultisubSubplebbit } from '../../hooks/use-default-subplebbits';
import styles from './rules.module.css';

const getBoardShortCode = (title?: string): string => {
  if (!title) return '';
  const match = title.match(/^\/([^/]+)\//);
  return match ? match[1] : '';
};

const getBoardName = (title?: string): string => {
  if (!title) return '';
  const match = title.match(/^\/[^/]+\/\s*-\s*(.+)$/);
  return match ? match[1] : title;
};

const BoardRulesDisplay = ({ subplebbitAddress, defaultSubplebbits }: { subplebbitAddress: string; defaultSubplebbits: MultisubSubplebbit[] }) => {
  const subplebbit = useSubplebbit({ subplebbitAddress });
  const { rules, state, title, shortAddress } = subplebbit || {};

  let loadingText: string | null = null;
  if (!subplebbit) {
    loadingText = 'connecting...';
  } else {
    switch (state) {
      case 'fetching-ipns':
      case 'fetching-ipfs':
        loadingText = 'loading...';
        break;
      case 'failed':
        loadingText = 'failed to load';
        break;
      case 'succeeded':
        loadingText = null;
        break;
      default:
        loadingText = state ? `${state}...` : 'loading...';
    }
  }

  const isLoaded = state === 'succeeded';

  const defaultSub = defaultSubplebbits.find((sub) => sub.address === subplebbitAddress);
  let displayTitle: string;
  if (defaultSub?.title) {
    const shortCode = getBoardShortCode(defaultSub.title);
    const boardName = getBoardName(defaultSub.title);
    displayTitle = `Rules for: /${shortCode}/ - ${boardName}`;
  } else if (title) {
    const shortCode = getBoardShortCode(title);
    const boardName = getBoardName(title);
    if (shortCode && boardName && boardName !== title) {
      displayTitle = `Rules for: /${shortCode}/ - ${boardName}`;
    } else {
      displayTitle = `Rules for: ${shortAddress || subplebbitAddress}`;
    }
  } else {
    displayTitle = `Rules for: ${shortAddress || subplebbitAddress}`;
  }

  return (
    <div className={`${styles.box} ${styles.rulesBox}`}>
      <div className={styles.boxBar}>
        <h2 className={styles.rulesBoxTitle}>{displayTitle}</h2>
      </div>
      <div className={styles.boxContent}>
        {!isLoaded ? (
          <p>
            <em>{loadingText}</em>
          </p>
        ) : rules && rules.length > 0 ? (
          <ol>
            {rules.map((rule: string, index: number) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
        ) : (
          <p>
            <em>This board has no rules set by its owner.</em>
          </p>
        )}
      </div>
    </div>
  );
};

const BoardSelector = ({
  defaultSubplebbits,
  selectedAddress,
  onSelect,
}: {
  defaultSubplebbits: MultisubSubplebbit[];
  selectedAddress: string;
  onSelect: (address: string) => void;
}) => {
  const [customAddress, setCustomAddress] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      onSelect(value);
      setCustomAddress('');
    }
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customAddress.trim()) {
      onSelect(customAddress.trim());
    }
  };

  return (
    <div className={`${styles.box} ${styles.selectorBox}`}>
      <div className={styles.boxBar}>
        <h2 className={styles.selectorBoxTitle}>Load rules from a board</h2>
      </div>
      <div className={styles.boxContent}>
        <div className={styles.selectorRow}>
          <select value={selectedAddress} onChange={handleSelectChange} className={styles.boardSelect}>
            <option value=''>Select board...</option>
            {defaultSubplebbits.map((sub) => {
              const shortCode = getBoardShortCode(sub.title);
              const boardName = getBoardName(sub.title);
              return (
                <option key={sub.address} value={sub.address}>
                  /{shortCode}/ - {boardName}
                </option>
              );
            })}
          </select>
          <span className={styles.orSeparator}>or</span>
          <form onSubmit={handleCustomSubmit} className={styles.customAddressForm}>
            <input
              type='text'
              placeholder='enter board address'
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className={styles.addressInput}
            />
            <button type='submit' className={styles.goButton}>
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Rules = () => {
  const defaultSubplebbits = useDefaultSubplebbits();
  const [selectedAddress, setSelectedAddress] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Rules - 5chan';
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <HomeLogo />
        <div className={`${styles.box} ${styles.infoBox}`}>
          <div className={styles.boxBar}>
            <h2>Rules</h2>
          </div>
          <div className={styles.boxContent}>
            5chan is a serverless and adminless tool to browse and post to decentralized imageboards. 5chan does not have global rules or moderators. Each board is
            independently owned and moderated, with its own set of rules determined by the board owner.
            <br />
            <br />
            Please read and respect the rules of whatever board you decide to post to.
          </div>
        </div>
        <BoardSelector defaultSubplebbits={defaultSubplebbits} selectedAddress={selectedAddress} onSelect={setSelectedAddress} />
        {selectedAddress && <BoardRulesDisplay subplebbitAddress={selectedAddress} defaultSubplebbits={defaultSubplebbits} />}
        <Footer />
      </div>
    </div>
  );
};

export default Rules;
