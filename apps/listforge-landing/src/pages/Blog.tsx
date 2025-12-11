'use client'

import { blogPosts } from '@/data/blog'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GridPattern } from '@/components/decorative/GridPattern'
import { GradientOrbs } from '@/components/decorative/GradientOrbs'
import { TiltCard } from '@/components/effects/TiltCard'
import { Calendar, Clock, User, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function Blog() {
  const featuredPost = blogPosts.find((post) => post.featured)
  const regularPosts = blogPosts.filter((post) => !post.featured)

  return (

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <GridPattern variant="dots" className="opacity-40" />
          <GradientOrbs variant="scattered" className="opacity-20" />

          <div className="container relative">
            <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="h-4 w-4" />
                Latest Insights & Updates
              </motion.div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
                ListForge Blog
              </h1>
              <p className="text-lg text-muted-foreground">
                Tips, guides, and updates to help you scale your reselling business
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Featured Article */}
        {featuredPost && (
          <section className="relative py-12">
            <div className="container">
              <FadeIn direction="up">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Featured Article</h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-teal-400 rounded-full" />
                </div>
                <TiltCard tiltAmount={3} glareEnabled className="w-full">
                  <Link to={`/blog/${featuredPost.id}`} className="block">
                    <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50">
                      <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Side */}
                        <div className="relative h-64 md:h-auto bg-gradient-to-br from-primary/20 via-teal-400/20 to-primary/20 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <Sparkles className="h-24 w-24 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                        </div>

                        {/* Content Side */}
                        <div className="p-8 md:p-10 flex flex-col justify-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 w-fit">
                            <Sparkles className="h-3 w-3" />
                            Featured
                          </div>

                          <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                            {featuredPost.title}
                          </h3>

                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {featuredPost.excerpt}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{featuredPost.author.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(featuredPost.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{featuredPost.readTime}</span>
                            </div>
                          </div>

                          <motion.div
                            whileHover={{ x: 5 }}
                            className="inline-flex items-center gap-2 text-primary font-semibold group/btn"
                          >
                            Read Article
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </FadeIn>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        <section className="relative py-12 pb-24">
          <div className="container">
            <FadeIn direction="up" className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Latest Articles</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-primary to-teal-400 rounded-full" />
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <StaggerItem key={post.id}>
                  <TiltCard tiltAmount={5} glareEnabled className="h-full">
                    <Link to={`/blog/${post.id}`} className="block h-full">
                      <div className="group relative h-full flex flex-col rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg">
                        {/* Image/Icon Section */}
                        <div className="relative h-48 bg-gradient-to-br from-primary/10 via-teal-400/10 to-primary/10 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative">
                            {post.category === 'AI & Technology' && (
                              <Sparkles className="h-16 w-16 text-primary/50 group-hover:scale-110 transition-transform duration-300" />
                            )}
                            {post.category === 'Tips & Guides' && (
                              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-3xl">💡</span>
                              </div>
                            )}
                            {post.category === 'Product Updates' && (
                              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-3xl">🚀</span>
                              </div>
                            )}
                            {post.category === 'Success Stories' && (
                              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-3xl">🌟</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3 w-fit">
                            {post.category}
                          </div>

                          <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>

                          {/* Meta Info */}
                          <div className="space-y-2 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{post.author.name}</span>
                              <span className="text-muted-foreground/50">·</span>
                              <span>{post.author.role}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(post.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <span className="text-muted-foreground/50">·</span>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                <span>{post.readTime}</span>
                              </div>
                            </div>
                          </div>

                          {/* Read More Link */}
                          <motion.div
                            className="mt-4 inline-flex items-center gap-2 text-primary font-semibold text-sm group/link"
                            whileHover={{ x: 5 }}
                          >
                            Read More
                            <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </main>
  )
}
