# Innerarc frontend

Expo (React Native + Web) app for Innerarc — one codebase for **website** and **mobile app**.

## Run locally

```bash
npm install

# Dev menu — pick web, Android, or iOS
npx expo start

# Web only (browser)
npm run web

# Native dev builds
npm run android
npm run ios
```

Open the web app at [http://localhost:8081](http://localhost:8081) (or `/login`, `/signup`, `/home`).

## Website (static export)

Build a deployable static site:

```bash
npm run build:web
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, S3, etc.). SPA fallbacks are included in `public/_redirects` and `public/vercel.json` so deep links like `/login` and `/home` work after refresh.

Set your production URL for deep linking:

```bash
EXPO_PUBLIC_SITE_URL=https://app.innerarc.com
```

## Mobile app

Native builds use the same screens. Wearable sync (Health Connect) is **Android-only**; web and iOS show clear messaging instead.

```bash
# Local native run (requires Android Studio / Xcode)
npm run android
npm run ios

# Cloud builds (requires Expo account + EAS CLI)
npm run build:android
npm run build:ios
```

Deep links use the `innerarc://` scheme (e.g. `innerarc://home`).

## Environment

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_SITE_URL` | Production web URL for routing |
| `EXPO_PUBLIC_M7_VERIFY` | Set to `1` for Health Connect verification flow |

Theme tokens live in `src/theme.ts`. Web uses a centered 560px shell on large screens (`WebShell`).
