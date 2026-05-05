import oneStepImage from '../assets/One Step.png';
import alexanderSynthwaveImage from '../assets/Alexander the Great Synthwave.png';
import neonNoodlesImage from '../assets/Neon Noodles.png';

export interface PortfolioProject {
  title: string;
  category: string;
  image: string;
  alt: string;
  description: string;
  link: string;
}

export const portfolioProjects: ReadonlyArray<PortfolioProject> = [
  {
    title: 'One Step',
    category: 'Minimal Web App',
    image: oneStepImage,
    alt: 'One Step parkour community website built by Kicero — a minimal, high-performance web app',
    description:
      'A clean, high performance web experience specially designed for a group of young aspiring parkourists.',
    link: 'https://one-step.kicero.workers.dev',
  },
  {
    title: 'Alexander Synthwave',
    category: 'Interactive Experience',
    image: alexanderSynthwaveImage,
    alt: 'Alexander the Great Synthwave website — interactive historical experience built by Kicero',
    description:
      'Retro-futuristic aesthetic meets classical historical narrative.',
    link: 'https://alexander-the-great-synthwave.kicero.workers.dev',
  },
  {
    title: 'Neon Noodles',
    category: 'E-commerce / Restaurant',
    image: neonNoodlesImage,
    alt: 'Neon Noodles street food brand website by Kicero — vibrant, neon-lit restaurant site',
    description:
      'Vibrant, neon-lit digital space for a modern street food brand.',
    link: 'https://neon-noodles.kicero.workers.dev',
  },
];
