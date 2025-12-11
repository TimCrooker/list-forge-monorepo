import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CursorGlow } from '@/components/effects/CursorGlow'
import { BackToTop } from '@/components/ui/BackToTop'
import { Home } from '@/pages/Home'
import { Blog } from '@/pages/Blog'
import { BlogPost } from '@/pages/BlogPost'
import { Careers } from '@/pages/Careers'
import { About } from '@/pages/About'
import { Contact } from '@/pages/Contact'
import { Documentation } from '@/pages/Documentation'
import { CookiePolicy } from '@/pages/CookiePolicy'
import { ApiReference } from '@/pages/ApiReference'
import { Status } from '@/pages/Status'
import { PrivacyPolicy } from '@/pages/PrivacyPolicy'
import { HelpCenter } from '@/pages/HelpCenter'
import { HelpArticle } from '@/pages/HelpArticle'
import { TermsOfService } from '@/pages/TermsOfService'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Cursor glow effect - only shows on desktop */}
        <CursorGlow />

        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/api" element={<ApiReference />} />
          <Route path="/status" element={<Status />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help/:slug" element={<HelpArticle />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
        <Footer />

        {/* Back to top with scroll progress */}
        <BackToTop />
      </div>
    </Router>
  )
}

export default App
