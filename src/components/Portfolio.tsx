import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import oneStepImage from '../assets/One Step.png';
import alexanderSynthwaveImage from '../assets/Alexander the Great Synthwave.png';
import neonNoodlesImage from '../assets/Neon Noodles.png';

const projects = [
  {
    title: 'One Step',
    category: 'Minimal Web App',
    image: oneStepImage,
    description: 'A clean, high performance web experience specially designed for a group of young aspiring parkourists.',
    link: 'https://one-step.kicero.workers.dev'
  },
  {
    title: 'Alexander Synthwave',
    category: 'Interactive Experience',
    image: alexanderSynthwaveImage,
    description: 'Retro-futuristic aesthetic meets classical historical narrative.',
    link: 'https://alexander-the-great-synthwave.kicero.workers.dev'
  },
  {
    title: 'Neon Noodles',
    category: 'E-commerce / Restaurant',
    image: neonNoodlesImage,
    description: 'Vibrant, neon-lit digital space for a modern street food brand.',
    link: 'https://neon-noodles.kicero.workers.dev'
  }
];

interface PortfolioCardProps {
  project: typeof projects[0];
  idx: number;
  key?: string;
}

function PortfolioCard({ project, idx }: PortfolioCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 75, damping: 24, mass: 0.5 });
  const frameY = useTransform(smooth, [0, 1], [14, -14]);
  const imageY = useTransform(smooth, [0, 1], [10, -10]);

  return (
    <motion.a
      ref={cardRef}
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group block cursor-pointer"
    >
      <motion.div
        style={{ y: frameY }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden aspect-[4/3] bg-brand-gray-50 transition-all duration-700 block"
      >
        <motion.div
          animate={{ x: ['-130%', '130%'] }}
          transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-xl"
        />
        <motion.img 
          src={project.image} 
          alt={project.title}
          style={{ y: imageY }}
          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <ExternalLink className="text-white" size={32} />
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Visit Project</span>
          </div>
        </div>
      </motion.div>
      <div className="mt-8 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500 mb-2 block">{project.category}</span>
          <h3 className="text-2xl font-bold uppercase tracking-tight">{project.title}</h3>
          <p className="text-sm font-light mt-1 text-brand-gray-700">{project.description}</p>
        </div>
      </div>
    </motion.a>
  );
}

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {projects.map((project, idx) => (
            <PortfolioCard key={project.title} project={project} idx={idx} />
          ))}
        </div>
        
        <div className="mt-20 text-center">
          <Link
            to="/case-studies"
            className="inline-block px-10 py-4 border border-brand-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all text-brand-gray-700 font-mono"
          >
            Full Case Studies
          </Link>
        </div>
      </div>
    </section>
  );
}
