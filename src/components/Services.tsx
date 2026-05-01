import { motion } from 'motion/react';
import { Code, Layout, Smartphone, Search, Zap, Shield } from 'lucide-react';

const services = [
  {
    icon: <Code size={32} />,
    title: 'Custom Development',
    description: 'Bespoke web applications built with React, Next.js, and modern stack architectures for maximum scalability.'
  },
  {
    icon: <Layout size={32} />,
    title: 'UI/UX Design',
    description: 'Minimalist, conversion-focused design systems that prioritize user experience and brand identity.'
  },
  {
    icon: <Smartphone size={32} />,
    title: 'Responsive Design',
    description: 'Perfected experience across all screen sizes, from ultra-wide monitors to the smallest smartphones.'
  },
  {
    icon: <Search size={32} />,
    title: 'SEO Strategy',
    description: 'Search engine optimization baked into the code, ensuring your business is found by the right people.'
  },
  {
    icon: <Zap size={32} />,
    title: 'Performance Optimization',
    description: 'Lightning-fast load times and smooth interactions that keep users engaged and improve search rankings.'
  },
  {
    icon: <Shield size={32} />,
    title: 'Security & Hosting',
    description: 'Robust security protocols and reliable managed hosting to keep your digital assets safe and online.'
  }
];

export default function Services() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 py-12">
      {services.map((service, idx) => (
        <motion.div
          key={service.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="flex flex-col"
        >
          <div className="mb-6 text-brand-gray-400">{service.icon}</div>
          <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">{service.title}</h3>
          <p className="text-brand-gray-600 leading-relaxed font-light">
            {service.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
