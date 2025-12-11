import { Hero } from '@/components/Hero'
import { LogoCloudSection } from '@/components/LogoCloudSection'
import { StatsSection } from '@/components/StatsSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { FeatureShowcase } from '@/components/FeatureShowcase'
import { TestimonialsSection } from '@/components/TestimonialsSection'
import { PricingSection } from '@/components/PricingSection'
import { FAQSection } from '@/components/FAQSection'
import { CTASection } from '@/components/CTASection'

export function Home() {
  return (
    <main>
      <Hero />
      <LogoCloudSection />
      <StatsSection />
      <FeaturesSection />
      <FeatureShowcase />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </main>
  )
}
