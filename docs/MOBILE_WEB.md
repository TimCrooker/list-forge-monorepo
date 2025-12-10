# Mobile Web Optimization

ListForge web app is fully optimized for mobile browser usage with touch-first interactions.

## Mobile-First Philosophy

> **"Remove features instead of cramming them as screen size shrinks"**

The mobile web experience focuses on the two core workflows:
1. **Image Capture** - Quick photo upload and item creation
2. **Tinder-Style Review** - Swipe left/right to approve/reject items

## Key Mobile Features

### 1. Capture Page (`/capture`)

**Mobile Optimizations:**
- ✅ Larger camera icon and tap target (20x20 vs 16x16)
- ✅ Larger photo upload button (h-16 vs h-14)
- ✅ 2-column photo grid (vs 3-4 on desktop)
- ✅ Always-visible remove buttons on thumbnails
- ✅ No drag-and-drop reordering (desktop only feature)
- ✅ Optional details section hidden on mobile
- ✅ Recent captures limited to 5 items (vs 10 on desktop)
- ✅ Recent captures hidden when photos are selected (focus mode)
- ✅ Sticky capture button at bottom with shadow
- ✅ Photo count in button ("Capture Item (3 photos)")
- ✅ Simplified header (just "Capture" vs "Capture Items")

**Mobile UX Flow:**
1. Tap large camera icon
2. Select photos from camera/gallery
3. Remove unwanted photos (tap X)
4. Tap sticky "Capture Item" button
5. Done - AI processes in background

### 2. Review Page (`/review`)

**Desktop Layout (≥768px):**
- Three-column layout: Queue | Listing | Evidence
- Keyboard shortcuts (A/→ to approve, R/← to reject)
- Full sidebar navigation

**Mobile Layout (<768px):**
- Single-column, full-screen card view
- Touch swipe gestures for review decisions
- Queue accessed via overlay
- No evidence panel (removed to focus on core task)
- Large touch-friendly approve/reject buttons
- Visual swipe indicators (✓ and ✗)

**Swipe Gestures:**
```
Swipe LEFT  → Reject item ✗
Swipe RIGHT → Approve item ✓
```

**Mobile UX Flow:**
1. View item card (photo, title, price)
2. Swipe right to approve OR swipe left to reject
3. Visual feedback (green checkmark or red X)
4. Auto-advance to next item
5. Access queue via "Queue (X)" button in header

**Mobile Features:**
- ✅ Full-screen immersive view
- ✅ Swipe gestures with 50px delta sensitivity
- ✅ Animated swipe indicators
- ✅ Large touch buttons (h-14) as fallback
- ✅ Queue overlay (not sidebar)
- ✅ Simplified header
- ✅ Prevents accidental swipes during item loading

## Responsive Breakpoint

**Mobile:** `< 768px` (md breakpoint in Tailwind)
**Desktop:** `≥ 768px`

Detection:
```typescript
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

## Layout Behavior

### Sidebar (Navigation)

- **Desktop:** Collapsible, user preference persisted
- **Mobile:** Always collapsed, hidden by overlay
  - Tap hamburger menu to open
  - Tap outside to close
  - Selection auto-closes menu

### Top Navbar

- **Desktop:** Full user menu, theme switcher, chat button, keyboard shortcuts
- **Mobile:** Hamburger menu, user avatar, essential actions only

### Content Area

- **Desktop:** Max-width containers with padding
- **Mobile:** Full-width, edge-to-edge content
  - No horizontal padding on containers
  - Content padding applied to inner elements
  - Maximizes screen real estate

## Touch Optimizations

### Button Sizes

- **Desktop:** h-10 to h-14 (40-56px)
- **Mobile:** h-14 to h-16 (56-64px)
- **Minimum touch target:** 44x44px (iOS HIG standard)

### Spacing

- **Desktop:** Default Tailwind spacing
- **Mobile:** Increased spacing for fat-finger friendliness
  - `gap-3` → `gap-4`
  - `p-4` → `p-6` for interactive areas

### Typography

- **Desktop:** text-sm to text-base
- **Mobile:** text-base to text-lg
  - Headers scaled up for visibility
  - Body text remains readable

## Features Removed on Mobile

These features are **intentionally removed** on mobile to simplify the experience:

### Capture Page
- ❌ Optional details section (title/description hints)
- ❌ Drag-and-drop photo reordering
- ❌ Full recent captures list (limited to 5)
- ❌ Recent captures when photos selected (focus mode)

### Review Page
- ❌ Three-column layout (queue/listing/evidence)
- ❌ Evidence panel (research details)
- ❌ Keyboard shortcuts display
- ❌ Sidebar queue (replaced with overlay)
- ❌ Desktop-style action buttons (replaced with swipe)

### General
- ❌ Expanded navigation sidebar
- ❌ Theme switcher in navbar
- ❌ Chat sidebar (replaced with modal)
- ❌ Complex multi-column layouts
- ❌ Hover states and tooltips

## Testing Mobile Experience

### Browser DevTools

1. Open Chrome/Edge DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone 13, Pixel 7, etc.)
4. Test touch events:
   - Tap to upload photos
   - Swipe left/right on review page
   - Tap to navigate

### Real Device Testing

**Recommended:**
- iPhone 13/14/15 (iOS Safari)
- Samsung Galaxy S21+ (Chrome Android)
- iPad (Safari)

**Test cases:**
1. Photo capture from camera
2. Photo selection from gallery
3. Swipe review gestures
4. Navigation menu overlay
5. Scrolling performance
6. Touch button sizes

## Implementation Details

### Swipe Library

Uses `react-swipeable` v7.0.2:

```typescript
import { useSwipeable } from 'react-swipeable';

