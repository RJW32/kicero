import {useRef, type ReactNode} from 'react';
import {motion, useMotionValue, useSpring} from 'motion/react';
import {
  useIsFinePointer,
  usePrefersReducedMotion,
} from '../hooks/useMediaQuery';

const MAGNET_STRENGTH = 0.35;
const SPRING = {type: 'spring', stiffness: 150, damping: 15, mass: 0.1} as const;

/**
 * Hover-magnetic wrapper. Fine-pointer only — on touch devices and when
 * users prefer reduced motion this becomes a transparent passthrough so we
 * don't subscribe to pointer events or animate.
 */
export default function Magnetic({children}: {children: ReactNode}) {
  const isFinePointer = useIsFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = isFinePointer && !reducedMotion;

  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  if (!enabled) {
    return <div ref={ref}>{children}</div>;
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * MAGNET_STRENGTH);
    y.set(offsetY * MAGNET_STRENGTH);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{x: springX, y: springY}}
    >
      {children}
    </motion.div>
  );
}
