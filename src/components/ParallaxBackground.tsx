import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import kiceroLogoLightGray from '../assets/Logo/Kicero Logo Light Gray.svg';
import {usePrefersReducedMotion} from '../hooks/useMediaQuery';
import {isPrerender} from '../hooks/useIsPrerender';

/** Positive modulo (handles negative dividends). */
function posMod(n: number, m: number): number {
  return n - m * Math.floor(n / m);
}

/**
 * Map unbounded scroll motion to a looping translate (px).
 * `travel` is total motion per `referenceScroll` px of scroll.
 */
function loopTranslate(linear: number, period: number): number {
  if (linear >= 0) {
    return posMod(linear, period);
  }
  return -posMod(-linear, period);
}

function useLoopedY(
  smoothScrollY: MotionValue<number>,
  travel: number,
  period: number,
  referenceScroll: number,
  /** Shifts motion along the loop so content can start off-screen (px in “linear” space). */
  linearOffset = 0,
): MotionValue<number> {
  return useTransform(smoothScrollY, (s) => {
    const linear = (s / referenceScroll) * travel + linearOffset;
    return loopTranslate(linear, period);
  });
}

function usePartnerY(
  baseY: MotionValue<number>,
  period: number,
): MotionValue<number> {
  return useTransform(baseY, (v) => v + period);
}

/**
 * Shared scalar loop; duplicate offset by `period` gives a seamless tile along
 * direction (dirX, dirY).
 */
function useLoopedDiagonal(
  smoothScrollY: MotionValue<number>,
  travel: number,
  period: number,
  referenceScroll: number,
  dirX: number,
  dirY: number,
  linearOffset = 0,
) {
  const w = useLoopedY(
    smoothScrollY,
    travel,
    period,
    referenceScroll,
    linearOffset,
  );
  const x = useTransform(w, (v) => v * dirX);
  const y = useTransform(w, (v) => v * dirY);
  const wB = usePartnerY(w, period);
  const xB = useTransform(wB, (v) => v * dirX);
  const yB = useTransform(wB, (v) => v * dirY);
  return {x, y, xB, yB};
}

/**
 * Decorative scroll-driven background.
 *
 * Parallax layers use different scroll “paces” (referenceScroll) so loops
 * desync. Skipped during prerender and when the user prefers reduced motion.
 */
