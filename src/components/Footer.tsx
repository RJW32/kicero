import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [16, -16]);

  return (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-12 border-t border-brand-gray-200"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div style={{ y }} className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-2xl font-display font-bold tracking-tighter">KICERO</p>
            <p className="text-xs text-brand-gray-800 mt-2">© 2026 Kicero. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
