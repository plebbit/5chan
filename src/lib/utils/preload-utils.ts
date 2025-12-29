import { THEME_BUTTON_IMAGES, THEME_BACKGROUND_IMAGES } from '../../generated/asset-manifest';

/**
 * Preloads an array of image URLs by creating Image objects.
 * Images are loaded in the background and cached by the browser.
 */
const preloadImages = (imagePaths: readonly string[]): void => {
  imagePaths.forEach((path) => {
    const img = new Image();
    img.src = `/${path}`;
  });
};

/**
 * Preloads all theme-related assets (buttons, backgrounds) on app startup.
 * This prevents visible loading delays when switching themes.
 */
export const preloadThemeAssets = (): void => {
  preloadImages(THEME_BUTTON_IMAGES);
  preloadImages(THEME_BACKGROUND_IMAGES);
};
