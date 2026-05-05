import {motion} from 'motion/react';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';

export default function PrivacyPage() {
  usePageSeo({
    meta: pageMeta.privacy,
    structuredData: [
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Privacy', path: '/privacy'},
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
          Privacy Policy
        </h1>
        <p className="text-brand-gray-500 text-sm uppercase tracking-widest mb-12">
          Last updated: 1 May 2026
        </p>

        <div className="space-y-10 text-brand-gray-700 font-light leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              1. Who we are
            </h2>
            <p>
              Kicero (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a web design studio based
              in Scotland, United Kingdom. We can be reached at{' '}
              <a href="mailto:info@kicero.co.uk" className="underline">
                info@kicero.co.uk
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              2. What we collect
            </h2>
            <p>
              When you submit our contact form, we collect your name, email
              address, and message so we can respond to your enquiry. We do
              not sell your data and we do not share it with third parties
              for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              3. Cookies and analytics
            </h2>
            <p>
              We use a privacy-friendly analytics tool that does not use
              cookies or collect personal information. We may use cookies
              strictly necessary for the operation of the site (for example,
              to remember preferences). No advertising cookies are set.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              4. How long we keep data
            </h2>
            <p>
              Contact form messages are kept only for as long as necessary to
              respond to your enquiry, typically no longer than 24 months.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              5. Your rights (UK GDPR)
            </h2>
            <p>
              You have the right to access, correct, or delete personal
              information we hold about you. To exercise any of these rights,
              email{' '}
              <a href="mailto:info@kicero.co.uk" className="underline">
                info@kicero.co.uk
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 text-brand-black">
              6. Changes to this policy
            </h2>
            <p>
              We may update this policy from time to time. The date at the top
              of this page will reflect the most recent revision.
            </p>
          </section>
        </div>
      </motion.article>
    </div>
  );
}
