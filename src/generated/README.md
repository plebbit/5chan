# Generated Files

This directory contains auto-generated TypeScript files. Do not edit these files manually.

## asset-manifest.ts

Auto-generated manifest of all banner and not-found images from `public/assets/`.

**To regenerate:**
```bash
yarn generate:assets
```

**Auto-regenerated:**
- Before every build (`yarn build`)
- Before dev server start (`yarn start`)

**To add new banners:**
1. Add files to `public/assets/banners/` following the pattern `banner-*.{jpg,jpeg,gif,png}`
2. Run `yarn generate:assets` (or it will auto-run on next build/start)

**To add new not-found images:**
1. Add files to `public/assets/not-found/` following the pattern `not-found-*.{jpg,jpeg,gif,png}`
2. Run `yarn generate:assets` (or it will auto-run on next build/start)

