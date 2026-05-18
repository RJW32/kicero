import {motion} from 'motion/react';
import {ExternalLink} from 'lucide-react';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {Link} from 'react-router-dom';
import {portfolioProjects, type PortfolioProject} from '../data/portfolio';

interface PortfolioCardProps {
  project: PortfolioProject;
  idx: number;
}

/** Pixel rect of `object-contain` paint area inside `frameEl` (visible image only). */
function getContainedImageRect(
  frameEl: HTMLElement,
  naturalWidth: number,
  naturalHeight: number,
) {
  const cw = frameEl.clientWidth;
  const ch = frameEl.clientHeight;
  if (!cw || !ch || !naturalWidth || !naturalHeight) {
    return {left: 0, top: 0, width: 0, height: 0};
  }
  const scale = Math.min(cw / naturalWidth, ch / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    left: (cw - width) / 2,
    top: (ch - height) / 2,
    width,
    height,
  };
}

/**
 * Per-card scroll subscriptions and an infinite-loop shimmer were the two
 * biggest costs on this section. We render a static, GPU-friendly card with
 * a hover-only highlight overlay; the entrance animation still uses
 * `whileInView` (one-shot) which is cheap.
 */
function PortfolioCard({project, idx}: PortfolioCardProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [overlayRect, setOverlayRect] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateOverlayGeometry = useCallback(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img?.naturalWidth) return;
    setOverlayRect(
      getContainedImageRect(frame, img.naturalWidth, img.naturalHeight),
    );
  }, []);

  useLayoutEffect(() => {
    updateOverlayGeometry();
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(() => updateOverlayGeometry());
    ro.observe(frame);
    return () => ro.disconnect();
  }, [project.image, updateOverlayGeometry]);

  return (
    <motion.a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{opacity: 0, y: 40}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-60px'}}
      transition={{duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1]}}
      className="group relative z-0 block cursor-pointer hover:z-20 focus-visible:z-20"
    >
      <div className="relative aspect-[4/3] overflow-visible transition-transform duration-500 group-hover:-translate-y-1.5">
        <div
          ref={frameRef}
          className="absolute inset-0 origin-center bg-brand-white transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        >
          <img
            ref={imgRef}
            src={project.image}
            alt={project.alt}
            width={1200}
            height={900}
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={idx === 0 ? 'high' : 'low'}
            onLoad={updateOverlayGeometry}
            className="relative z-0 h-full w-full object-contain"
          />
          <div
            className="absolute z-[1] flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
            style={{
              left: overlayRect.left,
              top: overlayRect.top,
              width: overlayRect.width,
              height: overlayRect.height,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <ExternalLink className="text-white" size={32} />
              <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                Visit Project
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500 mb-2 block">
            {project.category}
          </span>
          <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
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
