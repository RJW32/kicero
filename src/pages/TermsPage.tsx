import {motion} from 'motion/react';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';

export default function TermsPage() {
  usePageSeo({
    meta: pageMeta.terms,
    structuredData: [
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Terms', path: '/terms'},
      ]),
    ],
  });

  return (
    <div className="pt-32 pb-24">
      <motion.article
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
        className="max-w-3xl mx-auto px-6"
      >
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter mb-8 uppercase">
          Terms of Service
        </h1>
        <p className="text-brand-gray-500 text-sm uppercase tracking-widest mb-12">
          Last updated: 1 May 2026
        </p>

        <div className="space-y-10 text-brand-gray-700 font-light leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              1. Pricing and payment
            </h2>
            <p>
              No payment is taken until your website has been published and
              you have confirmed you are happy with it. From that point, the
              first payment of £40 (equivalent to two months of hosting) is
              due, followed by £20 per month starting one month later.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              2. What is included
            </h2>
            <p>
              The £20 per month plan includes hosting, a working contact form,
              and up to 30 minutes of small updates per month. Larger work is
              quoted separately. The contact form is enabled after your first
              payment is received.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              3. Domains
            </h2>
            <p>
              You may use a Kicero subdomain free of charge, or a custom
              domain. If we register a domain on your behalf, the registration
              cost is passed through to you, and domain management adds £2 per
              month.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              4. Cancellation
            </h2>
            <p>
              You may cancel at any time with 30 days&apos; notice. On
              cancellation we will help you migrate the site or hand over
              relevant files where reasonably possible.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              5. Liability
            </h2>
            <p>
              We work hard to keep your site online and secure but cannot
              guarantee uninterrupted service. To the extent permitted by UK
              law, our liability is limited to the fees paid by you in the
              previous 12 months.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              6. Governing law
            </h2>
            <p>
              These terms are governed by the laws of Scotland and the courts
              of Scotland have exclusive jurisdiction.
            </p>
          </section>
        </div>
      </motion.article>
    </div>
  );
}
