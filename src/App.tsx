import {useEffect, lazy, Suspense} from 'react';
import {Routes, Route, useLocation} from 'react-router-dom';
import Intro from './components/Intro';
import Header from './components/Header';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Grain from './components/Grain';
import ParallaxBackground from './components/ParallaxBackground';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import SeoHead from './seo/SeoHead';
import Analytics from './components/Analytics';

const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const QuestionnairePage = lazy(() => import('./pages/QuestionnairePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ScrollToTop() {
  const {pathname} = useLocation();

  useEffect(() => {
    // Force-jump to top on route change. Using `auto` (instead of relying on
    // CSS smooth scroll) avoids fighting the parallax springs that animate
    // off scroll position.
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <SeoHead />
      <Analytics />
      <div className="relative min-h-screen">
        <Cursor />
        <Grain />
        <ParallaxBackground />
        <Header />
        <main id="main-content" className="relative">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/questionnaire" element={<QuestionnairePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Intro />
      </div>
    </ErrorBoundary>
  );
}
