import { motion } from 'motion/react';
import { Check, Globe, Shield } from 'lucide-react';

export default function Pricing() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-6 mb-24"
      aria-labelledby="pricing-heading"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
        Transparent billing
      </span>
      <h2
        id="pricing-heading"
        className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-6"
      >
        Pricing
      </h2>
      <p className="text-brand-gray-600 max-w-2xl text-lg font-light leading-relaxed mb-12">
        You pay nothing until your website is live and you are happy with it. After launch, simple ongoing pricing covers hosting, upkeep, and a fair allowance for small updates.
      </p>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Hero numbers */}
        <div className="lg:col-span-5 border border-brand-gray-200 bg-brand-gray-50/80 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-gray-500 mb-6">
              Launch &amp; hosting
            </p>
            <div className="space-y-8">
              <div>
                <p className="text-brand-gray-600 text-sm font-light mb-1">First payment (production)</p>
                <p className="font-display text-5xl md:text-6xl font-bold tracking-tighter">£40</p>
                <p className="text-brand-gray-500 text-sm mt-2 font-light">
                  One-off — equivalent to two months of hosting, due when your site goes live.
                </p>
              </div>
              <div className="h-px bg-brand-gray-200" />
              <div>
                <p className="text-brand-gray-600 text-sm font-light mb-1">Then, every month</p>
                <p className="font-display text-5xl md:text-6xl font-bold tracking-tighter">£20</p>
                <p className="text-brand-gray-500 text-sm mt-2 font-light">
                  Recurring from one month after your first payment.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-brand-gray-600 font-light leading-relaxed mt-10 pt-8 border-t border-brand-gray-200">
            No invoice is raised until your website is published and visible to everyone — so you are never paying for work you do not want to keep.
          </p>
        </div>

        {/* Detail columns */}
        <div className="lg:col-span-7 space-y-8">
          <div className="border border-brand-gray-200 p-6 md:p-8">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
              <Check className="text-brand-gray-400 shrink-0" size={20} strokeWidth={2} />
              Included in £20 / month
            </h3>
            <ul className="space-y-3 text-brand-gray-600 font-light text-sm md:text-base leading-relaxed">
              <li>Hosting so your site stays online.</li>
              <li>
                Your full website plus a working email contact form — usable as a simple enquiry or quote form so visitors can reach you from the site.
              </li>
              <li>
                Small updates included: up to <strong className="font-medium text-brand-black">30 minutes</strong> of work per month at no extra charge (fair use for tweaks and minor edits).
              </li>
            </ul>
            <p className="mt-6 text-sm text-brand-gray-500 font-light border-l-2 border-brand-gray-300 pl-4">
              The contact form is switched on only after your first payment, so everything stays aligned with when you commit to the live service.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-brand-gray-200 p-6">
              <Globe className="text-brand-gray-400 mb-3" size={22} strokeWidth={1.5} />
              <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Domains</h3>
              <p className="text-brand-gray-600 text-sm font-light leading-relaxed">
                Use our subdomain <strong className="font-medium text-brand-black">kicero.workers.dev</strong> at no cost.
              </p>
              <p className="text-brand-gray-600 text-sm font-light leading-relaxed mt-3">
                Prefer your own domain? If you do not already own one, we can purchase it after your first payment and pass the registration cost through. Domain management adds{' '}
                <strong className="font-medium text-brand-black">£2 / month</strong>.
              </p>
            </div>
            <div className="border border-brand-gray-200 p-6">
              <Shield className="text-brand-gray-400 mb-3" size={22} strokeWidth={1.5} />
              <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Summary</h3>
              <p className="text-brand-gray-600 text-sm font-light leading-relaxed">
                <strong className="font-medium text-brand-black">£40</strong> when the site goes live, then{' '}
                <strong className="font-medium text-brand-black">£20</strong> each month starting one month later. Optional custom domain: cost of registration plus{' '}
                <strong className="font-medium text-brand-black">£2 / month</strong> for management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
