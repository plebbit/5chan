import { useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAccountComment } from '@plebbit/plebbit-react-hooks';
import { initSnow, removeSnow } from './lib/snow';
import { isAllView, isModView, isSubscriptionsView } from './lib/utils/view-utils';
import useReplyModalStore from './stores/use-reply-modal-store';
import useCreateBoardModalStore from './stores/use-create-board-modal-store';
import useSpecialThemeStore from './stores/use-special-theme-store';
import useIsMobile from './hooks/use-is-mobile';
import useTheme from './hooks/use-theme';
import { useDefaultSubplebbits } from './hooks/use-default-subplebbits';
import { getSubplebbitAddress } from './lib/utils/route-utils';
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
import CreateBoardModal from './components/create-board-modal';
import ReplyModal from './components/reply-modal';
import PostForm from './components/post-form';
import SubplebbitStats from './components/subplebbit-stats';
import TopBar from './components/topbar';
import TopbarEditModal from './components/topbar-edit-modal';
import DirectoryModal from './components/directory-modal';
import DisclaimerModal from './components/disclaimer-modal';
import SettingsModal from './components/settings-modal';

const BoardLayout = () => {
  const { accountCommentIndex, boardIdentifier } = useParams();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isInAllView = isAllView(location.pathname);
  const isInSubscriptionsView = isSubscriptionsView(location.pathname, useParams());
  const isInModView = isModView(location.pathname);
  const defaultSubplebbits = useDefaultSubplebbits();
  const subplebbitAddress = boardIdentifier ? getSubplebbitAddress(boardIdentifier, defaultSubplebbits) : undefined;
  const pendingPost = useAccountComment({ commentIndex: accountCommentIndex ? parseInt(accountCommentIndex) : undefined });
  const { closeCreateBoardModal } = useCreateBoardModalStore();

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

  // Close create board modal when navigating to a different page
  useEffect(() => {
    closeCreateBoardModal();
  }, [location.pathname, closeCreateBoardModal]);

  // force rerender of post form when navigating between pages, except when opening settings modal in current view
  const key = location.pathname.endsWith('/settings')
    ? `${subplebbitAddress}-${location.pathname.replace(/\/settings$/, '')}`
    : `${subplebbitAddress}-${location.pathname}`;

  return (
    <div className={styles.boardLayout}>
      <TopBar />
      <CreateBoardModal />
      <TopbarEditModal />
      <DirectoryModal />
      <DisclaimerModal />
      <BoardHeader />
      {isMobile
        ? (subplebbitAddress || isInAllView || isInModView || isInSubscriptionsView || pendingPost?.subplebbitAddress) && (
            <>
              <MobileBoardButtons />
              <PostForm key={key} />
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
        <Route path='/faq' element={<FAQ />} />
        <Route element={<BoardLayout />}>
          <Route path='/all/:timeFilterName?' element={<Board />} />
          <Route path='/all/:timeFilterName?/settings' element={<Board />} />
          <Route path='/all/description' element={<Post />} />
          <Route path='/all/catalog/:timeFilterName?' element={<Catalog />} />
          <Route path='/all/catalog/:timeFilterName?/settings' element={<Catalog />} />

          <Route path='/subs/:timeFilterName?' element={<Board />} />
          <Route path='/subs/:timeFilterName?/settings' element={<Board />} />
          <Route path='/subs/catalog/:timeFilterName?' element={<Catalog />} />
          <Route path='/subs/catalog/:timeFilterName?/settings' element={<Catalog />} />

          <Route path='/mod/:timeFilterName?' element={<Board />} />
          <Route path='/mod/:timeFilterName?/settings' element={<Board />} />
          <Route path='/mod/catalog/:timeFilterName?' element={<Catalog />} />
          <Route path='/mod/catalog/:timeFilterName?/settings' element={<Catalog />} />

          <Route path='/pending/:accountCommentIndex' element={<PendingPost />} />
          <Route path='/pending/:accountCommentIndex/settings' element={<PendingPost />} />

          <Route path='/:boardIdentifier' element={<Board />} />
          <Route path='/:boardIdentifier/settings' element={<Board />} />
          <Route path='/:boardIdentifier/catalog' element={<Catalog />} />
          <Route path='/:boardIdentifier/catalog/settings' element={<Catalog />} />

          <Route path='/:boardIdentifier/thread/:commentCid' element={<Post />} />
          <Route path='/:boardIdentifier/thread/:commentCid/settings' element={<Post />} />
          <Route path='/:boardIdentifier/description' element={<Post />} />
          <Route path='/:boardIdentifier/description/settings' element={<Post />} />
          <Route path='/:boardIdentifier/rules' element={<Post />} />
          <Route path='/:boardIdentifier/rules/settings' element={<Post />} />
        </Route>
        <Route path='/not-found' element={<NotFound />} />
        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>
  </div>
);

export default App;
