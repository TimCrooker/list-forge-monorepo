# ListForge Logo Setup Guide

## Summary

This document explains how the ListForge brand logos have been set up for use in the landing page application.

## Files Created/Updated

### 1. Logo Export Configuration
**File:** `src/data/logos.ts`

Added the `listForgeLogo` constant that exports paths to all three logo variants:
```typescript
export const listForgeLogo = {
  full: '/assets/full_logo.png',
  icon: '/assets/icon_logo.png',
  text: '/assets/text_logo.png',
} as const
```

### 2. Logo Component
**File:** `src/components/ui/Logo.tsx`

Created a reusable Logo component with:
- Three variants: `full`, `icon`, `text`
- Four size options: `sm`, `md`, `lg`, `xl`
- Automatic sizing based on variant and size
- TypeScript types for safety

### 3. Copy Script
**File:** `copy-logos.sh`

Shell script to copy logo files from the main web app to the landing page.

### 4. Documentation
**File:** `public/assets/README.md`

Complete documentation on how to use the logos, including examples.

## Logo Files

Three logo files need to be copied from `apps/listforge-web/public/assets/`:

1. **full_logo.png** (153KB) - Icon + "ListForge" text
   - Use for: Headers, hero sections, main navigation
   - Dimensions: Full width logo

2. **icon_logo.png** (258KB) - Icon only
   - Use for: Favicons, compact spaces, mobile nav
   - Dimensions: Square

3. **text_logo.png** (86KB) - "ListForge" text only
   - Use for: Wordmarks, narrow spaces
   - Dimensions: Text-only horizontal

## Installation Steps

### Step 1: Copy Logo Files

Run the copy script from the landing page directory:

```bash
cd apps/listforge-landing
bash copy-logos.sh
```

Or manually copy:

```bash
cd apps/listforge-landing
cp ../listforge-web/public/assets/full_logo.png public/assets/
cp ../listforge-web/public/assets/icon_logo.png public/assets/
cp ../listforge-web/public/assets/text_logo.png public/assets/
```

### Step 2: Verify Files

Check that the files are in place:

```bash
ls -lh public/assets/*.png
```

You should see three PNG files.

## Usage Examples

### Using the Logo Component

```tsx
import { Logo } from '@/components/ui/Logo'

// Full logo, medium size
<Logo variant="full" size="md" />

// Icon only, large size
<Logo variant="icon" size="lg" />

// Custom className
<Logo variant="full" size="sm" className="opacity-80" />
```

### Direct Path Import

```tsx
import { listForgeLogo } from '@/data/logos'

<img
  src={listForgeLogo.full}
  alt="ListForge"
  className="h-16 w-auto"
/>
```

### Updating the Navbar

Replace the current Sparkles icon in `src/components/Navbar.tsx`:

```tsx
import { Logo } from '@/components/ui/Logo'

// Current (lines 50-60):
<a href="/" className="flex items-center gap-2 group">
  <motion.div
    whileHover={{ scale: 1.05, rotate: 5 }}
    whileTap={{ scale: 0.95 }}
    className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary"
  >
    <Sparkles className="h-4 w-4 text-primary-foreground" />
  </motion.div>
  <span className="font-bold text-xl group-hover:text-primary transition-colors">
    ListForge
  </span>
</a>

// Suggested update:
<a href="/" className="flex items-center gap-2 group">
  <Logo variant="icon" size="sm" className="transition-transform group-hover:scale-105" />
  <Logo variant="text" size="sm" className="transition-colors group-hover:opacity-80" />
</a>

// Or simpler:
<a href="/" className="flex items-center">
  <Logo variant="full" size="md" className="transition-transform hover:scale-105" />
</a>
```

### Updating the Footer

Add logo to `src/components/Footer.tsx` (around line 1):

```tsx
import { Logo } from '@/components/ui/Logo'

// In the footer content:
<div className="mb-8">
  <Logo variant="full" size="md" className="opacity-80" />
  <p className="mt-4 text-sm text-muted-foreground">
    AI-powered listing management for modern resellers
  </p>
</div>
```

## Component API

### Logo Component Props

```typescript
interface LogoProps {
  variant?: 'full' | 'icon' | 'text'  // Default: 'full'
  size?: 'sm' | 'md' | 'lg' | 'xl'    // Default: 'md'
  className?: string                   // Optional additional classes
}
```

### Size Reference

| Size | Full Logo | Icon Logo | Text Logo |
|------|-----------|-----------|-----------|
| sm   | h-8       | h-6 w-6   | h-6       |
| md   | h-12      | h-8 w-8   | h-8       |
| lg   | h-16      | h-10 w-10 | h-10      |
| xl   | h-24      | h-16 w-16 | h-16      |

## Integration with Existing App

The logos match exactly what's used in:
- **apps/listforge-web/src/layouts/AppLayout.tsx** (lines 180-193)
- **apps/listforge-web/src/routes/login.tsx** (line 45)
- **apps/listforge-web/src/routes/register.tsx** (line 56)

This ensures consistent branding across the web app and landing page.

## Maintenance

When the logos are updated in the main web app:

1. Run the copy script again:
   ```bash
   cd apps/listforge-landing
   bash copy-logos.sh
   ```

2. Commit the updated PNG files to version control

## Notes

- All logos are PNG format for best quality
- The Logo component handles responsive sizing automatically
- Use the `icon` variant for favicons and app icons
- The `full` logo is recommended for hero sections and headers
- The `text` logo works well in narrow horizontal spaces

## Source Files

Original logos location:
- **Source:** `apps/listforge-web/public/assets/`
- **Destination:** `apps/listforge-landing/public/assets/`

## Further Customization

To add more variants or sizes, edit:
- **Logo paths:** `src/data/logos.ts`
- **Size configurations:** `src/components/ui/Logo.tsx` (sizeClasses object)
