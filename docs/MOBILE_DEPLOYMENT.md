# Mobile App Deployment Guide

Complete guide for deploying the ListForge mobile app to iOS App Store and Google Play Store.

---

## 📱 How Mobile Deployment Differs from Web/API

### Web/API (Current Setup)

- **Build**: Docker images → AWS ECR
- **Deploy**: AWS App Runner automatically runs containers
- **Update**: Push to main → builds → deploys instantly
- **Users**: Get updates immediately on next page load

### Mobile Apps (New Process)

- **Build**: Native iOS/Android binaries → Expo Application Services (EAS)
- **Deploy**: Submit to App Store / Play Store → Review process (1-7 days)
- **Update**: Over-the-air (OTA) updates for JS changes, full rebuild for native changes
- **Users**: Download from app stores, OTA updates install automatically

**Key Difference**: Mobile apps require app store review and can't be instantly updated. You control release to users through app store dashboards.

---

## 🏗️ Expo Application Services (EAS)

EAS is Expo's cloud build and deployment service. It handles:

- **EAS Build**: Builds iOS/Android apps in the cloud (no Mac/Linux VM needed locally)
- **EAS Submit**: Submits builds to App Store and Play Store
- **EAS Update**: Pushes over-the-air JavaScript/asset updates (no app store review)
- **EAS Metadata**: Manages app store listings and screenshots

### Why EAS?

1. **No local setup**: Build iOS apps without a Mac, Android apps without Android Studio
2. **Consistent builds**: Reproducible cloud environment
3. **CI/CD friendly**: Integrates with GitHub Actions
4. **Free tier**: 30 builds/month for personal projects

**Alternatives**: You can build locally with `expo run:ios` / `expo run:android`, but EAS is recommended for production.

---

## 🚀 Initial Setup

### 1. Create EAS Account

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login
```

### 2. Initialize EAS Project

```bash
cd apps/listforge-mobile

# Initialize EAS (creates project ID and eas.json)
eas init
```

This will:

- Create an Expo project in your account
- Generate a project ID
- Update `app.json` with the project ID
- Create `eas.json` configuration

### 3. Configure App Store Accounts

**Apple App Store (iOS)**:

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Create App ID: `com.listforge.mobile`
3. Generate distribution certificate
4. EAS will handle provisioning profiles automatically

**Google Play Store (Android)**:

1. Create [Google Play Console account](https://play.google.com/console) ($25 one-time)
2. Create app with package name: `com.listforge.mobile`
3. Generate upload keystore (EAS handles this automatically)

---

## 📝 EAS Configuration

Create `apps/listforge-mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3001",
        "EXPO_PUBLIC_WS_URL": "ws://localhost:3001"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.listforge.app",
        "EXPO_PUBLIC_WS_URL": "wss://api-staging.listforge.app"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.listforge.app",
        "EXPO_PUBLIC_WS_URL": "wss://api.listforge.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  },
  "update": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

### Profile Explanations

**development**:

- Builds development client (like web dev server, but native)
- Connects to localhost API
- Fast iteration during development
- iOS: Runs in simulator
- Android: Creates APK (not App Bundle)

**preview**:

- Internal distribution (TestFlight, internal Play Store testing)
- Connects to staging API
- Test before production release
- Creates .ipa (iOS) and .apk (Android)

**production**:

- App Store/Play Store distribution
- Production API URLs
- Optimized builds
- Creates .ipa (iOS) and .aab (Android App Bundle)

---

## 🔨 Building Apps

### Development Build (for local testing)

```bash
cd apps/listforge-mobile

# Build for iOS simulator
eas build --profile development --platform ios

# Build for Android emulator/device
eas build --profile development --platform android

# Build for both platforms
eas build --profile development --platform all
```

**Download and Install**:

- iOS: Download .tar.gz, extract, drag to simulator
- Android: Download .apk, install on emulator/device

### Preview Build (for internal testing)

```bash
# iOS (TestFlight)
eas build --profile preview --platform ios

# Android (internal testing)
eas build --profile preview --platform android
```

### Production Build (for app stores)

```bash
# Build for iOS App Store
eas build --profile production --platform ios

# Build for Google Play Store
eas build --profile production --platform android

# Build for both stores
eas build --profile production --platform all
```

**Build Process**:

1. EAS uploads your code to cloud builders
2. Installs dependencies, runs prebuild scripts
3. Compiles native iOS/Android apps
4. Uploads builds to EAS servers
5. You download builds or submit directly to stores

**Build Time**: ~15-20 minutes per platform

**Build Status**: Check at <https://expo.dev/accounts/[your-account]/projects/listforge-mobile/builds>

---

## 📦 Submitting to App Stores

### iOS App Store

**Option 1: Automatic submission via EAS**

```bash
# Submit latest production iOS build
eas submit --platform ios --latest

# Or submit specific build
eas submit --platform ios --id [build-id]
```

