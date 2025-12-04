import React from 'react'
import { Moon, Sun, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from './theme-provider'
import { themes } from '@/lib/themes'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  showThemeSelector?: boolean
  className?: string
}

export const ThemeToggle = ({ showThemeSelector = false, className }: ThemeToggleProps) => {
  const { mode, theme, toggleMode, setTheme } = useTheme()

  if (!showThemeSelector) {
    return (
      <Button className={className} size="icon" variant="ghost" onClick={toggleMode}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className} size="icon" variant="ghost">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggleMode()}>
          {mode === 'light' ? (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark mode</span>
            </>
          ) : (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light mode</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color Scheme</DropdownMenuLabel>
        {Object.entries(themes).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            className={cn(theme === key && 'bg-accent')}
            onClick={() => setTheme(key as keyof typeof themes)}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{
                  backgroundColor: `hsl(${config.cssVars[mode].primary})`,
                }}
              />
              <span>{config.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface AdvancedThemeToggleProps {
  className?: string
}

export const AdvancedThemeToggle = ({ className }: AdvancedThemeToggleProps) => {
  const { mode, theme, setMode, setTheme } = useTheme()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <Palette className="mr-2 h-4 w-4" />
            {themes[theme].name}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Color Scheme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(themes).map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              className={cn(theme === key && 'bg-accent')}
              onClick={() => setTheme(key as keyof typeof themes)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{
                    backgroundColor: `hsl(${config.cssVars[mode].primary})`,
                  }}
                />
                <span>{config.name}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center rounded-md border p-1">
        <Button
          className="h-7 w-7"
          size="icon"
          variant={mode === 'light' ? 'default' : 'ghost'}
          onClick={() => setMode('light')}
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          className="h-7 w-7"
          size="icon"
          variant={mode === 'dark' ? 'default' : 'ghost'}
          onClick={() => setMode('dark')}
        >
          <Moon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
