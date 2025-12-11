'use client'

import { useParams, useNavigate, Link } from 'react-router-dom'
import { blogPosts } from '@/data/blog'
import { FadeIn } from '@/components/animations/FadeIn'
import { GridPattern } from '@/components/decorative/GridPattern'
import { GradientOrbs } from '@/components/decorative/GradientOrbs'
import { Calendar, Clock, User, ArrowLeft, Tag } from 'lucide-react'
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
    // Arrow symbols
    .replace(/→/g, '<span class="text-primary">→</span>')
}

export function BlogPost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const post = blogPosts.find((p) => p.id === id)

  if (!post) {
    return (
      <main className="relative pt-32 pb-20 overflow-hidden">
        <GridPattern variant="dots" className="opacity-40" />
        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-6">Blog Post Not Found</h1>
            <p className="text-lg text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </FadeIn>
        </div>
      </main>
    )
  }

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
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </motion.button>

            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Tag className="h-3.5 w-3.5" />
              {post.category}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">{post.excerpt}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pb-8 border-b border-border/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{post.author.name}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{post.author.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
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
                  {post.content ? (
                    <div className="markdown-content space-y-6">
                      {post.content.split('\n\n').map((block, index) => {
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
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        This blog post is currently being written. Check back soon for the full article
                        with tips, insights, and detailed guidance on {post.title.toLowerCase()}.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Posts Section */}
              <div className="mt-16 pt-16 border-t border-border/50">
                <h2 className="text-2xl font-bold mb-8">More from the Blog</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {blogPosts
                    .filter((p) => p.id !== post.id)
                    .slice(0, 3)
                    .map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        to={`/blog/${relatedPost.id}`}
                        className="group block p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                          {relatedPost.category}
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </Link>
                    ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </main>
  )
}