export default function ParallaxBackground() {
  const reducedMotion = usePrefersReducedMotion();
  const enabled = !reducedMotion && !isPrerender();

  const {scrollY} = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 48,
    damping: 26,
    mass: 0.55,
  });

  // Loop periods — varied so layers don’t realign on the same beat.
  const pK = 920;
  const pSquare = 880;
  const pCircle = 760;
  const pEst = 900;
  const pDigital = 940;
  const pKicero = 860;
  const pLogoR = 900;
  const pGlowL = 900;
  const pGlowR = 860;
  const pTopBrand = 560;
  const pSmallK = 520;

  // referenceScroll: higher = slower relative motion (staggered paces).
  const refK = 2830;
  const refSquare = 4860;
  const refCircle = 2490;
  const refEst = 4180;
  const refDigital = 3160;
  const refKicero = 5540;
  const refLogoR = 3890;
  const refGlowL = 4420;
  const refGlowR = 3510;
  const refTopBrand = 6090;
  const refSmallK = 3260;
  const refLogoLDiag = 3700;

  const yLetterK = useLoopedY(
    smoothScrollY,
    -620,
    pK,
    refK,
    -pK * 0.38,
  );
  const ySquare = useLoopedY(
    smoothScrollY,
    -1000,
    pSquare,
    refSquare,
    -pSquare * 0.26,
  );
  // Negative travel so y + period partner loops stay seamless (positive travel pops).
  const yCircle = useLoopedY(
    smoothScrollY,
    -360,
    pCircle,
    refCircle,
    -pCircle * 0.42,
  );
  const yEst = useLoopedY(
    smoothScrollY,
    -520,
    pEst,
    refEst,
    -pEst * 0.24,
  );
  const yDigital = useLoopedY(
    smoothScrollY,
    -800,
    pDigital,
    refDigital,
    -pDigital * 0.33,
  );
  // Phase: begins translated up so the first visible motion drifts down from above.
  const yKicero = useLoopedY(
    smoothScrollY,
    -520,
    pKicero,
    refKicero,
    -pKicero * 0.72,
  );
  const yLogoA = useLoopedY(
    smoothScrollY,
    -760,
    pLogoR,
    refLogoR,
    -pLogoR * 0.58,
  );
  const yGlowL = useLoopedY(
    smoothScrollY,
    -760,
    pGlowL,
    refGlowL,
    -pGlowL * 0.31,
  );
  const yGlowR = useLoopedY(
    smoothScrollY,
    -520,
    pGlowR,
    refGlowR,
    -pGlowR * 0.36,
  );

  // Top-right brand mark — slow vertical drift.
  const yTopBrand = useLoopedY(
    smoothScrollY,
    -340,
    pTopBrand,
    refTopBrand,
    -pTopBrand * 0.62,
  );

  // Negative travel + phase: seamless loop; start off bottom-right, drift in.
  const smallKDiag = useLoopedDiagonal(
    smoothScrollY,
    -560,
    pSmallK,
    refSmallK,
    -0.82,
    -0.58,
    -pSmallK * 0.74,
  );
  // Left logo: negative travel; start off bottom-left, drift in diagonally.
  const logoLDiag = useLoopedDiagonal(
    smoothScrollY,
    -620,
    pLogoR,
    refLogoLDiag,
    0.78,
    -0.62,
    -pLogoR * 0.84,
  );

  const yLetterKB = usePartnerY(yLetterK, pK);
  const ySquareB = usePartnerY(ySquare, pSquare);
  const yCircleB = usePartnerY(yCircle, pCircle);
  const yEstB = usePartnerY(yEst, pEst);
  const yDigitalB = usePartnerY(yDigital, pDigital);
  const yKiceroB = usePartnerY(yKicero, pKicero);
  const yLogoAB = usePartnerY(yLogoA, pLogoR);
  const yGlowLB = usePartnerY(yGlowL, pGlowL);
  const yGlowRB = usePartnerY(yGlowR, pGlowR);
  const yTopBrandB = usePartnerY(yTopBrand, pTopBrand);

  const rotLogoA = useTransform(smoothScrollY, (s) => s * 0.036);
  const rotLogoB = useTransform(smoothScrollY, (s) => -s * 0.03);

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
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <LoopedTopBrand yA={yTopBrand} yB={yTopBrandB} />

      <LoopedLetterK yA={yLetterK} yB={yLetterKB} />
      <LoopedSquare yA={ySquare} yB={ySquareB} />
      <LoopedCircle yA={yCircle} yB={yCircleB} />
      <LoopedEst yA={yEst} yB={yEstB} />
      <LoopedDigital yA={yDigital} yB={yDigitalB} />
      <LoopedKiceroWord yA={yKicero} yB={yKiceroB} />

      <LoopedSmallK
        xA={smallKDiag.x}
        yA={smallKDiag.y}
        xB={smallKDiag.xB}
        yB={smallKDiag.yB}
      />

      <LoopedGlow
        yA={yGlowL}
        yB={yGlowLB}
        className="top-[28%] left-[64%] w-44 h-44 rounded-full bg-brand-gray-100/80 blur-3xl"
      />
      <LoopedGlow
        yA={yGlowR}
        yB={yGlowRB}
        className="top-[82%] right-[8%] w-56 h-56 rounded-full bg-brand-gray-100/70 blur-3xl"
      />

      <LoopedLogo
        yA={yLogoA}
        yB={yLogoAB}
        rotate={rotLogoA}
        className="top-[34%] right-[10%] w-44 md:w-60 opacity-45"
      />
      <LoopedLogo
        xA={logoLDiag.x}
        yA={logoLDiag.y}
        xB={logoLDiag.xB}
        yB={logoLDiag.yB}
        rotate={rotLogoB}
        className="top-[66%] left-[6%] w-36 md:w-52 opacity-35"
      />

      <div className="absolute inset-0 flex justify-between px-[10%] opacity-[0.03]">
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} className="w-[1px] h-full bg-black" />
        ))}
      </div>
    </div>
  );
}

type LoopedYPair = {yA: MotionValue<number>; yB: MotionValue<number>};

