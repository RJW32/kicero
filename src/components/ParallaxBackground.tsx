import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import kiceroLogoLightGray from '../assets/Logo/Kicero Logo Light Gray.svg';

export default function ParallaxBackground() {
  const [isDesktop, setIsDesktop] = useState(false);
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 65, damping: 20, mass: 0.5 });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 62, damping: 20, mass: 0.5 });
  const factor = isDesktop ? 1.25 : 0.75;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  // Different speeds and directions for layers
  const y1 = useTransform(smoothScrollY, [0, 2400], [0, -620 * factor], { clamp: false });
  const y2 = useTransform(smoothScrollY, [0, 2400], [0, -1200 * factor], { clamp: false });
  const y3 = useTransform(smoothScrollY, [0, 2400], [0, -520 * factor], { clamp: false });
  const y4 = useTransform(smoothScrollY, [0, 2400], [0, 360 * factor], { clamp: false });
  const y5 = useTransform(smoothScrollY, [0, 2400], [0, -760 * factor], { clamp: false });
  const y6 = useTransform(smoothScrollY, [0, 2400], [0, 520 * factor], { clamp: false });
  const rotate1 = useTransform(smoothProgress, [0, 1], [0, 200 * factor]);
  const rotate2 = useTransform(smoothProgress, [0, 1], [0, -110 * factor]);
  const rotate3 = useTransform(smoothProgress, [0, 1], [0, 260 * factor]);
  const xDrift = useTransform(smoothScrollY, [0, 2400], [0, 160 * factor], { clamp: false });
  const xDriftReverse = useTransform(smoothScrollY, [0, 2400], [0, -180 * factor], { clamp: false });
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [0.04, 0.12, 0.04]);
  // Tighter loop spacing so elements re-enter quickly and stay present on-screen.
  const loopDistance = isDesktop ? 1050 : 760;
  const wrapY = (value: number) => {
    const wrapped = ((value % loopDistance) + loopDistance) % loopDistance;
    return wrapped - loopDistance;
  };
  const y1Wrapped = useTransform(y1, wrapY);
  const y2Wrapped = useTransform(y2, wrapY);
  const y3Wrapped = useTransform(y3, wrapY);
  const y4Wrapped = useTransform(y4, wrapY);
  const y5Wrapped = useTransform(y5, wrapY);
  const y6Wrapped = useTransform(y6, wrapY);
  const y1Loop = useTransform(y1Wrapped, (v) => v + loopDistance);
  const y2Loop = useTransform(y2Wrapped, (v) => v + loopDistance);
  const y3Loop = useTransform(y3Wrapped, (v) => v + loopDistance);
  const y4Loop = useTransform(y4Wrapped, (v) => v + loopDistance);
  const y5Loop = useTransform(y5Wrapped, (v) => v + loopDistance);
  const y6Loop = useTransform(y6Wrapped, (v) => v + loopDistance);

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-brand-white">
      {/* Dynamic Grid Pattern */}
      <motion.div 
        style={{ 
          opacity,
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
        className="absolute inset-0" 
      />

      {/* Layer 1: Large decorative letter K */}
      <motion.div 
        style={{ y: y1Wrapped }}
        className="absolute top-[10%] -left-10 text-[50vw] font-display font-black text-brand-gray-200/45 select-none leading-none tracking-tighter will-change-transform"
      >
        K
      </motion.div>
      <motion.div
        style={{ y: y1Loop }}
        className="absolute top-[10%] -left-10 text-[50vw] font-display font-black text-brand-gray-200/45 select-none leading-none tracking-tighter will-change-transform"
      >
        K
      </motion.div>

      {/* Layer 2: Geometric Shapes */}
      <motion.div 
        style={{ y: y2Wrapped, rotate: rotate1, x: xDrift }}
        className="absolute top-[40%] right-[5%] w-96 h-96 border-[0.5px] border-brand-gray-400/40 rotate-12"
      />
      <motion.div
        style={{ y: y2Loop, rotate: rotate1, x: xDrift }}
        className="absolute top-[40%] right-[5%] w-96 h-96 border-[0.5px] border-brand-gray-400/40 rotate-12"
      />
      
      <motion.div 
        style={{ y: y4Wrapped, rotate: rotate2 }}
        className="absolute top-[70%] left-[15%] w-48 h-48 border-[0.5px] border-brand-black/16 rounded-full"
      />
      <motion.div
        style={{ y: y4Loop, rotate: rotate2 }}
        className="absolute top-[70%] left-[15%] w-48 h-48 border-[0.5px] border-brand-black/16 rounded-full"
      />

      {/* Layer 3: Abstract Text Blocks */}
      <motion.div 
        style={{ y: y3Wrapped, writingMode: 'vertical-rl' } as any}
        className="absolute top-[25%] right-[10%] text-[10vw] font-display font-bold text-brand-gray-200/38 select-none vertical-text will-change-transform"
      >
        EST. 2026
      </motion.div>
      <motion.div
        style={{ y: y3Loop, writingMode: 'vertical-rl' } as any}
        className="absolute top-[25%] right-[10%] text-[10vw] font-display font-bold text-brand-gray-200/38 select-none vertical-text will-change-transform"
      >
        EST. 2026
      </motion.div>

      <motion.div 
        style={{ y: y2Wrapped }}
        className="absolute top-[85%] right-[20%] text-[12vw] font-display font-black text-brand-gray-200/30 select-none will-change-transform"
      >
        DIGITAL
      </motion.div>
      <motion.div
        style={{ y: y2Loop }}
        className="absolute top-[85%] right-[20%] text-[12vw] font-display font-black text-brand-gray-200/30 select-none will-change-transform"
      >
        DIGITAL
      </motion.div>

      <motion.div
        style={{ y: y4Wrapped, x: xDrift }}
        className="absolute top-[55%] left-[58%] w-64 h-64 border border-brand-gray-300/50 rotate-45"
      />

      {/* Extra moving typography */}
      <motion.div
        style={{ y: y5Wrapped, x: xDriftReverse }}
        className="absolute top-[14%] right-[18%] text-[9vw] font-display font-black text-brand-gray-200/40 select-none will-change-transform"
      >
        STUDIO
      </motion.div>
      <motion.div
        style={{ y: y5Loop, x: xDriftReverse }}
        className="absolute top-[14%] right-[18%] text-[9vw] font-display font-black text-brand-gray-200/40 select-none will-change-transform"
      >
        STUDIO
      </motion.div>
      <motion.div
        style={{ y: y6Wrapped, rotate: rotate2 }}
        className="absolute top-[72%] left-[6%] text-[8vw] font-display font-bold italic text-brand-gray-200/42 select-none will-change-transform"
      >
        KICERO
      </motion.div>
      <motion.div
        style={{ y: y6Loop, rotate: rotate2 }}
        className="absolute top-[72%] left-[6%] text-[8vw] font-display font-bold italic text-brand-gray-200/42 select-none will-change-transform"
      >
        KICERO
      </motion.div>

      {/* Extra moving geometry */}
      <motion.div
        style={{ y: y5Wrapped, rotate: rotate3, x: xDrift }}
        className="absolute top-[18%] left-[32%] w-24 h-24 border border-brand-gray-400/55"
      />
      <motion.div
        style={{ y: y5Loop, rotate: rotate3, x: xDrift }}
        className="absolute top-[18%] left-[32%] w-24 h-24 border border-brand-gray-400/55"
      />
      <motion.div
        style={{ y: y6Wrapped, rotate: rotate1, x: xDriftReverse }}
        className="absolute top-[62%] right-[14%] w-28 h-28 border border-brand-gray-400/50 rounded-full"
      />
      <motion.div
        style={{ y: y6Loop, rotate: rotate1, x: xDriftReverse }}
        className="absolute top-[62%] right-[14%] w-28 h-28 border border-brand-gray-400/50 rounded-full"
      />
      <motion.div
        style={{ y: y3Wrapped, x: xDriftReverse }}
        className="absolute top-[48%] left-[8%] w-40 h-px bg-brand-gray-400/70"
      />

      {/* Extra soft glow spheres */}
      <motion.div
        style={{ y: y5Wrapped, x: xDrift }}
        className="absolute top-[28%] left-[64%] w-44 h-44 rounded-full bg-brand-gray-100/80 blur-3xl"
      />
      <motion.div
        style={{ y: y5Loop, x: xDrift }}
        className="absolute top-[28%] left-[64%] w-44 h-44 rounded-full bg-brand-gray-100/80 blur-3xl"
      />
      <motion.div
        style={{ y: y6Wrapped, x: xDriftReverse }}
        className="absolute top-[82%] right-[8%] w-56 h-56 rounded-full bg-brand-gray-100/70 blur-3xl"
      />
      <motion.div
        style={{ y: y6Loop, x: xDriftReverse }}
        className="absolute top-[82%] right-[8%] w-56 h-56 rounded-full bg-brand-gray-100/70 blur-3xl"
      />

      {/* Light gray brand logo accents */}
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        aria-hidden="true"
        style={{ y: y5Wrapped, x: xDriftReverse, rotate: rotate2 }}
        className="absolute top-[34%] right-[10%] w-44 md:w-60 opacity-45 will-change-transform"
      />
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        aria-hidden="true"
        style={{ y: y5Loop, x: xDriftReverse, rotate: rotate2 }}
        className="absolute top-[34%] right-[10%] w-44 md:w-60 opacity-45 will-change-transform"
      />
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        aria-hidden="true"
        style={{ y: y3Wrapped, x: xDrift }}
        className="absolute top-[66%] left-[6%] w-36 md:w-52 opacity-35 will-change-transform"
      />
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        aria-hidden="true"
        style={{ y: y3Loop, x: xDrift }}
        className="absolute top-[66%] left-[6%] w-36 md:w-52 opacity-35 will-change-transform"
      />

      {/* Vertical Accent Lines */}
      <div className="absolute inset-0 flex justify-between px-[10%] opacity-[0.03]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-[1px] h-full bg-black" />
        ))}
      </div>
    </div>
  );
}
