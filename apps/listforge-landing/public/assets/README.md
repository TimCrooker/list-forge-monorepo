# ListForge Brand Assets

This directory contains the ListForge brand logos copied from the main web application.

## Available Logos

### Full Logo (`full_logo.png`)
- Contains both the icon and the "ListForge" text
- Best used for: Headers, landing pages, main navigation
- Dimensions: Optimized for display
- Usage example:
  ```tsx
  import { listForgeLogo } from '@/data/logos'

  <img src={listForgeLogo.full} alt="ListForge" className="h-16 w-auto" />
  ```

### Icon Logo (`icon_logo.png`)
- Icon/symbol only (no text)
- Best used for: Favicons, compact spaces, mobile navigation, collapsed sidebars
- Dimensions: Square format
- Usage example:
  ```tsx
  import { listForgeLogo } from '@/data/logos'

  <img src={listForgeLogo.icon} alt="ListForge" className="h-8 w-8" />
  ```

### Text Logo (`text_logo.png`)
- Text only (no icon)
- Best used for: Wordmarks, narrow spaces
- Usage example:
  ```tsx
  import { listForgeLogo } from '@/data/logos'

  <img src={listForgeLogo.text} alt="ListForge" />
  ```

## Source

These logos are copied from: `apps/listforge-web/public/assets/`

## Copying Logos

To copy the latest logos from the main web app, run:

```bash
cd apps/listforge-landing
bash copy-logos.sh
```

Or manually copy:

```bash
cp ../listforge-web/public/assets/*.png ./public/assets/
```

## Import Usage

The logos are exported from `src/data/logos.ts`:

```typescript
import { listForgeLogo } from '@/data/logos'

// Access specific logos:
const fullLogoPath = listForgeLogo.full     // '/assets/full_logo.png'
const iconLogoPath = listForgeLogo.icon     // '/assets/icon_logo.png'
const textLogoPath = listForgeLogo.text     // '/assets/text_logo.png'
```

## Component Examples

### Navbar Logo
```tsx
<a href="/" className="flex items-center gap-2">
  <img
    src={listForgeLogo.icon}
    alt="ListForge"
    className="h-8 w-8"
  />
  <span className="font-bold text-xl">ListForge</span>
</a>
```

### Hero Section
```tsx
<img
  src={listForgeLogo.full}
  alt="ListForge"
  className="h-20 md:h-24 w-auto"
/>
```

### Footer
```tsx
<img
  src={listForgeLogo.full}
  alt="ListForge"
  className="h-12 w-auto opacity-80"
/>
```
