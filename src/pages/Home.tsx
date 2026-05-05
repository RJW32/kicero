import {motion, useScroll, useSpring, useTransform} from 'motion/react';
import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import WhyKicero from '../components/WhyKicero';
import Process from '../components/Process';
import Testimonials from '../components/Testimonials';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';
import {servicesListSchema} from '../seo/structuredData';
import {
  useIsDesktop,
  usePrefersReducedMotion,
} from '../hooks/useMediaQuery';

const showDevDisclaimer = import.meta.env.VITE_SHOW_DEV_DISCLAIMER === 'true';

const FADE_VIEWPORT = {once: true, margin: '-80px'} as const;
const FADE_TRANSITION = {duration: 0.8, ease: [0.16, 1, 0.3, 1]} as const;

export default function Home() {
  usePageSeo({
    meta: pageMeta.home,
    structuredData: [servicesListSchema],
  });
  const isDesktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();
  const parallaxOn = isDesktop && !reducedMotion;

  const ctaRef = useRef<HTMLElement>(null);
  const {scrollYProgress: ctaProgress} = useScroll({
    target: ctaRef,
    offset: ['start end', 'end start'],
  });
  const smoothCta = useSpring(ctaProgress, {
    stiffness: 60,
    damping: 22,
    mass: 0.5,
  });

  const ctaBgY = useTransform(smoothCta, [0, 1], parallaxOn ? [90, -90] : [0, 0]);
  const ctaEliteY = useTransform(
    smoothCta,
    [0, 1],
    parallaxOn ? [120, -130] : [0, 0],
  );
  const ctaRingRotate = useTransform(
    smoothCta,
    [0, 1],
    parallaxOn ? [0, 16] : [0, 0],
  );

  return (
    <>
      {showDevDisclaimer && (
        <section
          id="disclaimer"
          className="pt-32 pb-16 bg-brand-white border-b border-brand-gray-100"
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{scale: 0.8, opacity: 0}}
              whileInView={{scale: 1, opacity: 1}}
              viewport={{once: true}}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-black mb-6"
            >
              <span className="font-display font-bold text-xl">!</span>
            </motion.div>
            <motion.h2
              initial={{y: 20, opacity: 0}}
              whileInView={{y: 0, opacity: 1}}
              viewport={{once: true}}
              transition={{delay: 0.1}}
              className="font-display text-2xl md:text-3xl font-bold tracking-tighter mb-4 uppercase"
            >
              Project Under Development
            </motion.h2>
            <motion.p
              initial={{y: 20, opacity: 0}}
              whileInView={{y: 0, opacity: 1}}
              viewport={{once: true}}
              transition={{delay: 0.2}}
              className="text-brand-gray-600 text-base md:text-lg font-light leading-relaxed"
            >
              Please note that the{' '}
              <span className="font-bold text-brand-black">Kicero</span> website
              is currently in its development phase. The content, design, and
              features shown here are not final and are subject to change as we
              fine-tune the experience.
            </motion.p>
          </div>
        </section>
      )}

      <Hero />

      <div className="py-24 px-6 max-w-7xl mx-auto flex flex-col gap-40">
        <motion.section
          initial={{opacity: 0, y: 40}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, margin: '-100px'}}
          transition={FADE_TRANSITION}
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
            At Kicero, we build simple yet high-end websites at low cost for
            small businesses, startups and individuals across the UK. Designed
            and developed in Scotland, we stay personal and connected
            throughout the process — helping small businesses build credibility
            online without paying top-penny agency prices.
          </p>
        </motion.section>

        <WhyKicero />

        <Process />

        <motion.section
          initial={{opacity: 0, y: 32}}
          whileInView={{opacity: 1, y: 0}}
          viewport={FADE_VIEWPORT}
          transition={FADE_TRANSITION}
          className="relative"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end mb-16 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
                Crafted Work
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">
                PORTFOLIO
              </h2>
            </div>
            <p className="text-brand-gray-500 font-mono text-xs uppercase tracking-wide md:tracking-widest max-w-xs text-left md:text-right">
              A selection of just some of the websites we have built for our
              clients.
            </p>
          </div>
          <Portfolio />
        </motion.section>

        <Testimonials />

        <motion.section
          ref={ctaRef}
          initial={{opacity: 0, scale: 0.98}}
          whileInView={{opacity: 1, scale: 1}}
          viewport={{once: true}}
          transition={FADE_TRANSITION}
          className="bg-brand-black text-brand-white p-12 md:p-32 relative overflow-hidden"
        >
          <motion.div
            style={{y: ctaBgY}}
            className="absolute -right-20 -bottom-20 text-[28vw] font-black text-white/[0.04] select-none font-display"
          >
            ELITE
          </motion.div>
          <motion.div
            style={{y: ctaEliteY}}
            className="pointer-events-none absolute right-[5%] top-[20%] text-[22vw] md:text-[16vw] font-display font-black uppercase leading-none tracking-tighter text-white/[0.16]"
          >
            ELITE
          </motion.div>
          <motion.div
            style={{rotate: ctaRingRotate}}
            className="pointer-events-none absolute -left-16 top-[14%] h-56 w-56 border border-white/15 rounded-full"
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
              Start your project{' '}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-4 transition-transform duration-500"
              />
            </Link>
          </div>
        </motion.section>

        <motion.section
          initial={{opacity: 0, y: 32}}
          whileInView={{opacity: 1, y: 0}}
          viewport={FADE_VIEWPORT}
          transition={FADE_TRANSITION}
          className="text-center relative"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">
            Capabilities
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-16 uppercase tracking-tighter">
            Our Services
          </h2>
          <Services />
        </motion.section>
      </div>
    </>
  );
}
