import Portfolio from '../components/Portfolio';

export default function PortfolioPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter mb-4 text-brand-gray-100">WORK</h1>
        <p className="text-brand-gray-600 max-w-2xl text-lg font-light">
          Explore our collection of meticulously crafted digital experiences.
        </p>
      </div>
      <Portfolio />
    </div>
  );
}
