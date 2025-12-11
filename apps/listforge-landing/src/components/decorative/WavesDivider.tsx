'use client'

export interface WavesDividerProps {
  variant?: 'simple' | 'layered' | 'curved'
  position?: 'top' | 'bottom'
  flip?: boolean
  className?: string
  color?: string
}

export function WavesDivider({
  variant = 'simple',
  position,
  flip = false,
  className = '',
  color = 'fill-current',
}: WavesDividerProps) {
  // Position-based flip: top should flip, bottom should not
  const shouldFlip = position ? position === 'top' : flip
  const flipClass = shouldFlip ? 'rotate-180' : ''
  const positionClass = position === 'top' ? 'absolute top-0 left-0 right-0' : position === 'bottom' ? 'absolute bottom-0 left-0 right-0' : ''

  if (variant === 'simple') {
    return (
      <div className={`w-full overflow-hidden ${positionClass} ${className}`}>
        <svg
          className={`w-full h-12 md:h-16 ${flipClass}`}
          viewBox="0 0 1440 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 22L60 25.3C120 28.7 240 35.3 360 36.2C480 37 600 32 720 29.8C840 27.7 960 28.3 1080 30.5C1200 32.7 1320 36.3 1380 38.2L1440 40V54H1380C1320 54 1200 54 1080 54C960 54 840 54 720 54C600 54 480 54 360 54C240 54 120 54 60 54H0V22Z"
            className={color}
          />
        </svg>
      </div>
    )
  }

  if (variant === 'layered') {
    return (
      <div className={`w-full overflow-hidden ${positionClass} ${className}`}>
        <svg
          className={`w-full h-16 md:h-24 ${flipClass}`}
          viewBox="0 0 1440 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 37L48 39.2C96 41.3 192 45.7 288 46.5C384 47.3 480 44.7 576 40.2C672 35.7 768 29.3 864 28.8C960 28.3 1056 33.7 1152 36.3C1248 39 1344 39 1392 39L1440 39V74H1392C1344 74 1248 74 1152 74C1056 74 960 74 864 74C768 74 672 74 576 74C480 74 384 74 288 74C192 74 96 74 48 74H0V37Z"
            className="fill-primary/5"
          />
          <path
            d="M0 44L48 45.7C96 47.3 192 50.7 288 51.3C384 52 480 50 576 47C672 44 768 40 864 39.7C960 39.3 1056 42.7 1152 45C1248 47.3 1344 48.7 1392 49.3L1440 50V74H1392C1344 74 1248 74 1152 74C1056 74 960 74 864 74C768 74 672 74 576 74C480 74 384 74 288 74C192 74 96 74 48 74H0V44Z"
            className={color}
          />
        </svg>
      </div>
    )
  }

  // Curved variant
  return (
    <div className={`w-full overflow-hidden ${positionClass} ${className}`}>
      <svg
        className={`w-full h-12 md:h-20 ${flipClass}`}
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 30C240 45 480 52 720 52C960 52 1200 45 1440 30V60H0V30Z"
          className={color}
        />
      </svg>
    </div>
  )
}
