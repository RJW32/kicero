import Services from '../components/Services';

export default function ServicesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter mb-4">SERVICES</h1>
        <p className="text-brand-gray-600 max-w-2xl text-lg font-light">
          We specialize in high-performance digital products that help brands scale and stand out in a crowded marketplace.
        </p>
      </div>
      <Services />
    </div>
  );
}
