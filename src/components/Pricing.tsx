import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Check, Globe, Shield } from 'lucide-react';

export default function Pricing() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-6 mb-24"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
        Transparent billing
      </span>
      <p className="text-brand-gray-600 max-w-2xl text-lg font-light leading-relaxed mb-12">
        You pay nothing until your website is live and you are happy with it. After launch, simple ongoing pricing covers hosting, upkeep, and a fair allowance for small updates.
      </p>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Hero numbers — custom domain (standard) */}
        <div className="lg:col-span-5 border border-brand-black bg-brand-gray-50/80 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-gray-500 mb-2">
              Standard — custom domain
            </p>
            <p className="text-xs text-brand-gray-500 font-light mb-6">
              What most customers choose. Your own domain name, with basic SEO included.
            </p>
            <div className="space-y-8">
              <div>
                <p className="text-brand-gray-600 text-sm font-light mb-1">First payment (when you go live)</p>
                <p className="font-display text-5xl md:text-6xl font-bold tracking-tighter">£41</p>
                <p className="text-brand-gray-500 text-sm mt-2 font-light">
                  Your first month at{' '}
                  <strong className="font-medium text-brand-black">£16</strong> plus a one-off{' '}
                  <strong className="font-medium text-brand-black">£25</strong> setup fee — nothing more until the next monthly invoice.
                </p>
                <p className="text-brand-gray-500 text-sm mt-2 font-light">
                  If we register a domain for you, the registration cost is passed through at setup on top of this.
                </p>
              </div>
              <div className="h-px bg-brand-gray-200" />
              <div>
                <p className="text-brand-gray-600 text-sm font-light mb-1">Then, every month</p>
                <p className="font-display text-5xl md:text-6xl font-bold tracking-tighter">£16</p>
                <p className="text-brand-gray-500 text-sm mt-2 font-light">
                  Recurring from one month after your first payment. Includes domain management.
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
              Included in £16 / month
            </h3>
            <ul className="space-y-3 text-brand-gray-600 font-light text-sm md:text-base leading-relaxed">
              <li>Hosting so your site stays online.</li>
              <li>
                Your full website plus a working email contact form — usable as a simple enquiry or quote form so visitors can reach you from the site.
              </li>
              <li>
                Small updates included: up to <strong className="font-medium text-brand-black">30 minutes</strong> of work per month at no extra charge (fair use for tweaks and minor edits).
              </li>
              <li>
                Custom domain management — we connect and maintain your own domain name as part of the monthly fee.
              </li>
              <li>
                Basic SEO setup so Google can find and understand your site (page titles, descriptions, headings, and clean structure).
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
                Most customers use their own domain — that is what the{' '}
                <strong className="font-medium text-brand-black">£16 / month</strong> plan is built around.
              </p>
              <p className="text-brand-gray-600 text-sm font-light leading-relaxed mt-3">
                If you do not already own a domain, we can register one for you at setup and pass the registration cost through to you. Domain management is included in the monthly fee.
              </p>
            </div>
            <div className="border border-brand-gray-200 p-6">
              <Shield className="text-brand-gray-400 mb-3" size={22} strokeWidth={1.5} />
              <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Summary</h3>
              <p className="text-brand-gray-600 text-sm font-light leading-relaxed">
                <strong className="font-medium text-brand-black">£41</strong> at launch (
                <strong className="font-medium text-brand-black">£16</strong> first month +{' '}
                <strong className="font-medium text-brand-black">£25</strong> setup), then{' '}
                <strong className="font-medium text-brand-black">£16</strong> each month starting one month later — plus any domain registration cost at setup if we register one for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subdomain alternative */}
      <div className="border border-brand-gray-200 p-8 md:p-10 mt-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-gray-500 mb-2">
          Alternative — no custom domain
        </p>
        <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-4">
          Subdomain only · £14 / month
        </h3>
        <p className="text-brand-gray-600 font-light leading-relaxed text-sm md:text-base mb-6 max-w-3xl">
          If you prefer not to use a custom domain, your site can live on a{' '}
          <strong className="font-medium text-brand-black">kicero.workers.dev</strong> subdomain instead.
          The monthly fee drops to <strong className="font-medium text-brand-black">£14</strong>, with a{' '}
          <strong className="font-medium text-brand-black">£39</strong> launch payment (
          <strong className="font-medium text-brand-black">£14</strong> first month +{' '}
          <strong className="font-medium text-brand-black">£25</strong> setup).
        </p>
        <p className="text-brand-gray-600 font-light leading-relaxed text-sm md:text-base mb-6 max-w-3xl">
          This option does <strong className="font-medium text-brand-black">not</strong> include SEO work — search engines treat subdomain sites differently, and meaningful SEO requires a custom domain. Hosting, the contact form, and small updates are still included.
        </p>
        <p className="text-brand-gray-500 text-sm font-light leading-relaxed">
          Want the standard plan with your own domain?{' '}
          <Link
            to="/contact"
            className="font-medium text-brand-black underline underline-offset-4 hover:no-underline"
          >
            Get in touch
          </Link>
          .
        </p>
      </div>

      <div className="border border-brand-gray-200 p-8 md:p-10 mt-12">
        <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-4">
          Alternative pricing
        </h3>
        <p className="text-brand-gray-600 font-light leading-relaxed text-sm md:text-base mb-6">
          If you prefer, once we understand what kind of website you are looking for, we{' '}
          <strong className="font-medium text-brand-black">quote for the work</strong> with a one-off price for the build.
          That amount is invoiced{' '}
          <strong className="font-medium text-brand-black">when your site launches</strong>. After launch, pricing is{' '}
          <strong className="font-medium text-brand-black">£32 per year</strong> recurring — equivalent to{' '}
          <strong className="font-medium text-brand-black">£2.50 per month</strong> — including domain management where we manage your custom domain. Website updates are quoted separately.
        </p>
        <p className="text-brand-gray-500 text-sm font-light leading-relaxed">
          Questions about alternative pricing?{' '}
          <Link
            to="/contact"
            className="font-medium text-brand-black underline underline-offset-4 hover:no-underline"
          >
            Get in touch
          </Link>
          .
        </p>
      </div>

      <div className="border border-brand-gray-200 bg-brand-gray-50/50 p-6 md:p-8 mt-12 max-w-3xl">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-black mb-4">
          What this pricing is for
        </h3>
        <p className="text-brand-gray-600 text-sm md:text-base font-light leading-relaxed mb-4">
          These figures apply to our <strong className="font-medium text-brand-black">basic simple website</strong> — a focused brochure-style site with:
        </p>
        <ul className="space-y-2 text-brand-gray-600 text-sm md:text-base font-light leading-relaxed list-disc pl-5 mb-4">
          <li>Landing page</li>
          <li>About page</li>
          <li>Contact page with a working email contact form</li>
          <li>Portfolio page</li>
          <li>Images across these pages, plus one video per website</li>
        </ul>
        <p className="text-brand-gray-600 text-sm md:text-base font-light leading-relaxed border-l-2 border-brand-gray-300 pl-4">
          Anything beyond that — extra pages, features, or integrations — we can discuss. We will confirm whether it can sit within this package or whether pricing needs to change before we commit.
        </p>
      </div>
    </motion.section>
  );
}