**Option 2: Manual submission via App Store Connect**

1. Download .ipa from EAS dashboard
2. Upload to App Store Connect using Transporter app
3. Fill out App Store listing (screenshots, description)
4. Submit for review

**Review Time**: 1-3 days typically

### Google Play Store

**Option 1: Automatic submission via EAS**

```bash
# Submit latest production Android build
eas submit --platform android --latest
```

**Option 2: Manual submission via Play Console**

1. Download .aab from EAS dashboard
2. Upload to Play Console → Production → Create new release
3. Fill out Play Store listing
4. Submit for review

**Review Time**: Few hours to 1 day typically

---

## 🔄 Over-The-Air (OTA) Updates

Push JavaScript/asset changes without app store review!

### When to Use OTA vs Full Rebuild

**OTA Updates (no app store review)**:

- ✅ JavaScript code changes (components, logic)
- ✅ Asset updates (images, fonts)
- ✅ React Native styling
- ✅ Minor bug fixes
- ⚡ Delivers in minutes

**Full Rebuild Required**:

- ❌ Native code changes (iOS/Android)
- ❌ New native dependencies
- ❌ Permission changes (camera, location)
- ❌ App.json/eas.json changes
- ⏱️ Requires app store review (1-7 days)

### Publishing OTA Updates

```bash
cd apps/listforge-mobile

# Publish to production channel
eas update --branch production --message "Fix login bug"

# Publish to preview channel
eas update --branch preview --message "Test new feature"
```

**How It Works**:

1. You publish update to EAS
2. App checks for updates on launch
3. Downloads new JS bundle in background
4. Applies update on next app restart

**User Experience**:

- Seamless: User doesn't notice update process
- Automatic: No manual download required
- Instant: Available within minutes of publish

### Update Channels

Configure in `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/[project-id]"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

**Channels**:

- `production`: App Store/Play Store releases
- `preview`: TestFlight/internal testing
- `staging`: Staging environment testing

---

## 🤖 GitHub Actions CI/CD

Create automated mobile builds on push to main.

### Workflow File: `.github/workflows/mobile-build.yml`

```yaml
name: Mobile App Build

on:
  push:
    branches: [main]
    paths:
      - 'apps/listforge-mobile/**'
      - 'packages/**'
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - ios
          - android
      profile:
        description: 'Build profile'
        required: true
        default: 'preview'
        type: choice
        options:
          - development
          - preview
          - production

jobs:
  build:
    name: EAS Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build mobile app
        working-directory: apps/listforge-mobile
        run: |
          PLATFORM="${{ github.event.inputs.platform || 'all' }}"
          PROFILE="${{ github.event.inputs.profile || 'preview' }}"

          eas build \
            --platform $PLATFORM \
            --profile $PROFILE \
            --non-interactive \
            --no-wait

  update-ota:
    name: Publish OTA Update
    runs-on: ubuntu-latest
    # Only run OTA updates for JS-only changes
    if: |
      github.event_name == 'push' &&
      !contains(github.event.head_commit.message, '[native]')
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish update
        working-directory: apps/listforge-mobile
        run: |
          eas update \
            --branch production \
            --message "${{ github.event.head_commit.message }}"

  summary:
    name: Build Summary
    runs-on: ubuntu-latest
    needs: [build]
    if: always()
    steps:
      - name: Summary
        run: |
          echo "## Mobile Build Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Platform:** ${{ github.event.inputs.platform || 'all' }}" >> $GITHUB_STEP_SUMMARY
          echo "**Profile:** ${{ github.event.inputs.profile || 'preview' }}" >> $GITHUB_STEP_SUMMARY
          echo "**Commit:** ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "🔍 Check build status: https://expo.dev" >> $GITHUB_STEP_SUMMARY
