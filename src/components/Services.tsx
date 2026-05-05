import { motion } from 'motion/react';
import { Code, Layout, Smartphone, Shield } from 'lucide-react';

const services = [
  {
    icon: <Code size={32} />,
    title: 'Custom Development',
    description: 'Kicero is not limited to one style or template. We build fully custom websites around your exact goals, brand, and vision.'
  },
  {
    icon: <Layout size={32} />,
    title: 'UI/UX Design',
    description: 'Our design spectrum is broad, so we can craft everything from clean and minimal to bold and expressive experiences that fit your brand.'
  },
  {
    icon: <Smartphone size={32} />,
    title: 'Responsive Design',
    description: 'Perfected experience across all screen sizes, from ultra-wide monitors to the smallest smartphones.'
  },
  {
    icon: <Shield size={32} />,
    title: 'Security & Hosting',
    description: 'Powered by Cloudflare, your site gets enterprise-grade security, high-end infrastructure, and reliable global performance.'
  }
];

export default function Services() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 py-12">
      {services.map((service, idx) => (
        <ServiceCard key={service.title} service={service} idx={idx} />
      ))}
    </div>
  );
}

interface ServiceCardProps {
  service: typeof services[0];
  idx: number;
}

function ServiceCard({ service, idx }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col relative border border-transparent hover:border-brand-gray-200/80 hover:bg-brand-white/70 p-6 -m-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-gray-100/80 to-transparent"
      />
      <div className="mb-6 text-brand-gray-400">
        {service.icon}
      </div>
      <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">{service.title}</h3>
      <p className="text-brand-gray-600 leading-relaxed font-light">
        {service.description}
      </p>
    </motion.div>
  );
}
