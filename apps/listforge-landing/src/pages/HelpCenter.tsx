'use client'

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { motion } from 'framer-motion'
import {
  Search,
  User,
  Rocket,
  Smartphone,
  Brain,
  ShoppingCart,
  AlertCircle,
  ArrowRight,
  BookOpen,
  HelpCircle,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSignupUrl } from '@/lib/constants'
import { GradientOrbs } from '@/components/decorative/GradientOrbs'
import { FloatingElements } from '@/components/decorative/FloatingElements'
import { helpArticles } from '@/data/helpArticles'

const topicCategories = [
  {
    icon: User,
    title: 'Account & Billing',
    description: 'Manage your account, subscription, and payments',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Rocket,
    title: 'Getting Started',
    description: 'Learn the basics and set up your workspace',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    description: 'Capture and manage items on the go',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Brain,
    title: 'AI Research',
    description: 'Understanding automated research and pricing',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: ShoppingCart,
    title: 'Marketplace Integrations',
    description: 'Connect and manage eBay, Amazon, and more',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: AlertCircle,
    title: 'Troubleshooting',
    description: 'Fix common issues and get support',
    color: 'from-red-500 to-pink-500',
  },
]

// Get article counts per category from the actual data
const getCategoryArticleCount = (categoryTitle: string) => {
  return helpArticles.filter((article) => article.category === categoryTitle).length
}

export function HelpCenter() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return helpArticles

    const query = searchQuery.toLowerCase()
    return helpArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Filter by selected category
  const displayedArticles = useMemo(() => {
    if (!selectedCategory) return filteredArticles
    return filteredArticles.filter((article) => article.category === selectedCategory)
  }, [filteredArticles, selectedCategory])

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  const handleArticleClick = (slug: string) => {
    navigate(`/help/${slug}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <GradientOrbs variant="centered" className="opacity-30" />
        <FloatingElements variant="sparkles" />

        <div className="container relative max-w-4xl">
          <FadeIn direction="up">
            <div className="text-center mb-12">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 glow-primary">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Help Center
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers to your questions and learn how to get the most out of ListForge
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for help articles, topics, or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('')
                      setSelectedCategory(null)
                    }
                  }}
                  className={cn(
                    'w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-background',
                    'focus:border-primary focus:outline-none transition-colors',
                    'text-base placeholder:text-muted-foreground'
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  Press <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">ESC</kbd>{' '}
                  to clear search
                </p>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-16">
        <div className="container">
          <FadeIn direction="up" className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Popular Topics</h2>
            <p className="text-muted-foreground">
              Browse help articles by category
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {topicCategories.map((topic) => (
              <StaggerItem key={topic.title}>
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategoryClick(topic.title)}
                  className={cn(
                    'group w-full text-left p-6 rounded-xl border bg-card hover:shadow-lg transition-all',
                    selectedCategory === topic.title
                      ? 'border-primary shadow-lg ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  )}
                >
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4',
                      'bg-gradient-to-br',
                      topic.color,
                      'group-hover:scale-110 transition-transform'
                    )}
                  >
                    <topic.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {topic.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {getCategoryArticleCount(topic.title)} articles
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-4xl">
          <FadeIn direction="up" className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {searchQuery ? 'Search Results' : selectedCategory ? `${selectedCategory} Articles` : 'Popular Articles'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? `Found ${displayedArticles.length} article${displayedArticles.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                : selectedCategory
                ? `Browse ${selectedCategory.toLowerCase()} help articles`
                : 'Most read articles from our community'}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(null)
                }}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </FadeIn>

          {displayedArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No articles found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(null)
                }}
                className="text-primary hover:underline"
              >
                Clear search and browse all articles
              </button>
            </div>
          ) : (
            <StaggerContainer className="space-y-3">
              {displayedArticles.map((article, index) => (
                <StaggerItem key={index}>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleArticleClick(article.slug)}
                    className="group w-full text-left p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {article.category}
                          </span>
                          <span>•</span>
                          <span>{article.readTime} read</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </motion.button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
        <GradientOrbs variant="scattered" className="opacity-20" />

        <div className="container relative max-w-3xl">
          <FadeIn direction="up">
            <div className="text-center p-8 sm:p-12 rounded-2xl border bg-card/50 backdrop-blur">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 glow-primary">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Our support team is here to help. Get in touch and we'll respond within 24 hours.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="mailto:support@listforge.io"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors glow-primary-hover"
                >
                  Contact Support
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={getSignupUrl()}
                  className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Start Free Trial
                </motion.a>
              </div>

              <div className="mt-8 pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Average response time: <span className="font-semibold text-foreground">2 hours</span>
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
