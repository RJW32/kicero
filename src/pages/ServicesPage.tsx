import {motion} from 'motion/react';
import {Mail} from 'lucide-react';
import Pricing from '../components/Pricing';
import Services from '../components/Services';
import FAQ from '../components/FAQ';
import {faqItems} from '../data/faq';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';
import {
  buildBreadcrumb,
  faqSchema,
  offerSchema,
  servicesListSchema,
} from '../seo/structuredData';

export default function ServicesPage() {
  usePageSeo({
    meta: pageMeta.services,
    structuredData: [
      offerSchema,
      servicesListSchema,
      faqSchema(faqItems.map((item) => ({question: item.question, answer: item.answer}))),
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Pricing & Services', path: '/services'},
      ]),
    ],
  });

  return (
    <div className="pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-6 mb-12"
      >
        <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tighter mb-4">PRICING</h1>
        <p className="text-brand-gray-600 max-w-2xl text-lg font-light">
          Transparent, low-cost pricing for high-end custom websites. Built by a Scottish studio for small businesses across the UK — and you only pay once your site is live.
        </p>
      </motion.div>
      <Pricing />
      <div className="max-w-7xl mx-auto px-6 mt-16">
        <h2 className="font-display text-3xl md:text-6xl font-bold tracking-tighter mb-8">SERVICES</h2>
        <Services />
      </div>

      <FAQ />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 mt-20 pt-12 border-t border-brand-gray-200"
      >
        <div className="flex items-start gap-4 border border-brand-gray-200 bg-brand-gray-50/70 p-6 md:p-8 max-w-3xl">
          <Mail className="shrink-0 mt-1 text-brand-gray-400" size={32} strokeWidth={1.5} />
          <div>
            <h3 className="text-xl font-bold mb-4 uppercase tracking-tight text-brand-black">
              Coming Soon: Custom Email Addresses
            </h3>
            <p className="text-brand-gray-600 leading-relaxed font-light">
              Full email management will be available through Kicero.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
