import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';

export default function Home() {
  const [isDesktop, setIsDesktop] = useState(false);
  const philosophyRef = useRef<HTMLElement>(null);
  const portfolioRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const factor = isDesktop ? 1 : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const { scrollYProgress: portfolioProgress } = useScroll({
    target: portfolioRef,
    offset: ['start end', 'end start'],
  });
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ['start end', 'end start'],
  });
  const { scrollYProgress: servicesProgress } = useScroll({
    target: servicesRef,
    offset: ['start end', 'end start'],
  });
  const smoothCta = useSpring(ctaProgress, { stiffness: 62, damping: 20, mass: 0.5 });
  const smoothPortfolio = useSpring(portfolioProgress, { stiffness: 62, damping: 20, mass: 0.5 });
  const smoothServices = useSpring(servicesProgress, { stiffness: 62, damping: 20, mass: 0.5 });
  const ctaBgY = useTransform(smoothCta, [0, 1], [90, -90]);
  const ctaEliteY = useTransform(smoothCta, [0, 1], [130, -140]);
  const ctaEliteX = useTransform(smoothCta, [0, 1], [24, -28]);
  const ctaEliteGlowY = useTransform(smoothCta, [0, 1], [70, -80]);
  const ctaGridY = useTransform(smoothCta, [0, 1], [30, -30]);
  const ctaRingRotate = useTransform(smoothCta, [0, 1], [0, 16]);
  const ctaRingY = useTransform(smoothCta, [0, 1], [36, -42]);
  const ctaNoiseOpacity = useTransform(smoothCta, [0, 0.5, 1], [0.08, 0.14, 0.08]);
  const portfolioOrbY = useTransform(smoothPortfolio, [0, 1], [160 * factor, -160 * factor]);
  const portfolioLineY = useTransform(smoothPortfolio, [0, 1], [180 * factor, -180 * factor]);
  const servicesOrbY = useTransform(smoothServices, [0, 1], [150 * factor, -150 * factor]);
  const servicesLineY = useTransform(smoothServices, [0, 1], [170 * factor, -170 * factor]);

  return (
    <>
      {/* Development Disclaimer Section */}
      <section id="disclaimer" className="pt-32 pb-16 bg-brand-white border-b border-brand-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-black mb-6"
          >
            <span className="font-display font-bold text-xl">!</span>
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl md:text-3xl font-bold tracking-tighter mb-4 uppercase"
          >
            Project Under Development
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-brand-gray-600 text-base md:text-lg font-light leading-relaxed"
          >
            Please note that the <span className="font-bold text-brand-black">Kicero</span> website is currently in its development phase. The content, design, and features shown here are not final and are subject to change as we fine-tune the experience.
          </motion.p>
        </div>
      </section>

      <Hero />
      
      <div className="py-24 px-6 max-w-7xl mx-auto flex flex-col gap-40">
         <motion.section
           ref={philosophyRef}
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="text-center"
         >
           <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">
             Our philosophy
           </span>
           <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 italic leading-none">
             SIMPLE, HIGH-END, <br />
             LOW COST WEBSITES <br />
             PERSONALISED TO YOU
           </h2>
          <p className="max-w-2xl mx-auto text-brand-gray-600 text-lg md:text-xl font-light leading-relaxed">
            At Kicero, we create simple yet high-end websites at a low cost for individuals, startups, and growing businesses. We stay personal and connected throughout the process, helping small businesses build credibility and strengthen their reputation online without paying top-penny agency prices.
          </p>
         </motion.section>

         <motion.section
           ref={portfolioRef}
           initial={{ opacity: 0, y: 32 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-80px" }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="relative"
         >
            <motion.div
              style={{ y: portfolioOrbY }}
              className="pointer-events-none absolute -top-14 -right-8 h-48 w-48 rounded-full bg-brand-gray-100/70 blur-2xl -z-10"
            />
            <motion.div
              style={{ y: portfolioLineY }}
              className="pointer-events-none absolute top-10 -left-4 h-64 w-px bg-brand-gray-200/70"
            />
            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end mb-16 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">Crafted Work</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">PORTFOLIO</h2>
              </div>
              <p className="text-brand-gray-500 font-mono text-xs uppercase tracking-wide md:tracking-widest max-w-xs text-left md:text-right">
                A selection of just some of the websites we have built for our clients.
              </p>
            </div>
            <Portfolio />
         </motion.section>

         <motion.section
           ref={ctaRef}
           initial={{ opacity: 0, scale: 0.98 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="bg-brand-black text-brand-white p-12 md:p-32 relative overflow-hidden"
         >
           <motion.div
             style={{ y: ctaGridY, opacity: ctaNoiseOpacity }}
             className="pointer-events-none absolute inset-0"
           >
             <div
               className="h-full w-full"
               style={{
                 backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                 backgroundSize: '42px 42px'
               }}
             />
           </motion.div>
           <motion.div
             style={{ y: ctaBgY }}
             className="absolute -right-20 -bottom-20 text-[28vw] font-black text-white/[0.04] select-none font-display"
           >
             ELITE
           </motion.div>
           <motion.div
             style={{ y: ctaEliteGlowY }}
             className="pointer-events-none absolute -right-14 top-[12%] h-44 w-44 rounded-full bg-white/10 blur-3xl"
           />
           <motion.div
             style={{ y: ctaEliteY, x: ctaEliteX }}
             className="pointer-events-none absolute right-[5%] top-[20%] text-[22vw] md:text-[16vw] font-display font-black uppercase leading-none tracking-tighter text-white/[0.16]"
           >
             ELITE
           </motion.div>
           <motion.div
             style={{ y: ctaRingY, rotate: ctaRingRotate }}
             className="pointer-events-none absolute -left-16 top-[14%] h-56 w-56 border border-white/15 rounded-full"
           />
           <motion.div
             style={{ y: ctaRingY, rotate: ctaRingRotate }}
             className="pointer-events-none absolute left-[8%] top-[22%] h-24 w-24 border border-white/10 rounded-full"
           />
           
           <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase tracking-tight mb-10 leading-[0.95] break-words">
               READY TO <br />
               EXPAND AND PROFESSIONALISE
               <br />
               YOUR BUSINESS?
             </h2>
            <Link 
               to="/contact" 
               className="group inline-flex items-center gap-3 md:gap-6 text-xs md:text-sm font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] border-b border-white/30 pb-4 hover:border-white transition-all duration-500"
             >
               Start your project <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-500" />
             </Link>
           </div>
         </motion.section>

         <motion.section
           ref={servicesRef}
           initial={{ opacity: 0, y: 32 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-80px" }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="text-center relative"
         >
            <motion.div
              style={{ y: servicesOrbY }}
              className="pointer-events-none absolute -bottom-12 left-[10%] h-56 w-56 rounded-full bg-brand-gray-100 blur-3xl"
            />
            <motion.div
              style={{ y: servicesLineY }}
              className="pointer-events-none absolute -top-2 right-[12%] h-72 w-px bg-brand-gray-200/70"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">Capabilities</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-16 uppercase tracking-tighter">Our Services</h2>
            <Services />
         </motion.section>
      </div>
    </>
  );
}
