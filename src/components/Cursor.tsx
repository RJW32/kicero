import {useEffect, useState} from 'react';
import {motion, useMotionValue, useSpring} from 'motion/react';
import {
  useIsFinePointer,
  usePrefersReducedMotion,
} from '../hooks/useMediaQuery';
import {isPrerender} from '../hooks/useIsPrerender';

const SPRING = {damping: 28, stiffness: 380, mass: 0.4};

/**
 * Custom dot/ring cursor for fine-pointer devices.
 *
 * Notes on previous bug fixed here:
 *   - The old implementation called `useSpring(useMotionValue(0), …)` inside
 *     the JSX `style` prop, which allocated brand new motion values + springs
 *     on every single render. That is a hard memory/perf leak on a component
 *     that re-renders on every hover. Motion values are now created once.
 *   - `mouseover` (which bubbles every time the pointer crosses any element)
 *     replaced with `pointerover` and a tighter check, plus we early-return
 *     for unchanged hover state.
 */
export default function Cursor() {
  const isFinePointer = useIsFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = isFinePointer && !reducedMotion && !isPrerender();

  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const ringX = useSpring(cursorX, SPRING);
  const ringY = useSpring(cursorY, SPRING);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const flush = () => {
      cursorX.set(nextX);
      cursorY.set(nextY);
      frame = 0;
    };

    const onMove = (e: PointerEvent) => {
      nextX = e.clientX;
      nextY = e.clientY;
      if (frame === 0) {
        frame = requestAnimationFrame(flush);
      }
    };

    const onOver = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const interactive =
        target.closest('a, button, [role="button"], input, textarea, select, label') !==
        null;
      setIsHovering((prev) => (prev === interactive ? prev : interactive));
    };

    window.addEventListener('pointermove', onMove, {passive: true});
    document.addEventListener('pointerover', onOver, {passive: true});

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [enabled, cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-black pointer-events-none z-[9999] hidden md:block"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0)',
        }}
        transition={{type: 'spring', stiffness: 320, damping: 24}}
      />
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-black rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </>
  );
}
