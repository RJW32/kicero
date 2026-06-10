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
import CookieConsent from './components/CookieConsent';

const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const QuestionnairePage = lazy(() => import('./pages/QuestionnairePage'));
const ClientUploadPage = lazy(() => import('./pages/ClientUploadPage'));
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
        <main id="main-content" className="relative z-[1]">
          <Suspense
            fallback={
              <div className="flex min-h-[45vh] items-center justify-center px-6 pt-24 text-sm text-white/70">
                Loading…
              </div>
            }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/questionnaire" element={<QuestionnairePage />} />
              <Route path="/client-upload" element={<ClientUploadPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Intro />
        <CookieConsent />
      </div>
    </ErrorBoundary>
  );
}
