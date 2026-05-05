import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import kiceroLogoBlack from '../assets/Logo/Kicero Logo Black.svg';

interface IntroProps {
  onComplete: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000); // Extended slightly for the staggered animation

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          id="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
        >
          <div className="text-center flex flex-col items-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-display text-lg md:text-xl font-light tracking-[0.3em] uppercase mb-2"
            >
              Welcome to
            </motion.p>
            <div className="flex items-end gap-3 md:gap-4">
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                className="font-display text-5xl md:text-8xl font-bold tracking-tighter uppercase"
              >
                KICERO
              </motion.h1>
              <motion.img
                src={kiceroLogoBlack}
                alt="Kicero logo"
                initial={{ opacity: 0, x: 64 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
                className="h-10 md:h-16 w-auto object-contain -translate-y-2.5 md:-translate-y-3.5"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
