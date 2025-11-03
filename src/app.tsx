import { useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAccountComment } from '@plebbit/plebbit-react-hooks';
import { initSnow, removeSnow } from './lib/snow';
import { isAllView, isModView, isSubscriptionsView } from './lib/utils/view-utils';
import useReplyModalStore from './stores/use-reply-modal-store';
import useSpecialThemeStore from './stores/use-special-theme-store';
import useIsMobile from './hooks/use-is-mobile';
import useTheme from './hooks/use-theme';
import styles from './app.module.css';
import Board from './views/board';
import Catalog from './views/catalog';
import FAQ from './views/faq';
import Home from './views/home';
import NotFound from './views/not-found';
import PendingPost from './views/pending-post';
import Post from './views/post';
import { DesktopBoardButtons, MobileBoardButtons } from './components/board-buttons';
import BoardHeader from './components/board-header';
import ChallengeModal from './components/challenge-modal';
import ReplyModal from './components/reply-modal';
import PostForm from './components/post-form';
import SubplebbitStats from './components/subplebbit-stats';
import TopBar from './components/topbar';
import SettingsModal from './components/settings-modal';

const BoardLayout = () => {
  const { accountCommentIndex, subplebbitAddress } = useParams();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isInAllView = isAllView(location.pathname);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());
  const isInModView = isModView(location.pathname);
  const pendingPost = useAccountComment({ commentIndex: accountCommentIndex ? parseInt(accountCommentIndex) : undefined });

  // Christmas theme
  const { isEnabled: isSpecialEnabled } = useSpecialThemeStore();
  useEffect(() => {
    if (isSpecialEnabled && !isMobile) {
      initSnow({ flakeCount: 150 });
    }
    return () => {
      removeSnow();
    };
  }, [isSpecialEnabled, isMobile]);

  // force rerender of post form when navigating between pages, except when opening settings modal in current view
  const key = location.pathname.endsWith('/settings')
    ? `${subplebbitAddress}-${location.pathname.replace(/\/settings$/, '')}`
    : `${subplebbitAddress}-${location.pathname}`;

  return (
    <div className={styles.boardLayout}>
      <TopBar />
      <BoardHeader />
      {isMobile
        ? (subplebbitAddress || isInAllView || isInModView || isInSubscriptionsView || pendingPost?.subplebbitAddress) && (
            <>
              <PostForm key={key} />
              <hr />
              <MobileBoardButtons />
            </>
          )
        : (subplebbitAddress || isInAllView || isInModView || isInSubscriptionsView || pendingPost?.subplebbitAddress) && (
            <>
              <PostForm key={key} />
              {!(isInAllView || isInSubscriptionsView || isInModView) && <SubplebbitStats />}
              <DesktopBoardButtons />
            </>
          )}
      <Outlet />
    </div>
  );
};

const GlobalLayout = () => {
  const [theme, setTheme] = useState('');
  const [currentTheme] = useTheme();

  useEffect(() => {
    if (currentTheme !== theme) {
      setTheme(currentTheme);
    }
  }, [currentTheme, theme]);

  useEffect(() => {
    if (theme) {
      document.body.classList.add(theme);
      return () => {
        document.body.classList.remove(theme);
      };
    }
  }, [theme]);

  const { activeCid, threadCid, subplebbitAddress, closeModal, showReplyModal, scrollY } = useReplyModalStore();

  const location = useLocation();
  const isInSettingsView = location.pathname.endsWith('/settings');

  return (
    <>
      <ChallengeModal />
      {activeCid && threadCid && subplebbitAddress && (
        <ReplyModal
          closeModal={closeModal}
          parentCid={activeCid}
          postCid={threadCid}
          scrollY={scrollY}
          showReplyModal={showReplyModal}
          subplebbitAddress={subplebbitAddress}
        />
      )}
      {isInSettingsView && <SettingsModal />}
      <Outlet />
    </>
  );
};

const App = () => (
  <div className={styles.app}>
    <Routes>
      <Route element={<GlobalLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/:tag' element={<Home />} />
        <Route path='/faq' element={<FAQ />} />
        <Route path='*' element={<NotFound />} />
        <Route element={<BoardLayout />}>
          <Route path='/p/:subplebbitAddress' element={<Board />} />
          <Route path='/p/:subplebbitAddress/settings' element={<Board />} />
          <Route path='/p/:subplebbitAddress/catalog' element={<Catalog />} />
          <Route path='/p/:subplebbitAddress/catalog/settings' element={<Catalog />} />

          <Route path='/p/:subplebbitAddress/c/:commentCid' element={<Post />} />
          <Route path='/p/:subplebbitAddress/c/:commentCid/settings' element={<Post />} />
          <Route path='/p/:subplebbitAddress/description' element={<Post />} />
          <Route path='/p/:subplebbitAddress/description/settings' element={<Post />} />
          <Route path='/p/:subplebbitAddress/rules' element={<Post />} />
          <Route path='/p/:subplebbitAddress/rules/settings' element={<Post />} />

          <Route path='/p/all/:timeFilterName?' element={<Board />} />
          <Route path='/p/all/:timeFilterName?/settings' element={<Board />} />
          <Route path='/p/all/description' element={<Post />} />
          <Route path='/p/all/catalog/:timeFilterName?' element={<Catalog />} />
          <Route path='/p/all/catalog/:timeFilterName?/settings' element={<Catalog />} />

          <Route path='/p/subscriptions/:timeFilterName?' element={<Board />} />
          <Route path='/p/subscriptions/:timeFilterName?/settings' element={<Board />} />
          <Route path='/p/subscriptions/catalog/:timeFilterName?' element={<Catalog />} />
          <Route path='/p/subscriptions/catalog/:timeFilterName?/settings' element={<Catalog />} />

          <Route path='/p/mod/:timeFilterName?' element={<Board />} />
          <Route path='/p/mod/:timeFilterName?/settings' element={<Board />} />
          <Route path='/p/mod/catalog/:timeFilterName?' element={<Catalog />} />
          <Route path='/p/mod/catalog/:timeFilterName?/settings' element={<Catalog />} />

          <Route path='/profile/:accountCommentIndex' element={<PendingPost />} />
          <Route path='/profile/:accountCommentIndex/settings' element={<PendingPost />} />
        </Route>
        <Route path='/not-found' element={<NotFound />} />
      </Route>
    </Routes>
  </div>
);

export default App;
