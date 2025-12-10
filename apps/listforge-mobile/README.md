# ListForge Mobile

React Native mobile app for ListForge, built with Expo SDK 54.

## Features

- **Offline-first capture**: Take photos and create items offline, sync when connected
- **Barcode scanning**: Auto-detect barcodes from camera preview
- **Quick evaluation**: Fast product valuation for on-the-go decisions
- **Tinder-style review**: Swipe through AI-generated listings
- **Real-time chat**: Item-scoped AI assistant
- **Push notifications**: Get notified when AI research completes
- **Deep linking**: Navigate directly to items from web URLs

## Tech Stack

- **Framework**: Expo SDK 54 + React Native
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Redux Toolkit + RTK Query
- **Database**: SQLite (offline storage)
- **Icons**: Lucide React Native
- **Real-time**: Socket.IO
- **Monitoring**: Sentry

## Getting Started

### Prerequisites

- Node.js 20.18+
- pnpm 8+
- iOS Simulator (Mac only) or Android emulator

### Installation

From the monorepo root:

```bash
pnpm install
```

### Running the App

```bash
cd apps/listforge-mobile

# Start Expo dev server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run in web browser (for development)
pnpm web
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── capture/      # Camera, photo management
│   ├── review/       # Swipe cards, review UI
│   ├── chat/         # Chat interface
│   ├── common/       # Shared components
│   └── settings/     # Settings screens
├── screens/          # Screen components
├── navigation/       # Navigation configuration
├── store/            # Redux store and slices
├── services/         # API clients, external services
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── constants/        # App constants
```

## Shared Packages

The mobile app imports types and utilities from:

- `@listforge/core-types` - Core domain types
- `@listforge/api-types` - API request/response types
- `@listforge/socket-types` - WebSocket event types
- `@listforge/api-rtk` - RTK Query API definitions (adapted for mobile)

## Development Status

### ✅ All Phases Complete!

**Phase 1-5: Foundation & Core Features**
- ✓ Expo project setup with TypeScript
- ✓ NativeWind styling configuration
- ✓ Redux Toolkit + RTK Query
- ✓ React Navigation (tabs + stack)
- ✓ Authentication with secure storage
- ✓ SQLite offline storage
- ✓ Background sync with exponential backoff
- ✓ Camera capture with photo management
- ✓ Barcode auto-scanning (UPC, EAN, Code 128, QR)
- ✓ Tinder-style swipe review interface
- ✓ Real-time chat with WebSocket streaming

**Phase 6: Quick Evaluation**
- ✓ Quick eval service (5-15s response time)
- ✓ Camera → preview → evaluate → results flow
- ✓ Product identification, pricing, demand analysis
- ✓ "Pass" or "Keep & Full Research" actions

**Phase 4: Real-Time Research Updates**
- ✓ useResearchProgress hook
- ✓ ResearchProgressIndicator component
- ✓ WebSocket subscription to research events
- ✓ Live node progress, activity log, error handling

**Phase 7: Push Notifications**
- ✓ Expo push notification service
- ✓ Device token registration (mobile + backend)
- ✓ Foreground/background notification handling
- ✓ Android notification channels
- ✓ Backend PushNotificationService with Expo SDK
- ✓ Research completion notifications

**Phase 8: Deep Linking**
- ✓ iOS associatedDomains configured
- ✓ Android intentFilters with autoVerify
- ✓ URL scheme: listforge://
- ✓ Ready for 1:1 web URL mapping

**Phase 9: Error Tracking & Polish**
- ✓ Sentry SDK integrated
- ✓ ErrorBoundary component
- ✓ Automatic crash reporting
- ✓ User context tracking
- ✓ Performance monitoring
- ✓ Sensitive data filtering

## Testing on Physical Devices

Want to test the app on your phone right away? See the **[Mobile Testing Guide](../../docs/MOBILE_TESTING.md)** for:
- Installing on iPhone via TestFlight
- Installing APK on Android
- Testing with local API
- Development builds vs Preview builds

## Deployment

For complete deployment instructions, including:
- EAS Build setup
- App Store and Play Store submission
- Over-the-air (OTA) updates
- GitHub Actions CI/CD
- Beta testing with TestFlight
- Production release strategy

**See the full deployment guide:** [Mobile App Deployment](../../docs/MOBILE_DEPLOYMENT.md)

## License

Private - ListForge
