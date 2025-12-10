# Mobile App Testing on Physical Devices

Guide for installing and testing the ListForge mobile app on your phone without app store submission.

---

## 📋 Overview

There are three ways to test the mobile app on your phone:

| Method | Speed | Use Case | Limitations |
|--------|-------|----------|-------------|
| **Expo Go** | Instant | Quick UI testing | No custom native modules |
| **Development Build** | 20 mins | Active development, local API | Requires rebuild for native changes |
| **Preview Build** | 20 mins | Production-like testing | Requires rebuild for any changes |

**Recommended**: Start with Preview Build for most testing scenarios.

---

## 🚀 Method 1: Preview Build (Recommended)

Production-ready build you can install directly on your phone. Best for thorough testing.

### iOS - TestFlight Installation

**Step 1: Build the App**

```bash
cd apps/listforge-mobile

# Build for iOS internal testing
eas build --profile preview --platform ios
```

Build takes ~15-20 minutes. You'll receive an email when complete.

**Step 2: Submit to TestFlight**

```bash
# Automatically upload to TestFlight
eas submit --platform ios --latest
```

**Step 3: Install on iPhone**

1. Install [TestFlight](https://apps.apple.com/us/app/testflight/id899247664) from App Store
2. Wait 1-2 minutes for TestFlight processing
3. Open TestFlight app
4. Accept the test invitation for "ListForge"
5. Tap "Install"

**That's it!** The app is now on your iPhone.

**Benefits**:
- ✅ No Mac required
- ✅ Easy to share with team members
- ✅ Updates automatically when you submit new builds
- ✅ Supports up to 10,000 testers
- ✅ 90-day expiration (automatically renewed with new builds)

### Android - Direct APK Installation

**Step 1: Build the App**

```bash
cd apps/listforge-mobile

# Build APK for Android
eas build --profile preview --platform android
```

Build takes ~15-20 minutes. You'll receive an email when complete.

**Step 2: Download APK**

Visit [EAS Dashboard](https://expo.dev) or check your email for the download link.

**Step 3: Transfer to Phone**

Choose one:
- **Email**: Send APK to yourself, open on phone
- **Google Drive**: Upload, download on phone
- **USB**: Connect phone, copy to Downloads folder
- **Airdrop** (if using Mac): Send directly to Android phone

**Step 4: Install**

1. Open the `.apk` file on your phone
2. If prompted, enable "Install unknown apps" for your browser/file manager:
   - Settings → Apps → Special access → Install unknown apps
   - Enable for Chrome/Files/Gmail (whichever you're using)
3. Tap "Install"
4. Open the app

**Benefits**:
- ✅ No Google Play Console account needed
- ✅ Instant installation after download
- ✅ No expiration
- ✅ Easy to share with testers

---

## 🔧 Method 2: Development Build

For active development with hot reload and debugging. Connects to your local API.

### When to Use

- Testing with local backend (localhost:3001)
- Debugging native modules
- Active feature development
- Need fast iteration

### Setup

**Step 1: Update Environment Variables**

Find your computer's local IP address:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example output: inet 192.168.1.100

# Windows
ipconfig
# Look for "IPv4 Address"
```

Update `apps/listforge-mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3001
```

Replace `192.168.1.100` with your actual IP address.

**Step 2: Build Development Client**

```bash
cd apps/listforge-mobile

# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

**Step 3: Install on Phone**

- **iOS**: Download `.tar.gz`, extract, drag to iOS Simulator, OR use TestFlight (same as preview)
- **Android**: Download `.apk`, install on phone (same as preview)

**Step 4: Start Development Server**

```bash
cd apps/listforge-mobile
pnpm start
```

**Step 5: Connect to Dev Server**

1. Open the ListForge app on your phone
2. Shake device or press menu button
3. Tap "Enter URL manually"
4. Enter: `exp://192.168.1.100:8081` (use your IP)
5. The app will load your code

**Now you can**:
- Make code changes and see them instantly
- Use React Native debugger
- Test with your local API

**Requirements**:
- ✅ Phone and computer on same WiFi network
- ✅ API running locally (`pnpm dev` from monorepo root)
- ✅ Port 8081 not blocked by firewall

---

## 📱 Method 3: Expo Go (Limited)

Fastest way to test UI changes, but doesn't support all features.

### When to Use

- Quick UI/layout testing
- Checking component styling
- Prototyping new screens

### Setup

**Step 1: Install Expo Go**

- **iOS**: [Expo Go on App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Expo Go on Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

**Step 2: Start Dev Server**

```bash
cd apps/listforge-mobile
pnpm start
```

**Step 3: Scan QR Code**

- **iOS**: Open Camera app, scan QR code in terminal
- **Android**: Open Expo Go app, scan QR code

**Limitations** (Won't Work):
- ❌ Camera/barcode scanning
- ❌ Push notifications
- ❌ Some native modules (@sentry, expo-sqlite)
- ❌ Custom native code
- ❌ Deep linking

**Best For**: Quick React component testing only.

---

## 🌐 Testing with Different API Environments

You can configure which API the app connects to by changing the build profile or environment variables.

### Local API (Development)

```bash
# apps/listforge-mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3001
```

Build with development profile:
```bash
eas build --profile development --platform android
```

### Staging API (Preview)

Already configured in `eas.json`:
```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api-staging.listforge.app",
    "EXPO_PUBLIC_WS_URL": "wss://api-staging.listforge.app"
  }
}
```

Build with preview profile:
```bash
eas build --profile preview --platform android
```

### Production API

Already configured in `eas.json`:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.listforge.app",
    "EXPO_PUBLIC_WS_URL": "wss://api.listforge.app"
  }
}
```

Build with production profile:
```bash
eas build --profile production --platform android
```

---

## 🎯 Recommended Testing Workflow

### For Solo Development

```bash
# 1. Build preview for your phone (one-time)
eas build --profile preview --platform android  # or ios

# 2. Install on your phone
# Android: Download .apk and install
# iOS: Submit to TestFlight

# 3. Test the app thoroughly

# 4. Make code changes locally

# 5. When ready, rebuild and reinstall
eas build --profile preview --platform android
```

### For Team Testing

```bash
# 1. Build preview for both platforms
eas build --profile preview --platform all

# 2. Submit to TestFlight (iOS)
eas submit --platform ios --latest

# 3. Share Android APK download link with team
# Get link from: https://expo.dev

# 4. Team members install and test

# 5. Collect feedback, make changes

# 6. Rebuild and resubmit
eas build --profile preview --platform all
eas submit --platform ios --latest
```

### For Active Feature Development

```bash
# 1. Build development client (one-time)
eas build --profile development --platform android

# 2. Install on your phone

# 3. Start local API
cd ../../
pnpm dev  # From monorepo root

# 4. Start Expo dev server
cd apps/listforge-mobile
pnpm start

# 5. Open app on phone, connect to dev server

# 6. Make changes, see instant updates
```

---

## 🔍 Checking Build Status

### EAS Dashboard

Visit [expo.dev](https://expo.dev) to:
- See all your builds
- Download build artifacts
- View build logs
- Check build queue position

### Email Notifications

You'll receive emails for:
- ✅ Build started
- ✅ Build completed successfully
- ❌ Build failed (with error logs)

### CLI

```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# Cancel running build
eas build:cancel
```

---

## 🐛 Troubleshooting

### iOS: "Untrusted Developer"

**Error**: "Untrusted Enterprise Developer" when opening app

**Solution**:
1. Settings → General → VPN & Device Management
2. Tap your developer account
3. Tap "Trust [Your Account]"

### iOS: TestFlight Not Showing App

**Possible Causes**:

1. **Processing not complete**: Wait 1-2 minutes after submission
2. **Not invited**: Check if you're using the Apple ID you submitted with
3. **TestFlight not installed**: Install from App Store

**Check Status**:
- Visit [App Store Connect](https://appstoreconnect.apple.com)
- TestFlight → iOS → External Testing
- Verify build shows "Ready to Test"

### Android: "App Not Installed"

**Possible Causes**:

1. **Conflicting package**: Uninstall any existing ListForge app first
2. **Corrupted APK**: Re-download the APK
3. **Insufficient storage**: Free up space on your phone
4. **Install from unknown sources disabled**: Enable in Settings

**Solution**:
```bash
# Uninstall existing app
adb uninstall com.listforge.mobile

# Reinstall
adb install path/to/app.apk
```

### Can't Connect to Local API

**Checklist**:

- [ ] Phone and computer on **same WiFi network**
- [ ] Using **computer's local IP**, not `localhost` or `127.0.0.1`
- [ ] API server **running** (`pnpm dev` from monorepo root)
- [ ] API listening on **0.0.0.0**, not just localhost
- [ ] **Firewall** not blocking port 3001
- [ ] WiFi **not using AP isolation** (corporate/hotel WiFi might block device-to-device)

**Test Connection**:
```bash
# From your phone's browser, visit:
http://192.168.1.100:3001/api/health

# Should see API health check response
```

### Build Failing

**Common Issues**:

**"Native module cannot be null"**
```bash
# Fix: Ensure all native dependencies are Expo-compatible
cd apps/listforge-mobile
npx expo install --check
```

**"Keystore not found" (Android)**
```bash
# Let EAS generate keystore automatically
eas credentials
```

**"Provisioning profile error" (iOS)**
```bash
# EAS handles automatically, but you can manage manually:
eas credentials
```

**Check Build Logs**:
```bash
# View detailed error logs
eas build:view [build-id]
```

### Slow Build Times

**Normal build times**:
- First build: 20-30 minutes
- Subsequent builds: 15-20 minutes

**Speed up builds**:
- Use `--local` flag to build on your machine (requires Xcode/Android Studio)
- Upgrade to EAS paid plan (faster build machines)
- Enable build caching (automatic in most cases)

---

## 📊 Build Profile Comparison

| Feature | Development | Preview | Production |
|---------|------------|---------|------------|
| **Distribution** | Internal | Internal | App Stores |
| **API** | Localhost | Staging | Production |
| **Hot Reload** | ✅ Yes | ❌ No | ❌ No |
| **Debugging** | ✅ Full | ⚠️ Limited | ❌ None |
| **Build Time** | 20 min | 20 min | 20 min |
| **File Type (iOS)** | .tar.gz | .ipa | .ipa |
| **File Type (Android)** | .apk | .apk | .aab |
| **Expiration** | None | 90 days* | None |
| **Best For** | Active dev | Testing | Release |

*TestFlight builds expire after 90 days, but you can resubmit

---

## 🔗 Quick Reference

### Essential Commands

```bash
# Preview build (recommended for testing)
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Development build (for local API)
eas build --profile development --platform android

# Submit to TestFlight
eas submit --platform ios --latest

# Check build status
eas build:list

# Start dev server (for Expo Go or dev builds)
pnpm start
```

### Build Download Locations

- **EAS Dashboard**: https://expo.dev
- **Email**: Check inbox for build completion
- **CLI**: Use `eas build:view [build-id]` to get download link

### Network Setup for Local API

```bash
# 1. Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Update .env
# EXPO_PUBLIC_API_URL=http://[YOUR_IP]:3001

# 3. Ensure both devices on same WiFi

# 4. Test from phone browser
# http://[YOUR_IP]:3001/api/health
```

---

## 💡 Tips & Best Practices

### Efficient Testing

1. **Build once, test many times**: Preview builds don't expire (Android) or last 90 days (iOS)
2. **Use OTA updates**: For JS-only changes, use `eas update` instead of full rebuild
3. **TestFlight for iOS**: Easier than managing certificates manually
4. **Keep development build**: Useful for debugging production issues

### Team Collaboration

1. **Share TestFlight link**: Add team members' Apple IDs in App Store Connect
2. **Share APK via link**: Upload to Google Drive or company file server
3. **Use preview profile**: Connects to staging API, not localhost
4. **Document API URLs**: Make sure everyone knows which environment they're testing

### Debugging on Device

**iOS**:
- Shake device → "Show Dev Menu"
- Enable "Debug Remote JS" for Chrome DevTools

**Android**:
- Shake device OR `adb shell input keyevent 82`
- Enable "Debug Remote JS"
- Use `adb logcat` for native logs

**Both**:
- Install React Native Debugger for better DX
- Use Sentry for production error tracking

---

## 📈 Next Steps

After testing on your phone:

1. **Collect feedback** from manual testing
2. **Fix bugs** discovered during testing
3. **Iterate** using OTA updates or rebuilds
4. **Share with team** via TestFlight (iOS) or APK (Android)
5. **Ready for release?** See [Mobile Deployment Guide](./MOBILE_DEPLOYMENT.md)

---

## ✅ Checklist: First Time Setup

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Build preview: `eas build --profile preview --platform [ios/android]`
- [ ] Wait for email notification (~20 minutes)
- [ ] Download and install on your phone
- [ ] Test core features (camera, barcode, chat, research)
- [ ] Verify API connectivity
- [ ] Check push notifications (if configured)
- [ ] Test offline mode and sync

---

**Need Help?**

- **Expo Documentation**: https://docs.expo.dev/build/setup/
- **Expo Discord**: https://chat.expo.dev
- **Troubleshooting**: See sections above

**Last Updated**: 2025-12-09
**Version**: 1.0.0
