import { motion } from 'motion/react';
import Portfolio from '../components/Portfolio';

export default function PortfolioPage() {
  return (
    <div className="pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-6 mb-12"
      >
        <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tighter mb-4 text-brand-gray-400">PORTFOLIO</h1>
        <p className="text-brand-gray-600 max-w-2xl text-lg font-light">
          Explore our collection of meticulously crafted digital experiences.
        </p>
      </motion.div>
      <Portfolio />
    </div>
  );
}
