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

### ✅ Phase 1: Foundation (Complete)
- Expo project setup with TypeScript
- NativeWind styling configuration
- Redux store with auth and sync slices
- React Navigation with bottom tabs
- API service with RTK Query
- Login screen with secure storage
- Network connectivity monitoring

### 🚧 Phase 2: Offline Capture (In Progress)
- SQLite database for pending captures
- Camera integration with photo management
- Offline sync service with background tasks

### ⏳ Upcoming Phases
- Phase 3: Barcode Auto-Scan
- Phase 4: Review Flow
- Phase 5: Chat Interface
- Phase 6: Quick Evaluation
- Phase 7: Push Notifications
- Phase 8: Deep Linking
- Phase 9: Polish & Sentry
- Phase 10: App Store Preparation

## Building for Production

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Sentry Configuration

Add your Sentry configuration to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org",
          "project": "listforge-mobile"
        }
      ]
    ]
  }
}
```

## License

Private - ListForge
