export interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  type: string
  description: string
}

export const benefits = [
  {
    title: 'Remote-First Culture',
    description: 'Work from anywhere in the world. We believe in flexibility and trust.',
    icon: 'Globe',
  },
  {
    title: 'Competitive Salary',
    description: 'Fair, transparent compensation with regular reviews as we grow.',
    icon: 'DollarSign',
  },
  {
    title: 'Equity & Ownership',
    description: 'Early-stage equity grants. Share in our success as we scale.',
    icon: 'TrendingUp',
  },
  {
    title: 'Flexible Time Off',
    description: 'Generous PTO policy with minimum 3 weeks vacation. Take the time you need to recharge.',
    icon: 'Calendar',
  },
  {
    title: 'Health & Wellness',
    description: 'Health, dental, and vision insurance. HSA contributions available.',
    icon: 'Heart',
  },
  {
    title: 'Learning Budget',
    description: '$1,500 annual budget for courses, books, conferences, and professional development.',
    icon: 'GraduationCap',
  },
  {
    title: 'Latest Equipment',
    description: 'MacBook Pro or equivalent, monitor, and any tools you need to do your best work.',
    icon: 'Laptop',
  },
  {
    title: 'Team Retreats',
    description: 'Annual company offsite to connect, collaborate, and celebrate wins together.',
    icon: 'Users',
  },
]

export const openPositions: JobPosting[] = [
  {
    id: 'senior-fullstack-engineer',
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
    description:
      'Build and scale our AI-powered listing platform. Work with React, NestJS, TypeScript, PostgreSQL, and LangGraph. 5+ years experience required. Strong ownership mindset and startup experience preferred.',
  },
  {
    id: 'fullstack-engineer',
    title: 'Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
    description:
      'Join our engineering team to build features across our stack. TypeScript, React, Node.js, and cloud infrastructure. 3+ years experience. Passion for clean code and great user experiences.',
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI/ML Engineer',
    department: 'Engineering',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
    description:
      'Develop AI models for product identification, pricing analysis, and listing optimization. Experience with OpenAI APIs, LangChain/LangGraph, and Python/TypeScript. Background in computer vision a plus.',
  },
  {
    id: 'product-designer',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Own the end-to-end design process for our web and mobile apps. Create intuitive experiences for resellers managing inventory at scale. 3+ years experience, strong portfolio, Figma expertise required.',
  },
  {
    id: 'customer-success-lead',
    title: 'Customer Success Lead',
    department: 'Customer Success',
    location: 'Remote (US)',
    type: 'Full-time',
    description:
      'Be our first customer success hire. Build relationships with resellers, drive product adoption, gather feedback, and shape our customer experience. 2+ years CS/account management experience.',
  },
  {
    id: 'growth-marketing-manager',
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Remote (US)',
    type: 'Full-time',
    description:
      'Drive user acquisition and growth. Own content strategy, SEO, partnerships, and community building. Experience marketing to e-commerce/reseller audiences preferred. 3+ years marketing experience.',
  },
]
