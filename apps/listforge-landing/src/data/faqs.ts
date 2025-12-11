export interface FAQItem {
  question: string
  answer: string
}

export const faqs: FAQItem[] = [
  {
    question: 'How does the AI identify products from just a photo?',
    answer:
      'Our visual AI combines multiple technologies: computer vision identifies brand, model, and category; OCR extracts UPC/EAN/serial numbers from labels; then we cross-reference UPC databases, Amazon catalog, and web search. Each field is tracked with a confidence score (0-1) and source attribution, so you know exactly where the data came from. For items we\'re not confident about, we show you the evidence and let you decide.',
  },
  {
    question: 'What makes your pricing different from other tools?',
    answer:
      'Most tools give you generic averages. We search thousands of sold and active listings to find true comparables for YOUR specific item. You get three price bands (floor, target, ceiling) with confidence scores, plus demand signals like sell-through rates, days-to-sell, and competition analysis. Choose your strategy: Aggressive (fast sale), Balanced, or Premium (max profit). Every recommendation includes the evidence trail of comparable listings we analyzed.',
  },
  {
    question: 'Can I use this in my warehouse without WiFi?',
    answer:
      'Yes! Our mobile app is offline-first. You can capture hundreds of items with photos and barcode scanning in warehouses with no connectivity. Everything saves locally to your phone and syncs automatically when you reconnect. Perfect for bulk operations at thrift stores, estate sales, or warehouse receiving.',
  },
  {
    question: 'Which marketplaces are supported?',
    answer:
      'ListForge currently integrates with eBay, Amazon, and Facebook Marketplace. The AI automatically formats listings for each platform—categories, item specifics, attributes—so your listings look native everywhere. Inventory syncs across all platforms automatically. Additional marketplaces are in development.',
  },
  {
    question: 'How accurate is the product identification?',
    answer:
      'Our AI achieves 95% identification accuracy across common categories like electronics, clothing, collectibles, and household items. For rare or unusual items, we show confidence scores per field (brand: 0.92, model: 0.78, etc.) so you know what to double-check. You can always review and adjust before publishing. The system learns from corrections to improve over time.',
  },
  {
    question: 'What is per-field confidence tracking?',
    answer:
      'Unlike tools that give one overall confidence score, we track each field independently. You might have Brand: 0.95 (vision AI), UPC: 1.0 (OCR), Price: 0.87 (comparables analysis). This lets you quickly spot which fields need review and enables targeted re-research of low-confidence data without re-running everything.',
  },
  {
    question: 'Can I bulk process items?',
    answer:
      'Absolutely. Upload photos of multiple items and we\'ll process them in parallel. The system queues research jobs and you can monitor progress in real-time. Great for processing estate sale hauls, storage unit purchases, or daily warehouse receiving. Business plans support unlimited listings.',
  },
  {
    question: 'How do I connect my eBay or Amazon account?',
    answer:
      'Connecting your marketplace accounts is simple and secure. Go to Settings > Marketplaces in your dashboard and click "Connect" for eBay, Amazon, or Facebook. You\'ll be redirected to the marketplace\'s official OAuth login page—we never see your password. Once authorized, ListForge receives a secure token that allows us to create and manage listings on your behalf. You can revoke access anytime from your settings.',
  },
  {
    question: 'What\'s the difference between pricing tiers?',
    answer:
      'Starter (Free): 50 listings/month, basic AI identification, 2 marketplace integrations—perfect for testing. Pro ($29/mo): 500 listings/month, full pricing analysis with comparables, all marketplace integrations, bulk operations—ideal for serious resellers. Business ($99/mo): Unlimited listings, team collaboration, advanced pricing strategies, priority support—built for high-volume operations. All paid plans include a free trial.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, absolutely. There are no contracts or cancellation fees. You can cancel your subscription anytime from your account settings. If you cancel, you\'ll retain access through the end of your current billing period. You can also downgrade to the free Starter plan if you want to keep using ListForge at a lower volume.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted in transit and at rest. Marketplace credentials use OAuth tokens—we never see your passwords. Multi-tenant architecture ensures your organization\'s data is completely isolated. All activity is audit-logged for security and compliance.',
  },
]
