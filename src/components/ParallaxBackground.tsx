import {motion, useScroll, useSpring, useTransform} from 'motion/react';
import kiceroLogoLightGray from '../assets/Logo/Kicero Logo Light Gray.svg';
import {
  useIsDesktop,
  usePrefersReducedMotion,
} from '../hooks/useMediaQuery';
import {isPrerender} from '../hooks/useIsPrerender';

/**
 * Decorative scroll-driven background.
 *
 * Performance considerations:
 *   - Runs on every route, so every transform here costs across the whole site.
 *     We use a single shared spring driven by `scrollY`, and only a small set
 *     of derived motion values.
 *   - Hidden entirely on touch / coarse pointer devices and during prerender.
 *   - Disabled when the user prefers reduced motion.
 *   - The previous implementation rendered each animated element twice (an A
 *     copy + a wrapped "loop" copy) to fake an infinite scroll. That doubled
 *     paint cost for marginal visual benefit; we now render one copy each.
 */
export default function ParallaxBackground() {
  const isDesktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = isDesktop && !reducedMotion && !isPrerender();

  const {scrollY} = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 60,
    damping: 22,
    mass: 0.5,
  });

  const yLetterK = useTransform(smoothScrollY, [0, 2400], [0, -620]);
  const ySquare = useTransform(smoothScrollY, [0, 2400], [0, -1000]);
  const yCircle = useTransform(smoothScrollY, [0, 2400], [0, 360]);
  const yEst = useTransform(smoothScrollY, [0, 2400], [0, -520]);
  const yDigital = useTransform(smoothScrollY, [0, 2400], [0, -800]);
  const yKicero = useTransform(smoothScrollY, [0, 2400], [0, 520]);
  const yLogoA = useTransform(smoothScrollY, [0, 2400], [0, -760]);
  const yLogoB = useTransform(smoothScrollY, [0, 2400], [0, -520]);

  if (!enabled) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-50 bg-brand-white"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-brand-white"
    >
      {/* Static dot grid – no animation needed; a fixed background is GPU-cheap. */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Layer 1: Large decorative letter K */}
      <motion.div
        style={{y: yLetterK}}
        className="absolute top-[10%] -left-10 text-[50vw] font-display font-black text-brand-gray-200/45 select-none leading-none tracking-tighter will-change-transform"
      >
        K
      </motion.div>

      {/* Layer 2: Geometric Shapes */}
      <motion.div
        style={{y: ySquare}}
        className="absolute top-[40%] right-[5%] w-96 h-96 border-[0.5px] border-brand-gray-400/40 rotate-12 will-change-transform"
      />
      <motion.div
        style={{y: yCircle}}
        className="absolute top-[70%] left-[15%] w-48 h-48 border-[0.5px] border-brand-black/16 rounded-full will-change-transform"
      />

      {/* Layer 3: Abstract Text Blocks */}
      <motion.div
        style={{y: yEst, writingMode: 'vertical-rl' as const}}
        className="absolute top-[25%] right-[10%] text-[10vw] font-display font-bold text-brand-gray-200/38 select-none will-change-transform"
      >
        EST. 2026
      </motion.div>

      <motion.div
        style={{y: yDigital}}
        className="absolute top-[85%] right-[20%] text-[12vw] font-display font-black text-brand-gray-200/30 select-none will-change-transform"
      >
        DIGITAL
      </motion.div>

      <motion.div
        style={{y: yKicero}}
        className="absolute top-[72%] left-[6%] text-[8vw] font-display font-bold italic text-brand-gray-200/42 select-none will-change-transform"
      >
        KICERO
      </motion.div>

      {/* Soft glow spheres */}
      <motion.div
        style={{y: yLogoA}}
        className="absolute top-[28%] left-[64%] w-44 h-44 rounded-full bg-brand-gray-100/80 blur-3xl will-change-transform"
      />
      <motion.div
        style={{y: yKicero}}
        className="absolute top-[82%] right-[8%] w-56 h-56 rounded-full bg-brand-gray-100/70 blur-3xl will-change-transform"
      />

      {/* Light gray brand logo accents */}
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        loading="lazy"
        decoding="async"
        style={{y: yLogoA}}
        className="absolute top-[34%] right-[10%] w-44 md:w-60 opacity-45 will-change-transform"
      />
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        loading="lazy"
        decoding="async"
        style={{y: yLogoB}}
        className="absolute top-[66%] left-[6%] w-36 md:w-52 opacity-35 will-change-transform"
      />

      {/* Vertical Accent Lines (static – no animation needed) */}
      <div className="absolute inset-0 flex justify-between px-[10%] opacity-[0.03]">
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} className="w-[1px] h-full bg-black" />
        ))}
      </div>
    </div>
  );
}
