import { useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAccountComment, useSubplebbitStats } from '@plebbit/plebbit-react-hooks';
import useSubplebbitsStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits';
import useSubplebbitsPagesStore from '@plebbit/plebbit-react-hooks/dist/stores/subplebbits-pages';
import useSubplebbitStatsVisibilityStore from '../../stores/use-subplebbit-stats-visibility-store';
import { useResolvedSubplebbitAddress } from '../../hooks/use-resolved-subplebbit-address';
import styles from './subplebbit-stats.module.css';

const SubplebbitStats = () => {
  const { t } = useTranslation();
  const params = useParams();

  const accountComment = useAccountComment({ commentIndex: params?.accountCommentIndex as any });
  const resolvedAddress = useResolvedSubplebbitAddress();
  const subplebbitAddress = resolvedAddress || accountComment?.subplebbitAddress;

  const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress]);
  const { address, createdAt } = subplebbit || {};

  let stats = useSubplebbitStats({ subplebbitAddress: address });
  const { hiddenStats, toggleVisibility } = useSubplebbitStatsVisibilityStore();
  const isHidden = hiddenStats[address];

  const comment = useSubplebbitsPagesStore((state) => state.comments[params?.commentCid as string]);
  const { deleted, locked, removed } = comment || {};
  const hideStats = deleted || locked || removed;

  const unixToMMDDYYYY = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear().toString().slice(-2);
    return month + '/' + day + '/' + year;
  };

  return (
    <div className={`${styles.content} ${hideStats ? styles.hide : styles.show}`}>
      <table className={styles.blotter}>
        <thead>
          <tr>
            <td>
              <hr />
            </td>
          </tr>
        </thead>
        {!isHidden && (
          <tbody>
            <tr>
              <td>
                <Trans
                  i18nKey='board_stats_hour'
                  values={{ userCount: stats.hourActiveUserCount ?? '?', postCount: stats.hourPostCount ?? '?' }}
                  components={{ 1: <span key='hour-stat-value' className={styles.statValue} /> }}
                />
                {' / '}
                <Trans
                  i18nKey='board_stats_day'
                  values={{ userCount: stats.dayActiveUserCount ?? '?', postCount: stats.dayPostCount ?? '?' }}
                  components={{ 1: <span key='day-stat-value' className={styles.statValue} /> }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <Trans
                  i18nKey='board_stats_week'
                  values={{ userCount: stats.weekActiveUserCount ?? '?', postCount: stats.weekPostCount ?? '?' }}
                  components={{ 1: <span key='week-stat-value' className={styles.statValue} /> }}
                />
                {' / '}
                <Trans
                  i18nKey='board_stats_month'
                  values={{ userCount: stats.monthActiveUserCount ?? '?', postCount: stats.monthPostCount ?? '?' }}
                  components={{ 1: <span key='month-stat-value' className={styles.statValue} /> }}
                />
              </td>
            </tr>
            <tr>
              <td className={styles.lowercase}>
                {createdAt && unixToMMDDYYYY(createdAt)} {t('board_created')}
                {' / '}
                <Trans
                  i18nKey='board_stats_all'
                  values={{ userCount: stats.allActiveUserCount ?? '?', postCount: stats.allPostCount ?? '?' }}
                  components={{ 1: <span key='all-stat-value' className={styles.statValue} /> }}
                />
              </td>
            </tr>
          </tbody>
        )}
        <tfoot>
          <tr>
            <td colSpan={2}>
              [
              <span className={styles.hideButton} onClick={() => toggleVisibility(address)}>
                {isHidden ? t('show_stats') : t('hide')}
              </span>
              ]
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SubplebbitStats;