```

### Required GitHub Secrets

Add to your repository settings:

```
EXPO_TOKEN = [Get from: npx eas-cli token:create]
```

**Optional Secrets** (for automatic submission):

```
APPLE_ID = your-apple-id@example.com
APPLE_APP_SPECIFIC_PASSWORD = [Generate at appleid.apple.com]
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY = [JSON content from Play Console]
```

### Triggering Builds

**Automatic** (on push to main):

```bash
git commit -m "feat: add new feature"
git push origin main
# Automatically triggers preview build
```

**Manual** (via GitHub Actions UI):

1. Go to Actions → Mobile App Build
2. Click "Run workflow"
3. Select platform (iOS/Android/all) and profile
4. Click "Run workflow"

**Force Native Build** (skip OTA):

```bash
git commit -m "[native] Update native dependencies"
git push origin main
# Triggers full native build, skips OTA
```

---

## 🔐 Required Credentials

Store these securely (1Password, AWS Secrets Manager, etc.):

### Expo Account

- **Email**: <team@listforge.com>
- **Password**: [secure password]
- **EXPO_TOKEN**: [Generate via CLI]

### Apple Developer

- **Apple ID**: <team@listforge.com>
- **Team ID**: ABCDE12345
- **App ID**: com.listforge.mobile
- **App Store Connect App ID**: 1234567890

### Google Play

- **Developer Account**: <team@listforge.com>
- **Package Name**: com.listforge.mobile
- **Service Account Key**: google-play-service-account.json

### Sentry

- **DSN**: https://[key]@sentry.io/[project-id]
- **Organization**: listforge
- **Project**: listforge-mobile

---

## 📋 Pre-Production Checklist

Before submitting to app stores:

### 1. Configuration

- [ ] Update `app.json` with production values
  - [ ] Set EAS project ID: `eas init`
  - [ ] Add Sentry DSN
  - [ ] Configure deep linking domain
- [ ] Create `eas.json` with build profiles
- [ ] Add Firebase `google-services.json` (Android)
- [ ] Configure iOS provisioning profiles (EAS handles automatically)

### 2. Assets

- [ ] Create app icon (1024x1024) → `assets/icon.png`
- [ ] Create adaptive icon (Android) → `assets/adaptive-icon.png`
- [ ] Create splash screen → `assets/splash-icon.png`
- [ ] Create favicon → `assets/favicon.png`

### 3. App Store Listings

**iOS (App Store Connect)**:

- [ ] App name, subtitle, description
- [ ] Keywords for search
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] Screenshots (6.5", 6.7" iPhones, 12.9" iPad)
- [ ] Age rating questionnaire
- [ ] Pricing & availability

**Android (Play Console)**:

- [ ] App name, short description, full description
- [ ] Screenshots (phone, tablet, 7" tablet)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Pricing & availability

### 4. Backend API

- [ ] Deploy production API to AWS
- [ ] Configure CORS for mobile app
- [ ] Enable WebSocket support
- [ ] Set up push notification endpoints
- [ ] Configure deep linking redirects

### 5. Testing

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test offline mode / sync
- [ ] Test push notifications
- [ ] Test deep linking
- [ ] Test camera/barcode scanning
- [ ] Test OTA updates

---

## 🎯 Release Strategy

### Beta Testing (Before App Store Release)

**iOS - TestFlight**:

```bash
# Build and submit to TestFlight
eas build --profile preview --platform ios
eas submit --platform ios --latest
```

1. Build goes to TestFlight automatically
2. Add beta testers in App Store Connect
3. Testers receive invitation via email
4. Collect feedback, iterate

**Android - Internal Testing**:

```bash
# Build and submit to internal testing
eas build --profile preview --platform android
eas submit --platform android --latest
```

1. Build goes to "Internal testing" track
2. Add testers via email list
3. Testers download via Play Store link
4. Collect feedback, iterate

### Production Release

**Version Numbering**: Follow semantic versioning

- `1.0.0` - Initial release
- `1.1.0` - Minor features, OTA updates
- `2.0.0` - Major features, breaking changes

**Release Process**:

1. **Build Production**:

   ```bash
   # Update version in app.json
   # "version": "1.1.0"
   eas build --profile production --platform all
   ```

2. **Test Builds**:
   - Download and test on physical devices
   - Verify API connectivity
   - Check all core flows

3. **Submit to Stores**:

   ```bash
   eas submit --platform all --latest
   ```

4. **Monitor Submission**:
   - iOS: Check App Store Connect for review status
   - Android: Check Play Console for review status

5. **Release to Users**:
   - iOS: Manually release in App Store Connect (or auto-release after approval)
   - Android: Choose rollout percentage (start with 10%, increase to 100%)

6. **Post-Release**:
   - Monitor Sentry for crashes
   - Watch app store reviews
   - Respond to user feedback
   - Publish OTA updates for quick fixes

### Staged Rollout (Recommended)

**Android** (built-in):

- Release to 10% of users
- Monitor for 24 hours
- Increase to 50% if stable
- Roll out to 100% after 48 hours

**iOS** (manual):

- Release to specific countries first
- Monitor for issues
- Expand to all countries after validation

---

## 🐛 Troubleshooting

### Build Failures

**Error: "Native module cannot be null"**

- **Cause**: Native dependency not installed
- **Fix**: Run `npx expo install` to ensure all native deps are compatible

**Error: "GoogleService-Info.plist not found" (iOS)**

- **Cause**: Firebase not configured
- **Fix**: Add `google-services.json` for Android, or remove Firebase dependency

**Error: "Keystore not found" (Android)**

- **Cause**: Missing signing credentials
- **Fix**: Let EAS generate keystore: `eas credentials`

### OTA Update Issues

**Update not appearing**:

- Check update channel matches build profile
- Verify `runtimeVersion` hasn't changed (requires full rebuild)
- Force quit and restart app

**Update causing crashes**:

- Roll back via EAS dashboard
- Publish previous version: `eas update --branch production --message "Rollback"`

### Submission Rejected

**iOS - Guideline 4.3 (Spam)**:

- Add unique features differentiating from competitors
- Provide detailed description of unique value prop

**iOS - Guideline 5.1.1 (Privacy)**:

- Update privacy policy with data collection details
- Add purpose strings in app.json (camera, notifications)

**Android - Deceptive Behavior**:

- Ensure app does what description says
- Don't use misleading screenshots
- Declare all permissions used

---

## 📊 Monitoring & Analytics

### Sentry (Error Tracking)

Already configured in `src/config/sentry.ts`:

```typescript
Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDsn,
  environment: __DEV__ ? 'development' : 'production',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

