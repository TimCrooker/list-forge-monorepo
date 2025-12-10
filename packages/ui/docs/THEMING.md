# Theming Guide

The @listforge/ui component library includes a powerful runtime theming system with dark mode support.

## Features

- 🎨 **Multiple Color Themes**: Default, Red, Green, and Blue themes
- 🌓 **Dark Mode Support**: Seamless switching between light and dark modes
- 💾 **Persistent State**: Theme preferences are saved to localStorage
- 🎯 **Runtime Configuration**: Change themes without page reload
- 🌐 **System Preference Detection**: Automatically follows system dark mode preference

## Basic Usage

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@listforge/ui'

function App() {
  return (
    <ThemeProvider enableSystem>
      <YourApp />
    </ThemeProvider>
  )
}
```

### 2. Add Theme Toggle

```tsx
import { ThemeToggle } from '@listforge/ui'

// Simple dark mode toggle
<ThemeToggle />

// Toggle with theme selector dropdown
<ThemeToggle showThemeSelector />
```

### 3. Advanced Theme Control

```tsx
import { AdvancedThemeToggle } from '@listforge/ui'

// Shows both theme selector and mode toggle
<AdvancedThemeToggle />
```

## Using the Theme Hook

Access theme state and controls programmatically:

```tsx
import { useTheme } from '@listforge/ui'

function MyComponent() {
  const { theme, mode, setTheme, setMode, toggleMode } = useTheme()

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Current mode: {mode}</p>
      <button onClick={toggleMode}>Toggle Dark Mode</button>
      <button onClick={() => setTheme('blue')}>Use Blue Theme</button>
    </div>
  )
}
```

## Available Themes

- **default**: Classic shadcn/ui theme
- **red**: Vibrant red accents
- **green**: Nature-inspired green palette
- **blue**: Professional blue theme

## ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `Theme` | `'default'` | Initial theme to use |
| `defaultMode` | `'light' \| 'dark'` | `'light'` | Initial mode |
| `enableSystem` | `boolean` | `true` | Follow system dark mode preference |

## CSS Variables

The theme system works by updating CSS variables at runtime. Each theme defines variables for:

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

## Global State Management

The theme state is automatically persisted to localStorage. If you need to sync with a global state manager:

```tsx
// Example with Zustand
import { create } from 'zustand'
import { useTheme } from '@listforge/ui'

const useThemeStore = create((set) => ({
  theme: 'default',
  mode: 'light',
  setTheme: (theme) => set({ theme }),
  setMode: (mode) => set({ mode }),
}))

// Sync component
function ThemeSync() {
  const { theme, mode } = useTheme()
  const store = useThemeStore()

  useEffect(() => {
    store.setTheme(theme)
    store.setMode(mode)
  }, [theme, mode])

  return null
}
```

## Dark Mode Styling

Use Tailwind's dark mode utilities:

```tsx
<div className="bg-white dark:bg-black">
  <p className="text-black dark:text-white">
    This text adapts to the theme mode
  </p>
</div>
```

## Custom Themes

To add custom themes, extend the `themes` object:

```tsx
import { themes, applyTheme } from '@listforge/ui'

const customThemes = {
  ...themes,
  purple: {
    name: "Purple",
    cssVars: {
      light: {
        // Define your light mode colors
        primary: "270 50% 40%",
        // ... other variables
      },
      dark: {
        // Define your dark mode colors
        primary: "270 50% 60%",
        // ... other variables
      }
    }
  }
}
```




