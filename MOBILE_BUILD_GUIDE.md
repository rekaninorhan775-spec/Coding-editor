# Coding Editor — Mobile Packaging Guide (Android APK & iOS)

This web application is already configured as an installable **PWA** (`Coding Editor`) and includes `capacitor.config.json` (`com.norhan.codingeditor`) for native Android and iOS builds.

## Option 1: Instant Install on Android & iOS (No PC Required)
1. Deploy or Share the app URL.
2. **Android**: Open the URL in Google Chrome → tap `⋮` → **Install app** (or **Add to Home screen**).
3. **iOS (iPhone / iPad)**: Open the URL in Safari → tap **Share** → **Add to Home Screen**.

## Option 2: Build a Native Android `.apk` Locally (Requires Node.js + Android Studio)
```bash
npm install
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```
Inside **Android Studio**: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

## Option 3: Build for iOS Locally (Requires macOS + Xcode)
```bash
npm install
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios
```
Inside **Xcode**: Select your signing team and run or archive for your iPhone/iPad.
