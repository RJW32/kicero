import { motion, useScroll, useTransform } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { useRef } from 'react';

const projects = [
  {
    title: 'One Step',
    category: 'Minimal Web App',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
    description: 'A clean, high-performance web experience focused on simplicity.',
    link: 'https://one-step.kicero.workers.dev'
  },
  {
    title: 'Alexander Synthwave',
    category: 'Interactive Experience',
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200',
    description: 'Retro-futuristic aesthetic meets classical historical narrative.',
    link: 'https://alexander-the-great-synthwave.kicero.workers.dev'
  },
  {
    title: 'Neon Noodles',
    category: 'E-commerce / Restaurant',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=1200',
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
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.a
      ref={cardRef}
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ y }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: idx * 0.1 }}
      className="group block cursor-pointer"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-brand-gray-50 grayscale hover:grayscale-0 transition-all duration-700 block">
        <motion.img 
          src={project.image} 
          alt={project.title}
          style={{ scale: 1.2, y: imgY }}
          className="w-full h-full object-cover transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <ExternalLink className="text-white" size={32} />
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Visit Project</span>
          </div>
        </div>
      </div>
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
          <button className="px-10 py-4 border border-brand-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all text-brand-gray-700 hover:text-white font-mono">
            Full Case Studies
          </button>
        </div>
      </div>
    </section>
  );
}
