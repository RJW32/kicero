import {motion} from 'motion/react';
import {ExternalLink} from 'lucide-react';
import {Link} from 'react-router-dom';
import {portfolioProjects, type PortfolioProject} from '../data/portfolio';

interface PortfolioCardProps {
  project: PortfolioProject;
  idx: number;
}

/**
 * Per-card scroll subscriptions and an infinite-loop shimmer were the two
 * biggest costs on this section. We render a static, GPU-friendly card with
 * a hover-only highlight overlay; the entrance animation still uses
 * `whileInView` (one-shot) which is cheap.
 */
function PortfolioCard({project, idx}: PortfolioCardProps) {
  return (
    <motion.a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{opacity: 0, y: 40}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-60px'}}
      transition={{duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1]}}
      className="group block cursor-pointer"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-brand-gray-50 transition-transform duration-500 group-hover:-translate-y-1.5">
        <img
          src={project.image}
          alt={project.alt}
          width={1200}
          height={900}
          loading={idx === 0 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={idx === 0 ? 'high' : 'low'}
          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <ExternalLink className="text-white" size={32} />
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">
              Visit Project
            </span>
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500 mb-2 block">
            {project.category}
          </span>
          <h3 className="text-2xl font-bold uppercase tracking-tight">
            {project.title}
          </h3>
          <p className="text-sm font-light mt-1 text-brand-gray-700">
            {project.description}
          </p>
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
          {portfolioProjects.map((project, idx) => (
            <PortfolioCard key={project.title} project={project} idx={idx} />
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            to="/contact"
            className="inline-block px-10 py-4 border border-brand-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all text-brand-gray-700 font-mono"
          >
            Start your project
          </Link>
        </div>
      </div>
    </section>
  );
}
