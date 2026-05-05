import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Magnetic from './Magnetic';

export default function Hero() {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(false);
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 65, damping: 22, mass: 0.5 });
  const parallaxFactor = isDesktop ? 1 : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  // Parallax offsets
  const yBox = useTransform(smoothScrollY, [0, 600], [0, -340 * parallaxFactor]);
  const yTag = useTransform(smoothScrollY, [0, 600], [0, -220 * parallaxFactor]);
  const performanceTagY = useTransform(smoothScrollY, [0, 600], [0, 150 * parallaxFactor]);
  const boxRotate = useTransform(smoothScrollY, [0, 600], [0, -8 * parallaxFactor]);
  const boxScale = useTransform(smoothScrollY, [0, 600], [1, 1.08 * parallaxFactor + (1 - parallaxFactor)]);
  const opacity = useTransform(smoothScrollY, [0, 300], [1, 0]);

  const handleLinkClick = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative pt-20 pb-20 md:pt-32 md:pb-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-3 py-1 bg-brand-gray-100 text-brand-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              Full-Stack Web Development Agency
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 break-words">
              WE BUILD <br />
              COMMANDING <br />
              <span className="italic">PRESENCE.</span>
            </h1>
            <p className="max-w-md text-lg text-brand-gray-700 font-light leading-relaxed mb-10">
              Elite digital identities for brands that refuse to blend in. We specialize in high-performance web experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Magnetic>
                <Link 
                  to="/portfolio"
                  className="group flex items-center justify-center gap-3 px-8 py-5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-all font-mono"
                  onClick={() => handleLinkClick('/portfolio')}
                >
                  View Works
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link 
                  to="/contact"
                  className="flex items-center justify-center px-8 py-5 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all font-mono"
                  onClick={() => handleLinkClick('/contact')}
                >
                  Let's Talk
                </Link>
              </Magnetic>
            </div>
          </motion.div>

          <motion.div
            style={{ y: yBox, rotate: boxRotate, scale: boxScale }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="hidden lg:block relative"
          >
            <div className="aspect-[4/5] bg-brand-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <span className="font-display text-[25rem] font-bold select-none text-black">K</span>
              </div>
              <motion.div 
                style={{ y: yTag }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-black/10 flex items-center justify-center"
              >
                 <div className="w-1/2 h-1/2 bg-black flex items-center justify-center p-8 shadow-2xl">
                    <span className="text-white font-display text-4xl font-bold italic tracking-tighter">Kicero.</span>
                 </div>
              </motion.div>
              
              {/* Floating accents */}
              <motion.div 
                style={{ y: yTag }}
                className="absolute top-10 right-10 px-4 py-2 bg-white border border-black text-[10px] font-bold uppercase tracking-widest"
              >
                Minimal
              </motion.div>
              <motion.div 
                style={{ y: performanceTagY }}
                className="absolute bottom-10 left-10 px-4 py-2 bg-white border border-black text-[10px] font-bold uppercase tracking-widest"
              >
                Performance
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Background decoration */}
      <motion.div 
        style={{ opacity }}
        className="absolute top-0 right-0 -z-10 w-1/3 h-full bg-brand-gray-50 opacity-50" 
      />
    </section>
  );
}