**View Errors**: <https://sentry.io/organizations/[org]/projects/listforge-mobile/>

### Expo Analytics (Basic)

EAS provides basic analytics:

- App downloads
- Active users (DAU, MAU)
- OTA update adoption rate
- Crash-free rate

**View Analytics**: <https://expo.dev/accounts/[account]/projects/listforge-mobile/insights>

### App Store Analytics

**iOS (App Store Connect)**:

- Downloads, updates, deletions
- Impressions, conversion rate
- Crash reports
- User reviews/ratings

**Android (Play Console)**:

- Downloads, installs, uninstalls
- User acquisition sources
- Crash/ANR reports
- User reviews/ratings

---

## 💰 Cost Estimation

### EAS Build

- **Free Tier**: 30 builds/month
- **Production**: $29/month for unlimited builds
- **Estimate**: ~10-20 builds/month (iOS + Android) = Free tier sufficient initially

### App Store Fees

- **Apple Developer**: $99/year
- **Google Play Console**: $25 one-time

### Per-User Costs (None for mobile apps)

- **OTA Updates**: Unlimited, included in EAS
- **Push Notifications**: Expo's push notification service is free

### Total Annual Cost

- Year 1: $124 (Apple $99 + Google $25 + EAS Free)
- Year 2+: $99 (Apple only, assuming free EAS tier)

**Note**: This is for app deployment only. API/infrastructure costs are separate.

---

## 🔗 Quick Reference

### Essential Commands

```bash
# Login
eas login

# Initialize project
eas init

# Build
eas build --profile production --platform all

# Submit
eas submit --platform all --latest

# OTA update
eas update --branch production --message "Bug fix"

# Check build status
eas build:list

# View credentials
eas credentials

# Update metadata
eas metadata:push
```

### Useful Links

- **EAS Dashboard**: <https://expo.dev>
- **EAS Documentation**: <https://docs.expo.dev/eas/>
- **App Store Connect**: <https://appstoreconnect.apple.com>
- **Google Play Console**: <https://play.google.com/console>
- **Sentry Dashboard**: <https://sentry.io>

### Support

- **Expo Discord**: <https://chat.expo.dev>
- **Expo Forums**: <https://forums.expo.dev>
- **Stack Overflow**: Tag with `expo` and `react-native`

---

## 📈 Comparison with AWS Deployment

| Aspect | Web/API (AWS) | Mobile (EAS) |
|--------|---------------|--------------|
| **Build Time** | ~5 minutes | ~15-20 minutes |
| **Deploy Time** | Instant | 1-7 days (app store review) |
| **Update Mechanism** | Container restart | App store update or OTA |
| **Rollback** | Instant | Via OTA update |
| **Cost** | Infrastructure-based | Per-build or subscription |
| **User Control** | None (instant) | Manual update or auto-update |
| **Monitoring** | CloudWatch | Sentry + App Store analytics |
| **CI/CD** | GitHub Actions → AWS | GitHub Actions → EAS → App Stores |

**Key Takeaway**: Mobile deployment is more structured and slower due to app store review, but offers better user experience and native capabilities.

---

## ✅ Next Steps

1. **Set up EAS project**: `eas init`
2. **Create eas.json**: Use template above
3. **Configure app store accounts**: Apple Developer + Google Play
4. **Run first build**: `eas build --profile preview --platform all`
5. **Test on devices**: Download builds and verify functionality
6. **Create GitHub workflow**: Add mobile-build.yml
7. **Submit to beta testers**: TestFlight and internal testing
8. **Iterate based on feedback**
9. **Submit to production**: App Store and Play Store
10. **Set up monitoring**: Sentry, app store analytics

**Estimated Timeline**:

- Initial setup: 1-2 days
- Beta testing: 1-2 weeks
- App store review: 1-7 days
- **Total**: 2-4 weeks for first release

---

**Last Updated**: 2025-12-09
**Version**: 1.0.0

For questions or issues, reference the [Expo Documentation](https://docs.expo.dev) or contact the development team.
