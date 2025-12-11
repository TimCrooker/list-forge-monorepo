'use client'

import { useParams, useNavigate, Link } from 'react-router-dom'
import { helpArticles } from '@/data/helpArticles'
import { FadeIn } from '@/components/animations/FadeIn'
import { GridPattern } from '@/components/decorative/GridPattern'
import { GradientOrbs } from '@/components/decorative/GradientOrbs'
import { Clock, ArrowLeft, Tag, BookOpen, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

// Helper to format inline markdown (bold, italic, code, links)
function formatInlineMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
}

export function HelpArticle() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const article = helpArticles.find((a) => a.slug === slug)

  if (!article) {
    return (
      <main className="relative pt-32 pb-20 overflow-hidden">
        <GridPattern variant="dots" className="opacity-40" />
        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-6">Article Not Found</h1>
            <p className="text-lg text-muted-foreground mb-8">
              The help article you're looking for doesn't exist or has been moved.
            </p>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Help Center
            </Link>
          </FadeIn>
        </div>
      </main>
    )
  }

  // Get related articles from the same category
  const relatedArticles = helpArticles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3)

  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <GridPattern variant="dots" className="opacity-40" />
        <GradientOrbs variant="scattered" className="opacity-20" />

        <div className="container relative">
          <FadeIn direction="up" className="max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.button
              onClick={() => navigate('/help')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Help Center
            </motion.button>

            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Tag className="h-3.5 w-3.5" />
              {article.category}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pb-8 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} read</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Help Article</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative py-12 pb-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <FadeIn direction="up">
              <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                <div className="rounded-2xl bg-card border border-border/50 p-8 md:p-12">
                  <div className="markdown-content space-y-6">
                    {article.content.split('\n\n').map((block, index) => {
                      const trimmed = block.trim()
                      if (!trimmed) return null

                      // Headers
                      if (trimmed.startsWith('## ')) {
                        return <h2 key={index} className="text-2xl font-bold mt-10 mb-4 text-foreground">{trimmed.slice(3)}</h2>
                      }
                      if (trimmed.startsWith('### ')) {
                        return <h3 key={index} className="text-xl font-bold mt-8 mb-3 text-foreground">{trimmed.slice(4)}</h3>
                      }

                      // Lists
                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        const items = trimmed.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
                        return (
                          <ul key={index} className="list-disc pl-6 space-y-2 text-muted-foreground">
                            {items.map((item, i) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.replace(/^[-*]\s*/, '')) }} />
                            ))}
                          </ul>
                        )
                      }

                      // Numbered lists
                      if (/^\d+\.\s/.test(trimmed)) {
                        const items = trimmed.split('\n').filter(line => /^\d+\.\s/.test(line.trim()))
                        return (
                          <ol key={index} className="list-decimal pl-6 space-y-2 text-muted-foreground">
                            {items.map((item, i) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.replace(/^\d+\.\s*/, '')) }} />
                            ))}
                          </ol>
                        )
                      }

                      // Tables
                      if (trimmed.includes('|') && trimmed.includes('---')) {
                        const rows = trimmed.split('\n').filter(row => row.trim() && !row.includes('---'))
                        return (
                          <div key={index} className="overflow-x-auto my-6">
                            <table className="min-w-full border border-border/50 rounded-lg">
                              <thead>
                                <tr className="bg-muted/50">
                                  {rows[0]?.split('|').filter(Boolean).map((cell, i) => (
                                    <th key={i} className="px-4 py-2 text-left text-sm font-semibold border-b border-border/50">{cell.trim()}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.slice(1).map((row, rowIndex) => (
                                  <tr key={rowIndex} className="border-b border-border/30">
                                    {row.split('|').filter(Boolean).map((cell, cellIndex) => (
                                      <td key={cellIndex} className="px-4 py-2 text-sm text-muted-foreground">{cell.trim()}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      }

                      // Regular paragraphs
                      return (
                        <p key={index} className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Related Articles Section */}
              {relatedArticles.length > 0 && (
                <div className="mt-16 pt-16 border-t border-border/50">
                  <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {relatedArticles.map((relatedArticle) => (
                      <Link
                        key={relatedArticle.slug}
                        to={`/help/${relatedArticle.slug}`}
                        className="group block p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                          {relatedArticle.category}
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedArticle.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{relatedArticle.readTime} read</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Support CTA */}
              <div className="mt-12 p-6 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Still need help?</h3>
                    <p className="text-sm text-muted-foreground">Our support team is here to assist you.</p>
                  </div>
                  <a
                    href="mailto:support@listforge.io"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Contact Support
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </main>
  )
}
