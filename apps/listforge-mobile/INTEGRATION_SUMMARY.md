# Mobile App Integration Summary

## ✅ Integration Complete

The ListForge mobile app is now fully integrated into the monorepo development workflow.

## What Was Done

### 1. **Dev Script Added**
- Added `"dev": "expo start"` to `package.json`
- Mobile app now starts automatically with `pnpm dev` from root

### 2. **Environment Variables Configured**
- `.env` file created with correct API URLs
- Points to `http://localhost:3001` (matching API port)
- WebSocket URL: `ws://localhost:3001`

### 3. **Documentation Updated**
- Root `README.md` updated to include mobile app in:
  - Environment configuration step
  - Development servers list
  - Architecture section
- Mobile app README updated with full setup guide

### 4. **Turbo Integration**
- Mobile app automatically included in Turbo dev pipeline
- Runs alongside API and web apps
- Command: `expo start`

## Starting the Full Stack

From the monorepo root:

```bash
# Start all services (API, Web, Mobile)
pnpm dev
```

This will start:
- **API**: http://localhost:3001
- **Web**: http://localhost:3000
- **Mobile**: Expo dev server (scan QR with Expo Go app)

## Mobile App Specifics

### Environment Variables
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WS_URL=ws://localhost:3001
```

### Development
```bash
# Start mobile app only
cd apps/listforge-mobile
pnpm dev

# Or run on specific platform
pnpm ios       # iOS simulator
pnpm android   # Android emulator
```

### Testing on Device
1. Install Expo Go app on your phone
2. Run `pnpm dev` from monorepo root
3. Scan QR code shown in terminal
4. App loads on your device

### Network Configuration

**Important**: For testing on physical devices on your local network:

1. Your computer and phone must be on the same WiFi network
2. Update `.env` to use your computer's local IP:
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
   EXPO_PUBLIC_WS_URL=ws://192.168.1.XXX:3001
   ```
3. Find your IP:
   - macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
   - Linux: `ip addr show`

## Verification

### Quick Test
```bash
# From monorepo root
pnpm dev
```

Expected output:
```
✓ API server started on port 3001
✓ Web server started on port 3000
✓ Mobile app: Expo DevTools running
  › Press a │ open Android
  › Press i │ open iOS simulator
  › Press w │ open web
  › Press r │ reload app
```

### TypeScript Check
```bash
cd apps/listforge-mobile
pnpm type-check
# Should pass with no errors
```

## Production Build

For production builds, see:
- `apps/listforge-mobile/README.md` - Full build guide
- `apps/listforge-mobile/AUDIT_SUMMARY.md` - Pre-production checklist

## Support

If the mobile app doesn't start with `pnpm dev`:
1. Ensure `expo-cli` is available: `npm install -g expo-cli`
2. Check that `.env` file exists in `apps/listforge-mobile/`
3. Verify no port conflicts (Expo typically uses 8081, 19000, 19001)
4. Clear Expo cache: `cd apps/listforge-mobile && npx expo start --clear`

## Files Modified

- ✅ `apps/listforge-mobile/package.json` - Added dev script
- ✅ `apps/listforge-mobile/.env` - Updated to port 3001
- ✅ `apps/listforge-mobile/.env.example` - Updated to port 3001
- ✅ `README.md` (root) - Added mobile app documentation
- ✅ `apps/listforge-mobile/README.md` - Complete setup guide

---

**Status**: Ready for development
**Last Updated**: 2025-12-09
