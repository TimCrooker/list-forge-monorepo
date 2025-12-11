'use client'

import { marketplaceLogos } from '@/data/logos'
import { FadeIn } from './animations/FadeIn'
import { WavesDivider } from './decorative/WavesDivider'

export function LogoCloudSection() {
  // Double the logos for seamless infinite scroll
  const doubledLogos = [...marketplaceLogos, ...marketplaceLogos]

  return (
    <section id="integrations" className="relative py-16 bg-muted/30">
      {/* Top wave */}
      <WavesDivider position="top" variant="curved" className="text-background" />

      <div className="container">
        <FadeIn direction="up" className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
            Integrates with your favorite marketplaces
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            List once, sell everywhere. Connect all your sales channels in minutes.
          </p>
        </FadeIn>
      </div>

      {/* Marquee container */}
      <div className="relative overflow-hidden">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

        {/* Scrolling logos */}
        <div className="flex animate-marquee">
          {doubledLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 mx-8 group"
            >
              <div className="flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <WavesDivider position="bottom" variant="curved" className="text-background" />
    </section>
  )
}