function LoopedTopBrand({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[6%] right-[4%] md:right-[5%] text-3xl sm:text-4xl md:text-5xl font-display font-bold italic text-brand-gray-200/50 select-none leading-none tracking-tight will-change-transform origin-center text-right';
  return (
    <>
      <motion.div style={{y: yA}} className={cls}>
        Kicero
      </motion.div>
      <motion.div style={{y: yB}} className={cls}>
        Kicero
      </motion.div>
    </>
  );
}

function LoopedLetterK({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[10%] -left-10 text-[50vw] font-display font-black text-brand-gray-200/45 select-none leading-none tracking-tighter will-change-transform';
  return (
    <>
      <motion.div style={{y: yA}} className={cls}>
        K
      </motion.div>
      <motion.div style={{y: yB}} className={cls}>
        K
      </motion.div>
    </>
  );
}

function LoopedSquare({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[40%] right-[5%] w-96 h-96 border-[0.5px] border-brand-gray-400/40 rotate-12 will-change-transform origin-center';
  return (
    <>
      <motion.div style={{y: yA}} className={cls} />
      <motion.div style={{y: yB}} className={cls} />
    </>
  );
}

function LoopedCircle({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[70%] left-[15%] w-48 h-48 border-[0.5px] border-brand-black/16 rounded-full will-change-transform';
  return (
    <>
      <motion.div style={{y: yA}} className={cls} />
      <motion.div style={{y: yB}} className={cls} />
    </>
  );
}

function LoopedEst({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[25%] right-[10%] text-[10vw] font-display font-bold text-brand-gray-200/38 select-none will-change-transform';
  return (
    <>
      <motion.div
        style={{y: yA, writingMode: 'vertical-rl' as const}}
        className={cls}
      >
        EST. 2026
      </motion.div>
      <motion.div
        style={{y: yB, writingMode: 'vertical-rl' as const}}
        className={cls}
      >
        EST. 2026
      </motion.div>
    </>
  );
}

function LoopedDigital({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[85%] right-[20%] text-[12vw] font-display font-black text-brand-gray-200/30 select-none will-change-transform';
  return (
    <>
      <motion.div style={{y: yA}} className={cls}>
        DIGITAL
      </motion.div>
      <motion.div style={{y: yB}} className={cls}>
        DIGITAL
      </motion.div>
    </>
  );
}

function LoopedKiceroWord({yA, yB}: LoopedYPair) {
  const cls =
    'absolute top-[72%] left-[6%] text-[8vw] font-display font-bold italic text-brand-gray-200/42 select-none leading-none will-change-transform origin-center';
  return (
    <>
      <motion.div style={{y: yA, rotate: 270}} className={cls}>
        KICERO
      </motion.div>
      <motion.div style={{y: yB, rotate: 270}} className={cls}>
        KICERO
      </motion.div>
    </>
  );
}

function LoopedSmallK({
  xA,
  yA,
  xB,
  yB,
}: {
  xA: MotionValue<number>;
  yA: MotionValue<number>;
  xB: MotionValue<number>;
  yB: MotionValue<number>;
}) {
  const cls =
    'absolute bottom-[6%] right-[2%] md:bottom-[8%] md:right-[4%] text-[2.75rem] sm:text-5xl md:text-6xl font-display font-black text-brand-gray-200/40 select-none leading-none will-change-transform origin-center';
  return (
    <>
      <motion.div style={{x: xA, y: yA}} className={cls}>
        K
      </motion.div>
      <motion.div style={{x: xB, y: yB}} className={cls}>
        K
      </motion.div>
    </>
  );
}

function LoopedGlow({
  yA,
  yB,
  className,
}: LoopedYPair & {className: string}) {
  const cls = `absolute pointer-events-none ${className} will-change-transform`;
  return (
    <>
      <motion.div style={{y: yA}} className={cls} />
      <motion.div style={{y: yB}} className={cls} />
    </>
  );
}

function LoopedLogo({
  yA,
  yB,
  xA,
  xB,
  rotate,
  className,
}: {
  yA: MotionValue<number>;
  yB: MotionValue<number>;
  xA?: MotionValue<number>;
  xB?: MotionValue<number>;
  rotate: MotionValue<number>;
  className: string;
}) {
  const cls = `absolute ${className} will-change-transform origin-center`;
  const styleA =
    xA !== undefined && xB !== undefined
      ? {x: xA, y: yA, rotate}
      : {y: yA, rotate};
  const styleB =
    xA !== undefined && xB !== undefined
      ? {x: xB, y: yB, rotate}
      : {y: yB, rotate};
  return (
    <>
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        loading="lazy"
        decoding="async"
        style={styleA}
        className={cls}
      />
      <motion.img
        src={kiceroLogoLightGray}
        alt=""
        loading="lazy"
        decoding="async"
        style={styleB}
        className={cls}
      />
    </>
  );
}