const swipeHandlers = useSwipeable({
  onSwipedLeft: () => handleAction('reject'),
  onSwipedRight: () => handleAction('approve'),
  preventScrollOnSwipe: true,
  trackMouse: false, // Touch only
  delta: 50, // 50px minimum swipe distance
});

<div {...swipeHandlers}>
  {/* Swipeable content */}
</div>
```

### Mobile Detection Pattern

```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// Conditional rendering
if (isMobile) {
  return <MobileView />;
}
return <DesktopView />;
```

### Responsive Classes

Use Tailwind's responsive prefixes:

```tsx
// Mobile-first, then override for desktop
<div className="grid-cols-2 md:grid-cols-4">
  {/* 2 columns on mobile, 4 on desktop */}
</div>

<Button className="h-16 md:h-14">
  {/* Taller on mobile */}
</Button>

<div className="hidden md:block">
  {/* Desktop only */}
</div>
```

## Performance Considerations

### Image Optimization

- Use WebP format for captures
- Compress images before upload
- Lazy load thumbnails in recent captures
- Maximum 20 photos per capture

### Touch Performance

- `preventScrollOnSwipe: true` - Prevents accidental scrolls during swipe
- `trackMouse: false` - Only track touch, not mouse (performance)
- Debounce resize events
- Memoize mobile detection

### Animation Performance

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid layout thrashing
- Use `will-change` sparingly
- Swipe indicators use CSS transforms

## PWA Considerations (Future)

For native-like mobile experience:

**To add:**
- [ ] Service worker for offline support
- [ ] Manifest.json for "Add to Home Screen"
- [ ] iOS meta tags for status bar styling
- [ ] Touch icons (180x180 for iOS, various for Android)
- [ ] Splash screens
- [ ] Offline queue for captures

**Config:**
```json
{
  "name": "ListForge",
  "short_name": "ListForge",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/"
}
```

## Accessibility on Mobile

### Touch Targets

- Minimum 44x44px (iOS HIG)
- Preferably 48x48px (Material Design)
- All interactive elements meet minimum

### Screen Reader Support

- Swipe gestures have button fallbacks
- ARIA labels on icon-only buttons
- Semantic HTML structure
- Focus management for overlays

### Reduced Motion

Respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .swipe-indicator {
    animation: none;
  }
}
```

## Troubleshooting

### Swipe not working

**Symptoms:** Swipe gestures don't trigger actions
**Causes:**
- `preventScrollOnSwipe` not set
- Container not scrollable correctly
- Touch events blocked by parent

**Fix:**
```typescript
const swipeHandlers = useSwipeable({
  preventScrollOnSwipe: true,
  trackMouse: false,
  delta: 50,
});
```

### Photos not uploading

**Symptoms:** Photo selection doesn't trigger upload
**Causes:**
- File input not accepting image types
- Form data not constructed correctly
- MIME type restrictions

**Fix:**
```typescript
<input
  accept="image/*,image/heic"
  capture="environment" // Use rear camera by default
/>
```

### Layout shifts on orientation change

**Symptoms:** Content jumps when rotating device
**Causes:**
- Viewport height using `vh` units
- Keyboard pushing content up

**Fix:**
```css
/* Use dvh (dynamic viewport height) instead of vh */
height: 100dvh;

/* Or detect orientation */
@media (orientation: landscape) {
  /* Adjust layout */
}
```

## Future Enhancements

### Planned Mobile Features

- [ ] **Batch capture mode** - Rapid photo capture with minimal UI
- [ ] **Voice input** - Dictate item descriptions
- [ ] **Camera auto-capture** - Detect barcode and auto-capture
- [ ] **Quick actions** - Long-press for contextual menu
- [ ] **Haptic feedback** - Vibration on swipe actions
- [ ] **Gesture shortcuts** - Swipe up for queue, down for evidence
- [ ] **Picture-in-picture** - Chat while reviewing

### Mobile-Specific Analytics

Track:
- Swipe vs button usage ratio
- Average time per review
- Capture abandonment rate
- Photo count per capture
- Device types and OS versions

## Best Practices

1. **Test on real devices** - Emulators miss touch nuances
2. **Prioritize speed** - Mobile users are impatient
3. **Minimize text input** - Use camera, not keyboard
4. **Progressive enhancement** - Start mobile, add desktop features
5. **Respect bandwidth** - Optimize images and assets
6. **Handle offline gracefully** - Show clear error states
7. **Use native patterns** - iOS/Android conventions matter
8. **Test in slow 3G** - Many users have poor connectivity

## Quick Reference

### Mobile Breakpoint
```typescript
isMobile = window.innerWidth < 768
```

### Conditional Rendering
```tsx
{isMobile ? <MobileComponent /> : <DesktopComponent />}
```

### Responsive Classes
```tsx
className="text-base md:text-sm"  // Larger on mobile
className="grid-cols-2 md:grid-cols-4"  // Fewer columns on mobile
className="h-16 md:h-14"  // Taller on mobile
```

### Swipe Setup
```typescript
const handlers = useSwipeable({
  onSwipedLeft: () => reject(),
  onSwipedRight: () => approve(),
  preventScrollOnSwipe: true,
  trackMouse: false,
  delta: 50,
});
```

---

**Mobile web is the primary capture and review interface.** Desktop is for detailed editing and management.
