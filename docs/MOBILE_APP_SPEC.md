# ListForge Mobile App Specification

> **⚠️ PLANNING DOCUMENT**
> This is a detailed specification for the mobile app. Implementation is in early stages (`apps/listforge-mobile`).
> The app currently exists only as Expo scaffolding. This document serves as the implementation roadmap.

**Version:** 2.0
**Status:** Planning / Not Yet Implemented
**Date:** December 2024

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Core Features Specification](#4-core-features-specification)
5. [Barcode Auto-Scan Feature](#5-barcode-auto-scan-feature)
6. [Quick Evaluation Feature](#6-quick-evaluation-feature)
7. [Offline Capture System](#7-offline-capture-system)
8. [Push Notifications](#8-push-notifications)
9. [Deep Linking](#9-deep-linking)
10. [Integration Points](#10-integration-points)
11. [User Flow Diagrams](#11-user-flow-diagrams)
12. [Implementation Phases](#12-implementation-phases)
13. [Technical Details](#13-technical-details)
14. [Confirmed Decisions](#14-confirmed-decisions)

---

## 1. Executive Summary

### 1.1 Product Vision

ListForge Mobile is a **companion app** to the feature-rich web application, designed for two primary use cases:

1. **Quick Evaluation Users** - Field researchers who need fast value assessments before committing to purchase
2. **Power Users/Resellers** - High-volume operators who need rapid photo capture to feed the autonomous AI pipeline

### 1.2 Design Philosophy

- **Simple, not fancy** - Prioritize speed and reliability over visual polish
- **Capture-first** - The mobile app excels at photo capture; heavy processing remains on web
- **Same AI pipeline** - No mobile-specific research flows; leverage existing LangGraph infrastructure
- **Tinder-style review** - Fast binary decisions with swipe gestures
- **Offline-resilient** - Full capture capability regardless of connectivity

### 1.3 Scope Boundaries

**In Scope (MVP):**
- Photo capture with camera integration
- Barcode auto-scan with instant lookup
- Quick Evaluation mode (shortened research flow)
- Swipe-based review interface
- Chat interface
- Full offline capture with automatic sync
- Push notifications for research completion
- Deep linking from web URLs
- Basic settings and marketplace connections view

**Out of Scope (Future):**
- Full item editing capabilities
- Manual item creation forms
- Marketplace publishing controls
- Admin features
- Complex filtering/search

---

## 2. Technology Stack

### 2.1 Confirmed Stack: Expo + NativeWind

**Expo (SDK 52+) with NativeWind** is the confirmed technology stack.

#### Why Expo?

| Factor | Expo Advantage |
|--------|---------------|
| **TypeScript Native** | First-class TypeScript support; can directly import your existing `@listforge/*` packages |
| **Camera/Image** | `expo-camera` and `expo-image-picker` are mature, well-maintained, and improved in SDK 52 |
| **Barcode Scanning** | `expo-camera` includes built-in barcode detection with ML Kit |
| **Build Tooling** | EAS Build handles iOS/Android builds without local Xcode/Android Studio setup |
| **Code Sharing** | React-based; same mental model as your web app |
| **OTA Updates** | EAS Update allows pushing fixes without app store review |
| **Push Notifications** | `expo-notifications` with FCM/APNs support |
| **Maturity** | Used by Discord, Shopify, and thousands of production apps |

#### Why NativeWind over Tamagui?

| Factor | NativeWind Advantage |
|--------|---------------------|
| **Tailwind Familiarity** | Your team already uses TailwindCSS on web; identical utility classes |
| **Performance** | Compiles to `StyleSheet.create` at build time; comparable to raw StyleSheet |
| **Web Parity** | Same class names as your web app's Tailwind setup |
| **Simpler Migration** | Copy UI patterns directly from web; minimal translation needed |
| **Active Development** | v4 (2024) brings significant improvements and stability |

### 2.2 Full Stack Summary

```
Mobile App Stack
================
Framework:       Expo SDK 52+ (React Native)
Language:        TypeScript (strict mode)
Styling:         NativeWind v4 (TailwindCSS for React Native)
State:           Redux Toolkit + RTK Query (reuse @listforge/api-rtk)
Navigation:      Expo Router (file-based routing, similar to TanStack Router)
Camera:          expo-camera (with barcode scanning)
Image Picker:    expo-image-picker
Local Storage:   expo-sqlite + expo-file-system (offline queue)
Secure Storage:  expo-secure-store (auth tokens)
Notifications:   expo-notifications + FCM
Sockets:         socket.io-client (same as web)
Forms:           React Hook Form + Zod (same as web)
Crash Reporting: Sentry (@sentry/react-native)
Deep Linking:    expo-linking + Universal Links / App Links
```

### 2.3 Code Reuse Strategy

**Direct Reuse (No Changes):**
- `@listforge/core-types` - All type definitions
- `@listforge/api-types` - API request/response types
- `@listforge/socket-types` - WebSocket event types

**Partial Reuse (With Adaptation):**
- `@listforge/api-rtk` - RTK Query hooks work directly; socket hooks need minor platform adaptation

**Not Reusable (Mobile-Specific):**
- UI components (web uses shadcn/ui; mobile needs native components)
- Navigation (TanStack Router vs Expo Router)
- File/image handling (different APIs)

---

## 3. Architecture

### 3.1 Monorepo Integration

```
list-forge-monorepo/
├── apps/
│   ├── listforge-api/          # NestJS backend (with new endpoints)
│   ├── listforge-web/          # React web app (unchanged)
│   └── listforge-mobile/       # NEW: Expo mobile app
│       ├── app/                # Expo Router pages
│       ├── components/         # Mobile-specific components
│       ├── hooks/              # Mobile-specific hooks
│       ├── services/           # Offline sync, notifications, etc.
│       ├── database/           # SQLite schema and migrations
│       ├── utils/              # Mobile utilities
│       ├── app.json            # Expo config
│       ├── tailwind.config.js  # NativeWind config
│       └── package.json
├── packages/
│   ├── core-types/             # Shared (reused)
│   ├── api-types/              # Shared (reused)
│   ├── api-rtk/                # Shared (reused with adaptation)
│   ├── socket-types/           # Shared (reused)
│   └── mobile-ui/              # NEW: Mobile component library
│       ├── components/
│       │   ├── SwipeCard.tsx
│       │   ├── CaptureButton.tsx
│       │   ├── PhotoGrid.tsx
│       │   ├── BarcodeOverlay.tsx
│       │   ├── SyncStatusBadge.tsx
│       │   └── ...
│       └── package.json
```

### 3.2 Package Dependencies

```
@listforge/mobile (apps/listforge-mobile)
├── @listforge/core-types
├── @listforge/api-types
├── @listforge/api-rtk (with platform shims)
├── @listforge/socket-types
└── @listforge/mobile-ui

@listforge/mobile-ui (packages/mobile-ui)
├── @listforge/core-types
└── nativewind
```

### 3.3 State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App State                        │
├─────────────────────────────────────────────────────────────┤
│  Redux Store (same structure as web + offline additions)    │
│  ├── api (RTK Query cache)                                  │
│  │   ├── items                                              │
│  │   ├── researchRuns                                       │
│  │   └── chatSessions                                       │
│  ├── auth                                                   │
│  │   ├── token                                              │
│  │   └── user                                               │
│  ├── offline (mobile-specific)                              │
│  │   ├── syncStatus: 'idle' | 'syncing' | 'error'           │
│  │   ├── pendingCount: number                               │
│  │   └── lastSyncAt: Date | null                            │
│  └── ui (mobile-specific)                                   │
│      ├── swipePosition                                      │
│      └── barcodeDetection                                   │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database (offline persistence)                      │
│  ├── pending_captures (photos + metadata awaiting upload)   │
│  ├── capture_photos (blob references)                       │
│  └── sync_log (audit trail)                                 │
├─────────────────────────────────────────────────────────────┤
│  Local State (React useState/useReducer)                    │
│  ├── Camera state                                           │
│  ├── Photo preview/editing                                  │
│  └── Form inputs                                            │
├─────────────────────────────────────────────────────────────┤
│  Persistent Storage (expo-secure-store)                     │
│  ├── Auth tokens                                            │
│  └── User preferences                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Core Features Specification

### 4.1 Capture Flow

The capture flow is the **primary mobile use case** - getting photos into the system quickly.

#### 4.1.1 Capture Screen Layout

```
┌─────────────────────────────────────────┐
│  [<]  Capture              [Sync: 3]    │  <- Header with pending sync count
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │      ┌───────────────────┐      │    │
│  │      │ BARCODE DETECTED  │      │    │  <- Auto-scan overlay (when visible)
│  │      │   [||||||||||||]  │      │    │
│  │      └───────────────────┘      │    │
│  │                                 │    │
│  │         CAMERA PREVIEW          │    │
│  │    (with real-time barcode      │    │
│  │     detection running)          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ [+]     │  <- Photo strip (scrollable)
│  │ 1 │ │ 2 │ │ 3 │ │   │ │   │         │
│  └───┘ └───┘ └───┘ └───┘ └───┘         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  What is this? (optional)       │    │  <- Title hint (collapsed by default)
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     [CAPTURE]  or  [QUICK EVAL] │    │  <- Primary actions
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

#### 4.1.2 Capture Flow States

```
State Machine: Capture Flow
============================

[CAMERA_READY]
    │
    ├── Barcode detected ──→ [BARCODE_LOOKUP] (automatic, no button press)
    │                              │
    │                              ├── Product found ──→ [QUICK_EVAL_RESULTS]
    │                              │
    │                              └── Not found ──→ Show "No match" toast
    │                                               Continue with photo capture
    │
    ├── User taps shutter ──→ [PHOTO_TAKEN]
    │                              │
    │                              ├── Accept ──→ Photo added to strip
    │                              │              Back to [CAMERA_READY]
    │                              │
    │                              └── Retake ──→ [CAMERA_READY]
    │
    └── User taps gallery ──→ [PICKING_FROM_GALLERY]
                                   │
                                   └── Select photos ──→ Photos added to strip
                                                        Back to [CAMERA_READY]

When photos.length > 0:
    │
    ├── Tap "CAPTURE" ──→ [SAVING_LOCALLY]
    │                         │
    │                         └── Saved to SQLite ──→ [QUEUED_FOR_SYNC]
    │                                                      │
    │                              ┌───────────────────────┴──────────────────┐
    │                              │                                          │
    │                        (Online)                                   (Offline)
    │                              │                                          │
    │                              ▼                                          ▼
    │                     [UPLOADING]                              [PENDING_OFFLINE]
    │                         │                                          │
    │                         ├── Success ──→ [CAPTURE_COMPLETE]         │
    │                         │                                          │
    │                         └── Failure ──→ [PENDING_OFFLINE] ←────────┘
    │
    └── Tap "QUICK EVAL" ──→ [QUICK_EVAL_MODE] (see Section 6)
```

#### 4.1.3 Photo Management

**Photo Strip Behaviors:**
- Tap photo to view full-screen with zoom
- Long-press to delete
- Drag to reorder
- First photo auto-marked as primary (star badge)
- Maximum 20 photos per capture session

**Photo Quality:**
- Capture at highest device resolution
- Compress to 2048px max dimension for upload
- WebP format for efficiency
- Original EXIF data preserved for OCR hints

#### 4.1.4 Capture Submission

When user taps "CAPTURE":

1. **Immediate local save** - Photos saved to SQLite + filesystem instantly
2. **Success feedback** - "Item saved! Syncing..." (or "Saved offline" if no connection)
3. **Background sync** - Queue processed automatically when online
4. **Progress indicator** - Header badge shows pending sync count
5. **User can continue** - Start next capture immediately

See **Section 7: Offline Capture System** for full technical details.

---

### 4.2 Review Flow (Tinder-Style Swipe Interface)

The review flow enables **rapid binary decisions** on AI-processed items.

#### 4.2.1 Review Screen Layout

```
┌─────────────────────────────────────────┐
│  [<]  Review (12 remaining)      [...]  │  <- Header with count
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │    ┌───────────────────────┐    │    │
│  │    │                       │    │    │
│  │    │    PRIMARY PHOTO      │    │    │
│  │    │    (swipeable)        │    │    │
│  │    │                       │    │    │
│  │    └───────────────────────┘    │    │
│  │                                 │    │
│  │  iPhone 15 Pro Max 256GB       │    │  <- AI-generated title
│  │  Unlocked | Excellent | Black  │    │  <- Key attributes
│  │                                 │    │
│  │  ┌─────────────────────────┐   │    │
│  │  │  $899 - $1,049 - $1,199 │   │    │  <- Price bands
│  │  │  floor   target  ceiling│   │    │
│  │  └─────────────────────────┘   │    │
│  │                                 │    │
│  │  Confidence: 94% ||||||||--    │    │  <- AI confidence
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│   <- SWIPE LEFT        SWIPE RIGHT ->   │
│     (Reject)            (Approve)       │
│                                         │
│  ┌─────┐              ┌─────────┐       │
│  │  X  │              │    V    │       │  <- Tap alternatives
│  └─────┘              └─────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

#### 4.2.2 Swipe Card Data Display

Each card shows a **condensed view** of the item:

**Always Visible:**
- Primary photo (full card background or hero image)
- AI-generated title
- Key attributes (3-4 max): condition, brand, model, color
- Price recommendation (target price prominent, floor/ceiling smaller)
- AI confidence score (visual bar + percentage)

**Swipe to Reveal (Optional Detail Views):**
- Swipe UP on card: See more photos in carousel
- Tap card: Expand to see full description
- Long press: Open chat to ask questions

**Data Source:**
```typescript
// From existing API - GET /items/review/ai-queue
interface ReviewCardData {
  id: string;
  title: string;
  primaryImageUrl: string;
  media: ItemMedia[];
  condition: ItemCondition;
  attributes: ItemAttribute[];
  defaultPrice: number;
  aiConfidenceScore: number;
  // From latest research
  priceBands?: PriceBand[];
  demandSignals?: DemandSignal[];
}
```

#### 4.2.3 Swipe Mechanics

**Gesture Recognition:**
- **Swipe Right (>100px)** -> Approve item
- **Swipe Left (>100px)** -> Reject item
- **Partial swipe (<100px)** -> Spring back to center
- **Velocity-based** -> Fast swipe triggers action at 50px

**Visual Feedback:**
- Card rotates slightly in swipe direction
- Green tint overlay when swiping right
- Red tint overlay when swiping left
- "APPROVE" / "REJECT" stamp appears at threshold

**Haptic Feedback:**
- Light haptic at swipe threshold
- Medium haptic on action commit

#### 4.2.4 Action Handling

**On Approve (Swipe Right):**
```typescript
// POST /items/:id/review/ai-approve
await api.approveItem(itemId);
// Card animates off-screen right
// Next card slides in from bottom
// Success haptic + subtle sound
```

**On Reject (Swipe Left):**
```typescript
// POST /items/:id/review/ai-reject
await api.rejectItem({ id: itemId });
// Card animates off-screen left
// Next card slides in from bottom
// Item moves to "Needs Work" queue (web editing)
```

**Undo Support:**
- Toast appears for 3 seconds: "Approved! [UNDO]"
- Undo reverses the action and brings card back
- Only available for most recent action

#### 4.2.5 Empty State

When queue is empty:
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│     All caught up!                      │
│                                         │
│     No items waiting for review.        │
│     Capture more items to continue.     │
│                                         │
│     [CAPTURE MORE]                      │
│                                         │
└─────────────────────────────────────────┘
```

---

### 4.3 Chat Interface

The chat interface allows users to **ask questions about items** or **request actions**.

#### 4.3.1 Chat Screen Layout

```
┌─────────────────────────────────────────┐
│  [<]  Chat              [New Session]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Context: iPhone 15 Pro Max      │    │  <- Context badge (tappable)
│  │ [Change Item v]                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ User: What's the best price for │    │
│  │       quick sale?               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ AI: Based on recent sales, I'd  │    │
│  │     recommend $899 for a quick  │    │
│  │     sale (7-10 days). The       │    │
│  │     target price of $1,049      │    │
│  │     might take 2-3 weeks.       │    │
│  │                                 │    │
│  │    [Set Price to $899]          │    │  <- Action button
│  │    [Set Price to $1,049]        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Searching for comparables...    │    │  <- Tool progress indicator
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────┐ [>]   │
│  │  Ask about this item...     │        │  <- Input field
│  └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

#### 4.3.2 Chat Features

**Context Awareness:**
- Chat is item-scoped by default (from review or item detail)
- Can switch context to different items
- General chat (no item context) also available

**Streaming Responses:**
- Uses existing WebSocket infrastructure
- Token-by-token streaming display
- Tool progress indicators (same as web)

**Action Buttons:**
- AI can suggest actions (same as web)
- Tap to execute (with confirmation for destructive actions)
- Actions use existing `applyAction` socket event

**Mobile Optimizations:**
- Keyboard-aware scrolling
- Pull-to-refresh for message history
- Voice input support (native keyboard)
- Simplified markdown rendering

#### 4.3.3 Chat Integration Points

```typescript
// Reuse existing hooks with minimal adaptation
import { useChatSocket } from '@listforge/api-rtk';

function ChatScreen() {
  const {
    streamingContent,
    sendMessage,
    isConnected,
    activeTools,
    suggestedActions
  } = useChatSocket(sessionId, onMessage);

  // Same API, same behavior as web
}
```

---

### 4.4 Settings & Marketplace Connections

**Settings Screen (Read-Only for MVP):**

```
┌─────────────────────────────────────────┐
│  [<]  Settings                          │
├─────────────────────────────────────────┤
│                                         │
│  ACCOUNT                                │
│  |-- Email: user@example.com            │
│  |-- Organization: Acme Resellers       │
│                                         │
│  MARKETPLACE CONNECTIONS                │
│  |-- eBay [checkmark] Connected         │
│  |   Last sync: 2 hours ago             │
│  |-- Amazon [checkmark] Connected       │
│  |   Last sync: 1 hour ago              │
│  |-- [Manage on Web ->]                 │  <- Deep link to web
│                                         │
│  SYNC STATUS                            │
│  |-- Pending uploads: 3                 │
│  |-- Last sync: 5 minutes ago           │
│  |-- [Sync Now]                         │
│                                         │
│  APP SETTINGS                           │
│  |-- Camera Quality: High               │
│  |-- Haptic Feedback: On                │
│  |-- Notifications: On                  │
│                                         │
│  [SIGN OUT]                             │
│                                         │
└─────────────────────────────────────────┘
```

**MVP Scope:**
- View connected accounts (read-only)
- Cannot add/remove marketplace connections (do on web)
- Offline sync status and manual sync trigger
- Basic app preferences
- Sign out functionality

---

## 5. Barcode Auto-Scan Feature

### 5.1 Overview

The camera preview continuously scans for barcodes in real-time. When a barcode is detected, the app **automatically** triggers a quick lookup - no button press required.

### 5.2 Supported Barcode Formats

| Format | Use Case |
|--------|----------|
| **UPC-A** | Standard US retail products (12 digits) |
| **UPC-E** | Compressed UPC for small items (6 digits) |
| **EAN-13** | International retail products (13 digits) |
| **EAN-8** | Small international products (8 digits) |
| **Code 128** | Shipping, logistics |
| **Code 39** | Automotive, defense |
| **QR Code** | Product info pages, manufacturer codes |

### 5.3 Auto-Scan Flow

```
┌─────────────────────────────────────────┐
│            CAMERA PREVIEW               │
│                                         │
│     ┌─────────────────────────────┐     │
│     │   ||||||||||||||||||||||||  │     │  <- Barcode enters frame
│     │        UPC-A Detected       │     │
│     └─────────────────────────────┘     │
│                                         │
│     [Scanning overlay + haptic]         │
│                                         │
└─────────────────────────────────────────┘
                    │
                    │ (Automatic - no button press)
                    ▼
┌─────────────────────────────────────────┐
│           LOOKUP IN PROGRESS            │
│                                         │
│     ┌─────────────────────────────┐     │
│     │   012345678901              │     │
│     │   Looking up product...     │     │
│     │   [||||||||------]          │     │
│     └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ PRODUCT FOUND │       │  NOT FOUND    │
│               │       │               │
│ -> Quick Eval │       │ Toast: "No    │
│    Results    │       │  product      │
│    Screen     │       │  found"       │
│               │       │               │
│               │       │ Continue with │
│               │       │ photo capture │
└───────────────┘       └───────────────┘
```

### 5.4 Auto-Scan UI States

#### 5.4.1 Scanning State (Default)

Camera preview shows a subtle scanning region indicator:

```
┌─────────────────────────────────────────┐
│                                         │
│     ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐     │
│                                         │
│     │                           │       │  <- Subtle dashed border
│           CAMERA PREVIEW                │     indicating scan zone
│     │                           │       │
│                                         │
│     └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘     │
│                                         │
│     Point camera at barcode             │  <- Helper text
│                                         │
└─────────────────────────────────────────┘
```

#### 5.4.2 Detection State

When barcode detected, highlight and auto-trigger:

```
┌─────────────────────────────────────────┐
│                                         │
│     ┌═══════════════════════════════┐   │
│     ║  ||||||||||||||||||||||||     ║   │  <- Solid border highlight
│     ║                               ║   │
│     ║     BARCODE DETECTED          ║   │  <- Green highlight overlay
│     ║     Looking up...             ║   │
│     ║                               ║   │
│     └═══════════════════════════════┘   │
│                                         │
│     [Haptic feedback triggered]         │
│                                         │
└─────────────────────────────────────────┘
```

### 5.5 Barcode Detection Implementation

```typescript
// components/capture/CameraView.tsx
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

const BARCODE_TYPES = [
  'upc_a', 'upc_e', 'ean13', 'ean8',
  'code128', 'code39', 'qr'
];

// Debounce to prevent multiple triggers for same barcode
const SCAN_COOLDOWN_MS = 3000;

export function CaptureCamera({ onBarcodeDetected, onPhotoTaken }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    const { data, type } = result;
    const now = Date.now();

    // Debounce: ignore if same barcode scanned recently
    if (
      data === lastScannedRef.current &&
      now - lastScanTimeRef.current < SCAN_COOLDOWN_MS
    ) {
      return;
    }

    // Prevent concurrent processing
    if (isProcessingBarcode) return;

    lastScannedRef.current = data;
    lastScanTimeRef.current = now;
    setIsProcessingBarcode(true);

    // Haptic feedback on detection
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Trigger lookup
    try {
      await onBarcodeDetected({ barcode: data, format: type });
    } finally {
      setIsProcessingBarcode(false);
    }
  }, [isProcessingBarcode, onBarcodeDetected]);

  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{
        barcodeTypes: BARCODE_TYPES,
      }}
      onBarcodeScanned={handleBarcodeScanned}
    >
      <BarcodeOverlay isProcessing={isProcessingBarcode} />
    </CameraView>
  );
}
```

### 5.6 Barcode Lookup API

#### 5.6.1 New Backend Endpoint

```typescript
// POST /items/barcode-lookup
interface BarcodeLookupRequest {
  barcode: string;
  format: string; // 'upc_a', 'ean13', etc.
}

interface BarcodeLookupResponse {
  found: boolean;
  product?: {
    name: string;
    brand?: string;
    model?: string;
    category?: string;
    imageUrl?: string;
    attributes: Record<string, string>;
  };
  pricing?: {
    floor: number;
    target: number;
    ceiling: number;
    currency: string;
    confidence: number;
  };
  demand?: {
    level: 'low' | 'medium' | 'high';
    daysToSell: { min: number; max: number };
  };
}
```

#### 5.6.2 Backend Implementation Notes

The barcode lookup endpoint should:

1. First check internal database for cached UPC data
2. If not found, query external APIs (UPC Database, Amazon Product API, etc.)
3. If product found, run abbreviated pricing lookup (similar to Quick Eval)
4. Cache results for future lookups
5. Return within 2-5 seconds target

**Integration with existing services:**
- Use `UpcLookupService` (existing) for product identification
- Use `PricingStrategyService` (existing) for price calculation
- May leverage `KeepaService` (existing) for Amazon pricing data

### 5.7 Barcode to Quick Eval Handoff

When barcode lookup succeeds, results flow directly to Quick Eval display:

```typescript
// hooks/useBarcodeCapture.ts
export function useBarcodeCapture() {
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResponse | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleBarcodeDetected = async ({ barcode, format }) => {
    setIsLookingUp(true);

    try {
      const result = await api.barcodeLookup({ barcode, format });
      setLookupResult(result);

      if (result.found) {
        // Show Quick Eval results modal
        navigation.navigate('QuickEvalResults', {
          source: 'barcode',
          barcode,
          result,
        });
      } else {
        // Show toast and continue with photo capture
        Toast.show({
          type: 'info',
          text1: 'Product not found',
          text2: 'Continue with photo capture',
        });
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  return { handleBarcodeDetected, lookupResult, isLookingUp };
}
```

---

## 6. Quick Evaluation Feature

This is a **new feature** - a shortened research flow for field evaluation.

### 6.1 Use Case

User is at an estate sale, thrift store, or auction. They need to quickly determine:
1. **What is this item?** (identification)
2. **What's it worth?** (price range)
3. **Should I buy it?** (go/no-go decision)

They do NOT need:
- Full marketplace listing assembly
- Detailed competitor analysis
- All demand signals

### 6.2 Quick Eval Entry Points

1. **Barcode Auto-Scan** - Automatic when barcode detected (no button press)
2. **"Quick Eval" Button** - After taking photos, tap Quick Eval instead of Capture

### 6.3 Quick Eval Flow

```
┌─────────────────────────────────────────┐
│  [<]  Quick Eval                        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         PHOTO PREVIEW           │    │
│  │      (1-3 photos shown)         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Identifying...                 │    │  <- Progress indicator
│  │  ||||||||------------------     │    │
│  └─────────────────────────────────┘    │
│                                         │
│                 |                       │
│        (After 5-15 seconds)             │
│                 v                       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  iPhone 15 Pro Max              │    │  <- Identified product
│  │     256GB | Black | Unlocked    │    │
│  │     Confidence: 92%             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │        PRICE RANGE              │    │
│  │                                 │    │
│  │    $899 ------*------ $1,199    │    │
│  │           $1,049                │    │
│  │         (likely price)          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  High Demand                    │    │  <- Simple demand indicator
│  │  Typically sells in 7-14 days   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐  ┌────────────────┐       │
│  │  PASS    │  │  KEEP & FULL   │       │  <- Action buttons
│  │          │  │   RESEARCH     │       │
│  └──────────┘  └────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

### 6.4 Quick Eval Technical Design

#### 6.4.1 New API Endpoint

```typescript
// POST /items/quick-eval
// Request
interface QuickEvalRequest {
  photos: File[]; // 1-5 photos
  hint?: string;  // Optional "what is this"
  barcode?: string; // If triggered from barcode scan
}

// Response
interface QuickEvalResponse {
  evalId: string;
  status: 'processing' | 'complete' | 'error';
  identification?: {
    productName: string;
    brand?: string;
    model?: string;
    attributes: Record<string, string>;
    confidence: number;
  };
  pricing?: {
    floor: number;
    target: number;
    ceiling: number;
    currency: string;
    confidence: number;
  };
  demand?: {
    level: 'low' | 'medium' | 'high';
    daysToSell: { min: number; max: number };
  };
  error?: string;
}
```

#### 6.4.2 Quick Eval Pipeline

This runs a **subset** of the existing research graph:

```
Quick Eval Pipeline (Simplified Research Graph)
================================================

[load_context] --> [extract_identifiers] --> [deep_identify] --> [search_comps]
                                                                      |
                                                                      v
                                                            [calculate_price]
                                                                      |
                                                                      v
                                                              [return_result]

EXCLUDED from Quick Eval:
- analyze_media (full analysis)
- detect_marketplace_schema
- assemble_listing
- persist_results
- Full comp validation
```

**Time Target:** 5-15 seconds for complete Quick Eval

#### 6.4.3 Quick Eval Actions

**"PASS" Button:**
- Discards the evaluation
- No item created in system
- Returns to capture screen

**"KEEP & FULL RESEARCH" Button:**
- Creates full Item entity
- Queues complete research pipeline
- Item appears in Review Queue
- User continues with next capture

### 6.5 Quick Eval Backend Changes Required

**New Endpoint:** `POST /items/quick-eval`

**New Endpoint:** `POST /items/barcode-lookup`

**New Research Run Type:** `'quick_eval'`

**New Research Graph Variant:** `quickEvalGraph` (subset of researchGraph)

**Changes to Existing:**
- `ResearchRunType` enum: add `'quick_eval'`
- Research graph builder: add `buildQuickEvalGraph()` method
- Items controller: add `quickEval()` and `barcodeLookup()` endpoints

---

## 7. Offline Capture System

### 7.1 Overview

The mobile app supports **full offline capture** with automatic synchronization when connectivity is restored. Users can capture items regardless of network availability.

### 7.2 Offline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE CAPTURE SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   CAPTURE   │────>│   SQLite    │────>│  SYNC       │   │
│  │   PHOTOS    │     │   DATABASE  │     │  SERVICE    │   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘   │
│                             │                    │          │
│                             v                    │          │
│                      ┌─────────────┐             │          │
│                      │   LOCAL     │             │          │
│                      │   FILE      │             │          │
│                      │   SYSTEM    │             │          │
│                      └─────────────┘             │          │
│                                                  v          │
│                                          ┌─────────────┐   │
│                                          │   API       │   │
│                                          │   SERVER    │   │
│                                          └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Database Schema

```sql
-- SQLite Database Schema

-- Pending captures awaiting upload
CREATE TABLE pending_captures (
  id TEXT PRIMARY KEY,                    -- UUID
  created_at INTEGER NOT NULL,            -- Unix timestamp
  updated_at INTEGER NOT NULL,            -- Unix timestamp
  title_hint TEXT,                        -- Optional user hint
  barcode TEXT,                           -- If from barcode scan
  barcode_format TEXT,                    -- 'upc_a', 'ean13', etc.
  capture_type TEXT NOT NULL,             -- 'standard' | 'quick_eval'
  sync_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'syncing' | 'synced' | 'failed'
  sync_attempts INTEGER NOT NULL DEFAULT 0,
  last_sync_attempt INTEGER,              -- Unix timestamp
  sync_error TEXT,                        -- Last error message
  server_item_id TEXT,                    -- ID returned from server after sync
  metadata TEXT                           -- JSON blob for additional data
);

-- Photos associated with pending captures
CREATE TABLE capture_photos (
  id TEXT PRIMARY KEY,                    -- UUID
  capture_id TEXT NOT NULL,               -- FK to pending_captures
  sort_order INTEGER NOT NULL,            -- 0-based index
  is_primary INTEGER NOT NULL DEFAULT 0,  -- Boolean
  local_path TEXT NOT NULL,               -- Path in app's document directory
  file_size INTEGER NOT NULL,             -- Bytes
  width INTEGER,                          -- Pixels
  height INTEGER,                         -- Pixels
  created_at INTEGER NOT NULL,            -- Unix timestamp
  FOREIGN KEY (capture_id) REFERENCES pending_captures(id) ON DELETE CASCADE
);

-- Sync history for debugging
CREATE TABLE sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capture_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,             -- Unix timestamp
  action TEXT NOT NULL,                   -- 'attempt' | 'success' | 'failure'
  details TEXT,                           -- JSON with request/response info
  FOREIGN KEY (capture_id) REFERENCES pending_captures(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_pending_captures_status ON pending_captures(sync_status);
CREATE INDEX idx_pending_captures_created ON pending_captures(created_at);
CREATE INDEX idx_capture_photos_capture ON capture_photos(capture_id);
CREATE INDEX idx_sync_log_capture ON sync_log(capture_id);
```

### 7.4 Photo Storage Strategy

```typescript
// services/PhotoStorage.ts

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const PHOTOS_DIRECTORY = `${FileSystem.documentDirectory}captures/`;
const MAX_STORED_PHOTOS = 500; // Trigger cleanup when exceeded
const MAX_STORAGE_MB = 500;    // Maximum storage for offline photos

export class PhotoStorage {
  /**
   * Save a captured photo to local storage
   */
  async savePhoto(captureId: string, photoUri: string, index: number): Promise<CapturePhoto> {
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(
      `${PHOTOS_DIRECTORY}${captureId}/`,
      { intermediates: true }
    );

    // Compress image for storage efficiency
    const compressed = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: 2048 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
    );

    // Generate unique filename
    const photoId = uuid();
    const localPath = `${PHOTOS_DIRECTORY}${captureId}/${photoId}.webp`;

    // Copy to permanent location
    await FileSystem.copyAsync({
      from: compressed.uri,
      to: localPath,
    });

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(localPath, { size: true });

    return {
      id: photoId,
      captureId,
      sortOrder: index,
      isPrimary: index === 0,
      localPath,
      fileSize: fileInfo.size || 0,
      width: compressed.width,
      height: compressed.height,
      createdAt: Date.now(),
    };
  }

  /**
   * Delete photos for a capture (after successful sync)
   */
  async deleteCapture(captureId: string): Promise<void> {
    const captureDir = `${PHOTOS_DIRECTORY}${captureId}/`;
    const dirInfo = await FileSystem.getInfoAsync(captureDir);

    if (dirInfo.exists) {
      await FileSystem.deleteAsync(captureDir, { idempotent: true });
    }
  }

  /**
   * Run storage cleanup if needed
   */
  async cleanupIfNeeded(): Promise<void> {
    const usage = await this.getStorageUsage();

    if (usage.photoCount > MAX_STORED_PHOTOS || usage.totalMB > MAX_STORAGE_MB) {
      await this.cleanupOldSyncedCaptures();
    }
  }

  /**
   * Get current storage usage
   */
  async getStorageUsage(): Promise<{ photoCount: number; totalMB: number }> {
    // Implementation: walk directory tree and sum file sizes
  }

  /**
   * Remove photos from synced captures (oldest first)
   */
  private async cleanupOldSyncedCaptures(): Promise<void> {
    // Query database for synced captures ordered by created_at ASC
    // Delete photo files for oldest synced captures until under limits
  }
}
```

### 7.5 Sync Service

```typescript
// services/SyncService.ts

import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const SYNC_TASK_NAME = 'listforge-sync-task';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000]; // Exponential backoff

export class SyncService {
  private isSyncing = false;
  private db: SQLiteDatabase;
  private photoStorage: PhotoStorage;

  constructor(db: SQLiteDatabase, photoStorage: PhotoStorage) {
    this.db = db;
    this.photoStorage = photoStorage;
  }

  /**
   * Initialize sync service and register background task
   */
  async initialize(): Promise<void> {
    // Listen for network state changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.triggerSync();
      }
    });

    // Register background fetch task
    await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  /**
   * Trigger sync (debounced, prevents concurrent syncs)
   */
  async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { status: 'already_syncing' };
    }

    // Check network connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      return { status: 'offline' };
    }

    this.isSyncing = true;

    try {
      return await this.performSync();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<SyncResult> {
    const pendingCaptures = await this.db.getPendingCaptures();
    let synced = 0;
    let failed = 0;

    for (const capture of pendingCaptures) {
      // Skip if too many recent failures (exponential backoff)
      if (this.shouldSkipDueToBackoff(capture)) {
        continue;
      }

      // Update status to syncing
      await this.db.updateCaptureStatus(capture.id, 'syncing');

      try {
        // Get photos for this capture
        const photos = await this.db.getPhotosForCapture(capture.id);

        // Build FormData
        const formData = new FormData();
        for (const photo of photos) {
          formData.append('photos', {
            uri: `file://${photo.localPath}`,
            type: 'image/webp',
            name: `photo_${photo.sortOrder}.webp`,
          } as any);
        }
        if (capture.titleHint) {
          formData.append('userTitleHint', capture.titleHint);
        }

        // Upload to server
        const response = await api.createAiCaptureItem(formData);

        // Mark as synced
        await this.db.updateCaptureStatus(capture.id, 'synced', {
          serverItemId: response.item.id,
        });

        // Clean up local photos
        await this.photoStorage.deleteCapture(capture.id);

        // Log success
        await this.db.addSyncLog(capture.id, 'success', { itemId: response.item.id });

        synced++;

      } catch (error) {
        // Mark as failed with error details
        await this.db.updateCaptureStatus(capture.id, 'failed', {
          syncAttempts: capture.syncAttempts + 1,
          lastSyncAttempt: Date.now(),
          syncError: error.message,
        });

        // Log failure
        await this.db.addSyncLog(capture.id, 'failure', { error: error.message });

        failed++;
      }
    }

    // Cleanup old synced captures if needed
    await this.photoStorage.cleanupIfNeeded();

    return {
      status: 'completed',
      synced,
      failed,
      pending: pendingCaptures.length - synced - failed,
    };
  }

  /**
   * Check if capture should be skipped due to backoff
   */
  private shouldSkipDueToBackoff(capture: PendingCapture): boolean {
    if (capture.syncAttempts === 0) return false;
    if (capture.syncAttempts >= MAX_RETRY_ATTEMPTS) return true;

    const delay = RETRY_DELAYS[Math.min(capture.syncAttempts - 1, RETRY_DELAYS.length - 1)];
    const nextAttemptTime = (capture.lastSyncAttempt || 0) + delay;

    return Date.now() < nextAttemptTime;
  }

  /**
   * Get current sync status for UI
   */
  async getStatus(): Promise<SyncStatus> {
    const counts = await this.db.getCaptureCountsByStatus();
    const lastSync = await this.db.getLastSuccessfulSync();

    return {
      pendingCount: counts.pending + counts.failed,
      syncingCount: counts.syncing,
      syncedCount: counts.synced,
      failedCount: counts.failed,
      lastSyncAt: lastSync?.timestamp || null,
      isSyncing: this.isSyncing,
    };
  }
}

// Register background task handler
TaskManager.defineTask(SYNC_TASK_NAME, async () => {
  const syncService = getSyncServiceInstance();
  const result = await syncService.triggerSync();

  return result.status === 'completed'
    ? BackgroundFetch.BackgroundFetchResult.NewData
    : BackgroundFetch.BackgroundFetchResult.NoData;
});
```

### 7.6 Sync Status UI Component

```typescript
// components/common/SyncStatusBadge.tsx

import { useSyncStatus } from '../hooks/useSyncStatus';

type SyncState = 'synced' | 'syncing' | 'pending' | 'error';

export function SyncStatusBadge() {
  const { status, triggerSync } = useSyncStatus();

  const getState = (): SyncState => {
    if (status.isSyncing) return 'syncing';
    if (status.failedCount > 0) return 'error';
    if (status.pendingCount > 0) return 'pending';
    return 'synced';
  };

  const state = getState();

  return (
    <Pressable onPress={triggerSync} disabled={status.isSyncing}>
      <View className={cn(
        'flex-row items-center px-2 py-1 rounded-full',
        state === 'synced' && 'bg-green-100',
        state === 'syncing' && 'bg-blue-100',
        state === 'pending' && 'bg-yellow-100',
        state === 'error' && 'bg-red-100',
      )}>
        {state === 'syncing' && <ActivityIndicator size="small" />}
        {state === 'pending' && <CloudIcon className="w-4 h-4 text-yellow-600" />}
        {state === 'error' && <AlertIcon className="w-4 h-4 text-red-600" />}
        {state === 'synced' && <CheckIcon className="w-4 h-4 text-green-600" />}

        {status.pendingCount > 0 && (
          <Text className={cn(
            'ml-1 text-xs font-medium',
            state === 'error' ? 'text-red-700' : 'text-gray-700'
          )}>
            {status.pendingCount}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
```

### 7.7 Capture Flow with Offline Support

```typescript
// hooks/useCapture.ts

export function useCapture() {
  const db = useDatabase();
  const photoStorage = usePhotoStorage();
  const syncService = useSyncService();

  const captureItem = async (
    photos: PhotoAsset[],
    options: { titleHint?: string; barcode?: string }
  ): Promise<CaptureResult> => {
    // 1. Generate capture ID
    const captureId = uuid();

    // 2. Save photos to local storage
    const savedPhotos = await Promise.all(
      photos.map((photo, index) =>
        photoStorage.savePhoto(captureId, photo.uri, index)
      )
    );

    // 3. Create pending capture record
    await db.createPendingCapture({
      id: captureId,
      titleHint: options.titleHint,
      barcode: options.barcode,
      captureType: 'standard',
      photos: savedPhotos,
    });

    // 4. Trigger sync (non-blocking)
    syncService.triggerSync();

    // 5. Return success immediately
    return {
      success: true,
      captureId,
      photoCount: savedPhotos.length,
    };
  };

  return { captureItem };
}
```

---

## 8. Push Notifications

### 8.1 Overview

Push notifications alert users when AI research completes, allowing them to review items without keeping the app open.

### 8.2 Notification Types

| Type | Trigger | Content |
|------|---------|---------|
| **Research Complete** | Item moves to `ai_reviewed` state | "Your item is ready for review: [Title]" |
| **Batch Complete** | Multiple items ready | "[N] items ready for review" |
| **Sync Failed** | Upload failures after retries | "Some items failed to sync. Tap to retry." |

### 8.3 Notification Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PUSH NOTIFICATION FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   BACKEND   │────>│   FCM /     │────>│   MOBILE    │   │
│  │   EVENT     │     │   APNs      │     │   DEVICE    │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│        │                                        │          │
│        │ Research state                         │          │
│        │ changes to                             v          │
│        │ 'ai_reviewed'              ┌─────────────────┐    │
│        │                            │  NOTIFICATION   │    │
│        v                            │  HANDLER        │    │
│  ┌─────────────┐                    └────────┬────────┘    │
│  │   PUSH      │                             │             │
│  │   SERVICE   │                             v             │
│  │   (NestJS)  │                    ┌─────────────────┐    │
│  └─────────────┘                    │  OPEN ITEM IN   │    │
│                                     │  REVIEW TAB     │    │
│                                     └─────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Mobile Setup

```typescript
// services/NotificationService.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private pushToken: string | null = null;

  /**
   * Initialize notifications and register for push
   */
  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.log('Push notifications not available on simulator');
      return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    });
    this.pushToken = tokenData.data;

    // Register token with backend
    await this.registerTokenWithBackend(this.pushToken);

    // Set up notification response handler (when user taps notification)
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    await api.registerPushToken({
      token,
      platform: Device.osName === 'iOS' ? 'ios' : 'android',
      deviceId: Device.deviceName || 'unknown',
    });
  }

  /**
   * Handle notification tap
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    switch (data.type) {
      case 'research_complete':
        // Navigate to item in review tab
        router.push(`/items/${data.itemId}`);
        break;

      case 'batch_complete':
        // Navigate to review queue
        router.push('/review');
        break;

      case 'sync_failed':
        // Navigate to settings/sync
        router.push('/settings');
        break;
    }
  };

  /**
   * Update badge count
   */
  async updateBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}
```

### 8.5 Backend Implementation

#### 8.5.1 New Entity: UserPushToken

```typescript
// entities/user-push-token.entity.ts

@Entity('user_push_tokens')
export class UserPushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  token: string;

  @Column()
  platform: 'ios' | 'android';

  @Column({ nullable: true })
  deviceId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 8.5.2 Push Notification Service

```typescript
// services/push-notification.service.ts

import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
  private fcm: admin.messaging.Messaging;

  constructor(
    @InjectRepository(UserPushToken)
    private pushTokenRepo: Repository<UserPushToken>,
  ) {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }),
      });
    }
    this.fcm = admin.messaging();
  }

  /**
   * Send research complete notification
   */
  async sendResearchCompleteNotification(
    userId: string,
    item: Item,
  ): Promise<void> {
    const tokens = await this.getActiveTokensForUser(userId);

    if (tokens.length === 0) return;

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens.map(t => t.token),
      notification: {
        title: 'Item Ready for Review',
        body: `Your item is ready: ${item.title}`,
      },
      data: {
        type: 'research_complete',
        itemId: item.id,
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'research_complete',
        },
      },
    };

    try {
      const response = await this.fcm.sendEachForMulticast(message);

      // Handle failed tokens (device unregistered, etc.)
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.handleFailedToken(tokens[idx].id, resp.error);
        }
      });
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
    }
  }

  /**
   * Get active push tokens for user
   */
  private async getActiveTokensForUser(userId: string): Promise<UserPushToken[]> {
    return this.pushTokenRepo.find({
      where: { userId, isActive: true },
    });
  }

  /**
   * Handle failed token (mark inactive or delete)
   */
  private async handleFailedToken(
    tokenId: string,
    error: admin.FirebaseError,
  ): Promise<void> {
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      await this.pushTokenRepo.update(tokenId, { isActive: false });
    }
  }
}
```

#### 8.5.3 Trigger Notification on Research Complete

```typescript
// In research graph or research service

@Injectable()
export class ResearchGraphService {
  constructor(
    private pushNotificationService: PushNotificationService,
  ) {}

  async onResearchComplete(item: Item): Promise<void> {
    // ... existing completion logic ...

    // Send push notification
    await this.pushNotificationService.sendResearchCompleteNotification(
      item.createdByUserId,
      item,
    );
  }
}
```

### 8.6 New API Endpoints

```typescript
// POST /push-tokens
// Register a push token for the current user
interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
}

// DELETE /push-tokens/:token
// Unregister a push token (e.g., on logout)
```

---

## 9. Deep Linking

### 9.1 Overview

Deep linking enables users to open specific screens in the mobile app from web URLs. This provides seamless navigation between web and mobile experiences.

### 9.2 URL Mapping

| Web URL | Mobile Screen | Notes |
|---------|---------------|-------|
| `listforge.app/capture` | Capture Tab | Opens camera |
| `listforge.app/capture/:id` | Capture Edit | View/edit pending capture |
| `listforge.app/review` | Review Tab | Opens swipe queue |
| `listforge.app/items/:id` | Item Detail | Shows item card (review if pending) |
| `listforge.app/chat` | Chat Tab | General chat |
| `listforge.app/chat/:sessionId` | Chat Session | Specific conversation |
| `listforge.app/settings` | Settings Tab | Main settings |
| `listforge.app/settings/marketplaces` | Marketplace Settings | Connections view |
| `listforge.app/settings/organization` | Org Settings | Organization view |

### 9.3 Configuration

#### 9.3.1 Expo Configuration

```typescript
// app.config.ts

export default {
  expo: {
    name: "ListForge",
    slug: "listforge",
    scheme: "listforge", // Custom URL scheme: listforge://
    ios: {
      bundleIdentifier: "com.listforge.app",
      associatedDomains: [
        "applinks:listforge.app",
        "applinks:*.listforge.app",
      ],
    },
    android: {
      package: "com.listforge.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "listforge.app",
              pathPrefix: "/",
            },
            {
              scheme: "https",
              host: "*.listforge.app",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      "expo-router",
      // ... other plugins
    ],
  },
};
```

#### 9.3.2 iOS Universal Links Setup

Create `apple-app-site-association` file at `https://listforge.app/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.listforge.app",
        "paths": [
          "/capture",
          "/capture/*",
          "/review",
          "/review/*",
          "/items/*",
          "/chat",
          "/chat/*",
          "/settings",
          "/settings/*"
        ]
      }
    ]
  }
}
```

#### 9.3.3 Android App Links Setup

Create `assetlinks.json` file at `https://listforge.app/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.listforge.app",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### 9.4 Deep Link Handler

```typescript
// app/_layout.tsx

import { useURL } from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const url = useURL();

  useEffect(() => {
    if (url) {
      handleDeepLink(url);
    }
  }, [url]);

  return (
    <Providers>
      <Stack />
    </Providers>
  );
}

function handleDeepLink(url: string): void {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // Map web paths to mobile routes
    const routeMap: Record<string, string> = {
      '/capture': '/(tabs)/capture',
      '/review': '/(tabs)',
      '/chat': '/(tabs)/chat',
      '/settings': '/(tabs)/settings',
      '/settings/marketplaces': '/(tabs)/settings/marketplaces',
      '/settings/organization': '/(tabs)/settings/organization',
    };

    // Check for exact matches
    if (routeMap[path]) {
      router.replace(routeMap[path]);
      return;
    }

    // Handle dynamic routes
    const itemMatch = path.match(/^\/items\/([a-f0-9-]+)$/);
    if (itemMatch) {
      router.push(`/items/${itemMatch[1]}`);
      return;
    }

    const chatMatch = path.match(/^\/chat\/([a-f0-9-]+)$/);
    if (chatMatch) {
      router.push(`/chat/${chatMatch[1]}`);
      return;
    }

    const captureMatch = path.match(/^\/capture\/([a-f0-9-]+)$/);
    if (captureMatch) {
      router.push(`/capture/${captureMatch[1]}`);
      return;
    }

    // Default: go to home
    router.replace('/(tabs)');

  } catch (error) {
    console.error('Failed to parse deep link:', error);
    router.replace('/(tabs)');
  }
}
```

### 9.5 Cold Start vs Warm Start Handling

```typescript
// hooks/useDeepLinking.ts

import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';

export function useDeepLinking() {
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Handle cold start (app opened via deep link)
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialUrl(url);
      }
      setIsReady(true);
    };

    getInitialURL();

    // Handle warm start (app already running, receives deep link)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Process initial URL once app is ready
  useEffect(() => {
    if (isReady && initialUrl) {
      handleDeepLink(initialUrl);
      setInitialUrl(null);
    }
  }, [isReady, initialUrl]);

  return { isReady };
}
```

### 9.6 Generating Deep Links (Web to Mobile)

On the web app, add "Open in App" links:

```typescript
// Web: utils/deepLinks.ts

export function getMobileDeepLink(webPath: string): string {
  // Use Universal Link format (works if app installed, falls back to web)
  return `https://listforge.app${webPath}`;
}

// Usage in web app
<a href={getMobileDeepLink(`/items/${item.id}`)}>
  Open in App
</a>
```

---

## 10. Integration Points

### 10.1 Authentication

**Flow:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │---->│   API       │---->│   Response  │
│   Login     │     │   /auth     │     │   JWT       │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │              Store in                 │
       └------------ expo-secure-store <-------┘
```

**Token Management:**
- Store JWT in `expo-secure-store` (encrypted native storage)
- Refresh token logic identical to web
- Automatic retry with refresh on 401

**Biometric Option (Future):**
- Enable FaceID/TouchID to unlock app
- Stored credentials retrieved via biometric

### 10.2 API Integration

**Base Query Configuration:**
```typescript
// Reuse existing RTK Query setup with mobile base URL
const mobileBaseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  prepareHeaders: async (headers) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});
```

**API Endpoints Used:**

| Feature | Endpoints |
|---------|-----------|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Capture | `POST /items/ai-capture` |
| Quick Eval | `POST /items/quick-eval` (NEW) |
| Barcode | `POST /items/barcode-lookup` (NEW) |
| Review Queue | `GET /items/review/ai-queue` |
| Review Actions | `POST /items/:id/review/ai-approve`, `POST /items/:id/review/ai-reject` |
| Chat | WebSocket (`send_message`, `join_session`) |
| Settings | `GET /marketplaces/accounts` |
| Push Tokens | `POST /push-tokens`, `DELETE /push-tokens/:token` (NEW) |

### 10.3 WebSocket Integration

**Socket Manager Adaptation:**
```typescript
// Same socket.io-client, adapted for React Native
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

class MobileSocketManager {
  private socket: Socket | null = null;

  async connect(): Promise<Socket> {
    const token = await SecureStore.getItemAsync('auth_token');

    this.socket = io(process.env.EXPO_PUBLIC_WS_URL, {
      auth: { token },
      transports: ['websocket'], // Prefer websocket on mobile
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    return this.socket;
  }
}
```

**Events Used:**
- `chat:token` - Streaming chat responses
- `chat:message` - Complete messages
- `chat:action_applied` - Action results
- `chat:tool_progress` - Tool execution status
- `item:updated` - Real-time item updates
- `research:activity` - Research progress (for Quick Eval)

### 10.4 Error Tracking with Sentry

```typescript
// services/ErrorTracking.ts

import * as Sentry from '@sentry/react-native';

export function initializeErrorTracking(): void {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    attachScreenshot: true,
    attachViewHierarchy: true,
  });
}

// Wrap root component
export function withErrorBoundary(Component: React.ComponentType) {
  return Sentry.wrap(Component);
}

// Manual error reporting
export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Set user context on login
export function setUserContext(user: User): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.displayName,
  });
}

// Clear user context on logout
export function clearUserContext(): void {
  Sentry.setUser(null);
}
```

---

## 11. User Flow Diagrams

### 11.1 First-Time User Flow

```
┌─────────────┐
│   App       │
│   Launch    │
└─────┬───────┘
      │
      v
┌─────────────┐     ┌─────────────┐
│   Splash    │---->│   Login     │
│   Screen    │     │   Screen    │
└─────────────┘     └─────┬───────┘
                          │
                          v
                    ┌─────────────┐
                    │   Email +   │
                    │   Password  │
                    └─────┬───────┘
                          │
                          v
                    ┌─────────────┐
                    │   API       │
                    │   Auth      │
                    └─────┬───────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              v                       v
        ┌─────────────┐         ┌─────────────┐
        │   Success   │         │   Error     │
        │   -> Home   │         │   -> Retry  │
        └─────────────┘         └─────────────┘
```

### 11.2 Main Navigation Flow

```
                    ┌─────────────────────┐
                    │      HOME TAB       │
                    │   (Review Queue)    │
                    └─────────┬───────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        v                     v                     v
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  CAPTURE TAB  │     │   CHAT TAB    │     │ SETTINGS TAB  │
│               │     │               │     │               │
│  Camera       │     │  AI Chat      │     │  Account      │
│  Barcode Scan │     │  Item Context │     │  Connections  │
│  Quick Eval   │     │  Actions      │     │  Sync Status  │
│  Photo Mgmt   │     │               │     │  Preferences  │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 11.3 Capture to Review Flow (with Offline)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Capture   │---->│   Save to   │---->│   Success   │
│   Photos    │     │   SQLite    │     │   Toast     │
└─────────────┘     └─────────────┘     └─────┬───────┘
                                              │
                    ┌─────────────────────────┴────────────────┐
                    │                                          │
                    v                                          v
         ┌─────────────────┐                        ┌─────────────────┐
         │    ONLINE       │                        │    OFFLINE      │
         │    (sync now)   │                        │    (queue)      │
         └────────┬────────┘                        └────────┬────────┘
                  │                                          │
                  v                                          │
         ┌─────────────────┐                                 │
         │   Upload to     │                                 │
         │   API Server    │                                 │
         └────────┬────────┘                                 │
                  │                                          │
                  v                                          │
         ┌─────────────────┐                                 │
         │   AI Research   │                                 │
         │   Starts        │                                 │
         └────────┬────────┘                                 │
                  │                                          │
                  v                                          v
         ┌─────────────────┐                        ┌─────────────────┐
         │   Push Notif    │                        │  When Online:   │
         │   "Ready!"      │                        │  Auto-sync      │
         └────────┬────────┘                        └────────┬────────┘
                  │                                          │
                  └────────────────────┬─────────────────────┘
                                       │
                                       v
                    ┌─────────────────────────────────────┐
                    │   ITEM APPEARS IN REVIEW QUEUE      │
                    │   (User can swipe to approve/reject)│
                    └─────────────────────────────────────┘
```

### 11.4 Barcode Auto-Scan Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMERA PREVIEW                           │
│              (Real-time barcode detection)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Barcode detected
                           │ (automatic, no button)
                           v
┌─────────────────────────────────────────────────────────────┐
│                    BARCODE DETECTED                         │
│              [Visual overlay + haptic]                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Auto-trigger lookup
                           v
┌─────────────────────────────────────────────────────────────┐
│                    LOOKUP IN PROGRESS                       │
│              POST /items/barcode-lookup                     │
│              (2-5 second response)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           v                               v
┌─────────────────────┐         ┌─────────────────────┐
│   PRODUCT FOUND     │         │   NOT FOUND         │
│                     │         │                     │
│   Show Quick Eval   │         │   Toast: "No match" │
│   Results Screen    │         │   Continue capture  │
│                     │         │                     │
│   [PASS] [KEEP]     │         │   [Take photos]     │
└─────────────────────┘         └─────────────────────┘
```

### 11.5 Quick Eval Flow (from photos)

```
┌─────────────┐
│  Take 1-3   │
│   Photos    │
└─────┬───────┘
      │
      v
┌─────────────┐     ┌─────────────────────────────────────┐
│ Tap "Quick  │---->│   POST /items/quick-eval            │
│   Eval"     │     │   (runs abbreviated research)       │
└─────────────┘     └─────────────────┬───────────────────┘
                                      │
                                      v
                    ┌─────────────────────────────────────┐
                    │   PROCESSING (5-15 seconds)         │
                    │   - Identify product                │
                    │   - Search comps                    │
                    │   - Calculate price                 │
                    └─────────────────┬───────────────────┘
                                      │
                                      v
                    ┌─────────────────────────────────────┐
                    │   SHOW RESULTS                      │
                    │   - Product name & confidence       │
                    │   - Price range                     │
                    │   - Demand level                    │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              v                                               v
        ┌─────────────┐                             ┌─────────────────┐
        │    PASS     │                             │  KEEP & FULL    │
        │  (discard)  │                             │    RESEARCH     │
        │             │                             │  (create item)  │
        │  -> Capture │                             │  -> Review Queue│
        └─────────────┘                             └─────────────────┘
```

---

## 12. Implementation Phases

### Phase 1: Foundation (2-3 weeks)

**Goal:** Bootable app with authentication and basic offline infrastructure

**Deliverables:**
- [ ] Expo project setup in monorepo
- [ ] NativeWind configuration
- [ ] Package imports working (`@listforge/*`)
- [ ] Navigation structure (Expo Router)
- [ ] Login/logout functionality
- [ ] Secure token storage
- [ ] API connection verified
- [ ] SQLite database setup
- [ ] Sentry integration

**Success Criteria:**
- User can log in and see their organization name
- API calls work with authentication
- App runs on iOS simulator and Android emulator
- Errors are reported to Sentry

---

### Phase 2: Capture Flow + Offline (3 weeks)

**Goal:** Working photo capture with full offline support

**Deliverables:**
- [ ] Camera integration (`expo-camera`)
- [ ] Photo gallery picker (`expo-image-picker`)
- [ ] Photo strip UI with reordering
- [ ] Title hint input
- [ ] Local photo storage (filesystem)
- [ ] SQLite pending captures table
- [ ] Offline-first capture flow
- [ ] Background sync service
- [ ] Sync status UI (badge, settings)
- [ ] Network state monitoring
- [ ] Retry logic with exponential backoff

**Success Criteria:**
- User can capture items while completely offline
- Items automatically sync when connection restored
- Sync status is clearly visible in UI
- Failed syncs retry automatically

---

### Phase 3: Barcode Auto-Scan (1.5 weeks)

**Goal:** Automatic barcode detection and lookup

**Deliverables:**
- [ ] Barcode detection in camera preview
- [ ] Visual overlay when barcode detected
- [ ] Haptic feedback on detection
- [ ] Backend: `/items/barcode-lookup` endpoint
- [ ] Auto-trigger lookup (no button press)
- [ ] Results display / Quick Eval handoff
- [ ] "Not found" handling

**Success Criteria:**
- Barcode detection triggers automatically when barcode enters frame
- Lookup returns results in <5 seconds
- Found products show Quick Eval results
- Not found shows toast and continues to photo capture

---

### Phase 4: Review Flow (2 weeks)

**Goal:** Swipe-based review interface

**Deliverables:**
- [ ] Swipe card component (react-native-gesture-handler)
- [ ] Review queue fetching
- [ ] Card data display (photo, title, price, confidence)
- [ ] Swipe right -> approve
- [ ] Swipe left -> reject
- [ ] Undo functionality
- [ ] Empty state
- [ ] Real-time queue updates (WebSocket)

**Success Criteria:**
- User can review 10 items in under 60 seconds
- Approve/reject reflects immediately on web
- Swipe feels smooth and responsive

---

### Phase 5: Chat Interface (1.5 weeks)

**Goal:** Working AI chat

**Deliverables:**
- [ ] Chat screen UI
- [ ] WebSocket connection (reuse `useChatSocket`)
- [ ] Message sending
- [ ] Streaming response display
- [ ] Tool progress indicators
- [ ] Action buttons
- [ ] Context switching (item scope)

**Success Criteria:**
- User can ask questions about items
- Streaming responses work
- Action buttons function correctly

---

### Phase 6: Quick Evaluation (2 weeks)

**Goal:** Quick Eval feature end-to-end

**Deliverables:**
- [ ] Backend: New `/items/quick-eval` endpoint
- [ ] Backend: Quick eval research graph
- [ ] Mobile: Quick Eval mode in capture flow
- [ ] Mobile: Results display UI
- [ ] Mobile: Pass/Keep actions
- [ ] Integration with barcode scan results
- [ ] Integration testing

**Success Criteria:**
- Quick eval returns results in <15 seconds
- Pass discards correctly
- Keep creates item and queues full research

---

### Phase 7: Push Notifications (1 week)

**Goal:** Push notifications for research completion

**Deliverables:**
- [ ] expo-notifications setup
- [ ] FCM configuration (Firebase)
- [ ] Backend: Push token registration endpoints
- [ ] Backend: PushNotificationService
- [ ] Backend: Trigger notifications on research complete
- [ ] Mobile: Notification permission request
- [ ] Mobile: Handle notification taps (navigation)
- [ ] Badge count management

**Success Criteria:**
- User receives push notification when research completes
- Tapping notification opens item in app
- Badge count reflects pending reviews

---

### Phase 8: Deep Linking (1 week)

**Goal:** Full deep linking from web URLs

**Deliverables:**
- [ ] Expo deep linking configuration
- [ ] iOS Universal Links setup (apple-app-site-association)
- [ ] Android App Links setup (assetlinks.json)
- [ ] Deep link handler implementation
- [ ] Route mapping (web paths -> mobile screens)
- [ ] Cold start handling
- [ ] Warm start handling
- [ ] Testing on both platforms

**Success Criteria:**
- Web URLs open correct screens in mobile app
- Works for both cold start and warm start
- Graceful fallback for unknown routes

---

### Phase 9: Polish & Settings (1 week)

**Goal:** Production-ready MVP

**Deliverables:**
- [ ] Settings screen
- [ ] Marketplace connections view
- [ ] Sync status and manual sync in settings
- [ ] App preferences (camera quality, haptics, notifications)
- [ ] Error boundary implementation
- [ ] Loading states and skeletons
- [ ] Accessibility review
- [ ] Performance optimization

**Success Criteria:**
- App feels polished and professional
- No crashes in normal usage
- Passes accessibility basics

---

### Phase 10: Testing & Launch (1.5 weeks)

**Goal:** App store submission

**Deliverables:**
- [ ] TestFlight/Internal testing build
- [ ] Bug fixes from testing
- [ ] App store assets (screenshots, descriptions)
- [ ] Privacy policy and terms of service
- [ ] App store submission (iOS + Android)
- [ ] Launch monitoring setup

**Success Criteria:**
- App approved on both stores
- Sentry monitoring active
- No critical bugs in production

---

### Total Timeline: 16-17 weeks

```
Phase 1:  Foundation         ||||||||----------------------  (Weeks 1-3)
Phase 2:  Capture + Offline  --------||||||||||||----------  (Weeks 3-6)
Phase 3:  Barcode Auto-Scan  ----------------||||----------  (Weeks 6-7.5)
Phase 4:  Review             --------------------||||||||--  (Weeks 7.5-9.5)
Phase 5:  Chat               --------------------------|||-  (Weeks 9.5-11)
Phase 6:  Quick Eval         ----------------------------||  (Weeks 11-13)
Phase 7:  Push Notifications ----------------------------||  (Weeks 13-14)
Phase 8:  Deep Linking       ----------------------------||  (Weeks 14-15)
Phase 9:  Polish             ----------------------------||  (Weeks 15-16)
Phase 10: Launch             ----------------------------||  (Weeks 16-17.5)
```

**Note:** Timeline increased from original 11-12 weeks to 16-17 weeks due to:
- Full offline capture system (+2 weeks)
- Barcode auto-scan feature (+1.5 weeks)
- Push notifications (+1 week)
- Deep linking (+1 week)

---

## 13. Technical Details

### 13.1 Project Structure

```
apps/listforge-mobile/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Splash/redirect
│   ├── login.tsx                 # Login screen
│   └── (tabs)/                   # Tab navigator group
│       ├── _layout.tsx           # Tab bar configuration
│       ├── index.tsx             # Home/Review tab
│       ├── capture.tsx           # Capture tab
│       ├── chat.tsx              # Chat tab
│       ├── chat/
│       │   └── [sessionId].tsx   # Specific chat session
│       ├── settings.tsx          # Settings tab
│       └── settings/
│           ├── marketplaces.tsx
│           └── organization.tsx
├── components/
│   ├── capture/
│   │   ├── CameraView.tsx
│   │   ├── BarcodeOverlay.tsx
│   │   ├── PhotoStrip.tsx
│   │   ├── CaptureButton.tsx
│   │   └── QuickEvalResults.tsx
│   ├── review/
│   │   ├── SwipeCard.tsx
│   │   ├── SwipeDeck.tsx
│   │   ├── ReviewCardContent.tsx
│   │   └── UndoToast.tsx
│   ├── chat/
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ToolProgress.tsx
│   │   └── ActionButton.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfidenceBadge.tsx
│       └── SyncStatusBadge.tsx
├── database/
│   ├── schema.ts                 # SQLite schema definitions
│   ├── migrations/               # Database migrations
│   └── queries.ts                # Typed query functions
├── hooks/
│   ├── useCamera.ts
│   ├── useBarcodeScanner.ts
│   ├── useCapture.ts
│   ├── useOfflineSync.ts
│   ├── useSyncStatus.ts
│   ├── useSwipeGesture.ts
│   └── useDeepLinking.ts
├── services/
│   ├── SyncService.ts            # Offline sync orchestration
│   ├── PhotoStorage.ts           # Local photo management
│   ├── NotificationService.ts    # Push notification handling
│   ├── ErrorTracking.ts          # Sentry integration
│   └── DeepLinkHandler.ts        # URL routing
├── store/
│   ├── index.ts                  # Redux store config
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── offlineSlice.ts
│   │   └── uiSlice.ts
│   └── middleware/
│       └── socketMiddleware.ts
├── utils/
│   ├── storage.ts                # SecureStore helpers
│   ├── imageCompression.ts
│   └── haptics.ts
├── app.config.ts                 # Expo config (dynamic)
├── tailwind.config.js            # NativeWind config
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

### 13.2 Key Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-camera": "~15.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-image-manipulator": "~12.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-haptics": "~13.0.0",
    "expo-router": "~4.0.0",
    "expo-sqlite": "~14.0.0",
    "expo-file-system": "~17.0.0",
    "expo-notifications": "~0.28.0",
    "expo-linking": "~6.3.0",
    "expo-device": "~6.0.0",
    "expo-background-fetch": "~12.0.0",
    "expo-task-manager": "~11.8.0",

    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "@react-native-community/netinfo": "~11.3.0",

    "nativewind": "^4.0.0",
    "tailwindcss": "^3.4.0",

    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "socket.io-client": "^4.7.0",

    "@sentry/react-native": "~5.0.0",

    "@listforge/core-types": "workspace:*",
    "@listforge/api-types": "workspace:*",
    "@listforge/api-rtk": "workspace:*",
    "@listforge/socket-types": "workspace:*"
  }
}
```

### 13.3 Environment Configuration

```typescript
// app.config.ts
export default {
  expo: {
    name: "ListForge",
    slug: "listforge",
    version: "1.0.0",
    scheme: "listforge",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      wsUrl: process.env.EXPO_PUBLIC_WS_URL,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      env: process.env.EXPO_PUBLIC_ENV || 'development',
    },
    ios: {
      bundleIdentifier: "com.listforge.app",
      associatedDomains: [
        "applinks:listforge.app",
        "applinks:*.listforge.app",
      ],
      infoPlist: {
        NSCameraUsageDescription: "ListForge needs camera access to capture item photos and scan barcodes.",
        NSPhotoLibraryUsageDescription: "ListForge needs photo library access to select item images.",
      },
    },
    android: {
      package: "com.listforge.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "listforge.app",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-sqlite",
      "@sentry/react-native/expo",
      [
        "expo-camera",
        {
          cameraPermission: "Allow ListForge to access your camera to capture item photos and scan barcodes."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow ListForge to access your photos to select item images."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ffffff",
          sounds: ["./assets/notification.wav"]
        }
      ],
      [
        "expo-background-fetch",
        {
          stopOnTerminate: false,
          startOnBoot: true
        }
      ]
    ]
  }
};
```

### 13.4 Swipe Card Implementation

```typescript
// components/review/SwipeCard.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export function SwipeCard({ item, onApprove, onReject }) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerActionHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = event.translationX / 20;

      // Haptic at threshold
      const atThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      if (atThreshold && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (!atThreshold) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd((event) => {
      const shouldSwipe =
        Math.abs(event.translationX) > SWIPE_THRESHOLD ||
        Math.abs(event.velocityX) > VELOCITY_THRESHOLD;

      if (shouldSwipe && event.translationX > 0) {
        translateX.value = withSpring(500);
        runOnJS(triggerActionHaptic)();
        runOnJS(onApprove)(item.id);
      } else if (shouldSwipe && event.translationX < 0) {
        translateX.value = withSpring(-500);
        runOnJS(triggerActionHaptic)();
        runOnJS(onReject)(item.id);
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const approveOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const rejectOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedCardStyle} className="absolute w-full">
        <Animated.View style={approveOpacity} className="absolute top-4 left-4 z-10">
          <Text className="text-green-500 text-2xl font-bold border-2 border-green-500 px-4 py-2 rounded-lg rotate-[-15deg]">
            APPROVE
          </Text>
        </Animated.View>
        <Animated.View style={rejectOpacity} className="absolute top-4 right-4 z-10">
          <Text className="text-red-500 text-2xl font-bold border-2 border-red-500 px-4 py-2 rounded-lg rotate-[15deg]">
            REJECT
          </Text>
        </Animated.View>
        <ReviewCardContent item={item} />
      </Animated.View>
    </GestureDetector>
  );
}
```

---

## 14. Confirmed Decisions

All previously open questions have been resolved:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Push Notifications** | YES - FCM/APNs | Alert users when research completes |
| **Barcode Scanning** | YES - Auto-scan | No button press needed; instant lookup on detection |
| **Offline Support** | FULL - SQLite + filesystem | Complete offline capture with auto-sync |
| **Crash Reporting** | Sentry | Industry standard, good React Native support |
| **Deep Linking** | FULL - Universal/App Links | 1:1 mapping from web routes to mobile screens |
| **Auth persistence** | SecureStore | Encrypted native storage |
| **State persistence** | SQLite (offline only) | Redux not persisted; offline queue in SQLite |
| **Image format** | WebP | Better compression, modern format |
| **Min OS version** | iOS 15+ / Android 10+ | Reduces edge cases, better API support |

---

## Backend Changes Summary

The following backend changes are required to support the mobile app:

### New API Endpoints

1. **`POST /items/quick-eval`** - Quick evaluation for field research
2. **`POST /items/barcode-lookup`** - UPC/barcode product lookup
3. **`POST /push-tokens`** - Register push notification token
4. **`DELETE /push-tokens/:token`** - Unregister push token

### New Entities

1. **`UserPushToken`** - Stores FCM/APNs tokens per user/device

### New Services

1. **`PushNotificationService`** - Sends push via FCM
2. **`BarcodeLookupService`** - Product identification from UPC (may use existing `UpcLookupService`)

### Research Graph Changes

1. **New run type:** `'quick_eval'`
2. **New graph:** `buildQuickEvalGraph()` - subset of full research

### Configuration

1. **Firebase Admin SDK** - For FCM push notifications
2. **Apple Developer** - For APNs configuration
3. **Universal Links** - `apple-app-site-association` file
4. **App Links** - `assetlinks.json` file

---

**Document Status:** APPROVED - Ready for Implementation

**Next Steps:**
1. Create Jira/Linear tickets for each phase
2. Set up Firebase project and FCM
3. Begin Phase 1: Foundation
