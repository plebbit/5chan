export type ParamsType = {
  accountCommentIndex?: string;
  boardIdentifier?: string;
  commentCid?: string;
  subplebbitAddress?: string; // deprecated, kept for backward compatibility
  timeFilterName?: string;
};

export const isAllView = (pathname: string): boolean => {
  return pathname.startsWith('/all');
};

export const isBoardView = (pathname: string, params: ParamsType): boolean => {
  // some subs might use emojis in their address, so we need to decode the pathname
  const decodedPathname = decodeURIComponent(pathname);
  // Check if it's a board view (not all, subscriptions, mod, pending, or special routes)
  if (
    pathname.startsWith('/all') ||
    pathname.startsWith('/subscriptions') ||
    pathname.startsWith('/mod') ||
    pathname.startsWith('/pending') ||
    pathname === '/' ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/not-found')
  ) {
    return false;
  }
  const identifier = params.boardIdentifier || params.subplebbitAddress;
  return identifier ? decodedPathname.startsWith(`/${identifier}`) : false;
};

export const isCatalogView = (pathname: string, params: ParamsType): boolean => {
  const { boardIdentifier, subplebbitAddress, timeFilterName } = params;
  const identifier = boardIdentifier || subplebbitAddress;
  const decodedPathname = decodeURIComponent(pathname);

  return (
    (identifier && (decodedPathname === `/${identifier}/catalog` || decodedPathname === `/${identifier}/catalog/settings`)) ||
    decodedPathname === `/all/catalog` ||
    decodedPathname === `/all/catalog/settings` ||
    decodedPathname === `/all/catalog/${timeFilterName}` ||
    decodedPathname === `/all/catalog/${timeFilterName}/settings` ||
    decodedPathname === `/subscriptions/catalog` ||
    decodedPathname === `/subscriptions/catalog/settings` ||
    decodedPathname === `/subscriptions/catalog/${timeFilterName}` ||
    decodedPathname === `/subscriptions/catalog/${timeFilterName}/settings` ||
    decodedPathname === `/mod/catalog` ||
    decodedPathname === `/mod/catalog/settings` ||
    decodedPathname === `/mod/catalog/${timeFilterName}` ||
    decodedPathname === `/mod/catalog/${timeFilterName}/settings`
  );
};

export const isDescriptionView = (pathname: string, params: ParamsType): boolean => {
  const decodedPathname = decodeURIComponent(pathname);
  const identifier = params.boardIdentifier || params.subplebbitAddress;
  return pathname === '/all/description' ? true : identifier ? decodedPathname.startsWith(`/${identifier}/description`) : false;
};

export const isHomeView = (pathname: string): boolean => {
  return pathname === '/';
};

export const isModView = (pathname: string): boolean => {
  return pathname === `/mod` || pathname.startsWith(`/mod/`);
};

export const isPendingPostView = (pathname: string, params: ParamsType): boolean => {
  return pathname === `/pending/${params.accountCommentIndex}` || pathname === `/pending/${params.accountCommentIndex}/settings`;
};

export const isPostPageView = (pathname: string, params: ParamsType): boolean => {
  if (isDescriptionView(pathname, params) || isRulesView(pathname, params)) {
    return true;
  }
  const decodedPathname = decodeURIComponent(pathname);
  const identifier = params.boardIdentifier || params.subplebbitAddress;
  return identifier && params.commentCid ? decodedPathname.startsWith(`/${identifier}/thread/${params.commentCid}`) : false;
};

export const isRulesView = (pathname: string, params: ParamsType): boolean => {
  const decodedPathname = decodeURIComponent(pathname);
  const identifier = params.boardIdentifier || params.subplebbitAddress;
  return identifier ? decodedPathname.startsWith(`/${identifier}/rules`) : false;
};

export const isSettingsView = (pathname: string, params: ParamsType): boolean => {
  const { accountCommentIndex, boardIdentifier, commentCid, subplebbitAddress } = params;
  const identifier = boardIdentifier || subplebbitAddress;
  const decodedPathname = decodeURIComponent(pathname);
  return (
    (identifier && commentCid && decodedPathname === `/${identifier}/thread/${commentCid}/settings`) ||
    (identifier && decodedPathname === `/${identifier}/description/settings`) ||
    (identifier && decodedPathname === `/${identifier}/rules/settings`) ||
    decodedPathname === `/pending/${accountCommentIndex}/settings`
  );
};

export const isSubscriptionsView = (pathname: string, params: ParamsType): boolean => {
  const { timeFilterName } = params;
  return (
    pathname === '/subscriptions' ||
    pathname === '/subscriptions/settings' ||
    pathname === `/subscriptions/${timeFilterName}` ||
    pathname === `/subscriptions/${timeFilterName}/settings` ||
    pathname === '/subscriptions/catalog' ||
    pathname === '/subscriptions/catalog/settings' ||
    pathname === `/subscriptions/catalog/${timeFilterName}` ||
    pathname === `/subscriptions/catalog/${timeFilterName}/settings`
  );
};

export const isNotFoundView = (pathname: string, params: ParamsType): boolean => {
  return (
    !isAllView(pathname) &&
    !isBoardView(pathname, params) &&
    !isCatalogView(pathname, params) &&
    !isDescriptionView(pathname, params) &&
    !isHomeView(pathname) &&
    !isPendingPostView(pathname, params) &&
    !isPostPageView(pathname, params) &&
    !isRulesView(pathname, params) &&
    !isSettingsView(pathname, params) &&
    !isSubscriptionsView(pathname, params)
  );
};
