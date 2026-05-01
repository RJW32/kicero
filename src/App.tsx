import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Intro from './components/Intro';
import Header from './components/Header';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Grain from './components/Grain';
import ParallaxBackground from './components/ParallaxBackground';
import Home from './pages/Home';
import ServicesPage from './pages/ServicesPage';
import PortfolioPage from './pages/PortfolioPage';
import ContactPage from './pages/ContactPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="relative min-h-screen">
        {!introFinished && (
          <Intro onComplete={() => setIntroFinished(true)} />
        )}
        
        <AnimatePresence>
          {introFinished && (
            <motion.div
              key="main-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <Cursor />
              <Grain />
              <ParallaxBackground />
              <Header />
              <main className="relative">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                </Routes>
              </main>
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

