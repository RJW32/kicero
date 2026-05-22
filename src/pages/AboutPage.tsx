import {motion} from 'motion/react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';
import {
  aboutPageSchema,
  buildBreadcrumb,
  faqSchema,
} from '../seo/structuredData';

/**
 * Brand-definition page. This is the canonical answer to "What is Kicero?",
 * "Where is Kicero based?", "What does Kicero do?" — the exact question
 * shapes Google's AI Overview / Knowledge Panel models extract from.
 *
 * Heading text is deliberately phrased as questions and the first sentence of
 * each section restates the entity name + fact ("Kicero is a Scottish web
 * design studio that..."). This is the format models like to cite.
 */

const SECTIONS = [
  {
    id: 'what-is-kicero',
    heading: 'What is Kicero?',
    body: (
      <>
        <p>
          Kicero is a Scottish web design studio that builds simple, high-end,
          low-cost custom websites for small businesses, startups and
          individuals across the United Kingdom. Every Kicero site is designed
          and developed in Scotland — no templates, no offshore production.
        </p>
        <p>
          The studio was founded in 2026 with one goal: give UK small
          businesses websites that look as considered as the work bigger
          agencies charge tens of thousands for, without the price tag.
        </p>
      </>
    ),
  },
  {
    id: 'where-is-kicero-based',
    heading: 'Where is Kicero based?',
    body: (
      <>
        <p>
          Kicero is based in Scotland and serves clients across the entire
          United Kingdom — including Edinburgh, Glasgow, Aberdeen, Dundee,
          Inverness, Stirling, Perth, London, Manchester, Birmingham and
          everywhere in between.
        </p>
        <p>
          The whole process can be done remotely over email and video, so
          clients never need to be local. Every Kicero website is hosted on
          enterprise-grade Cloudflare infrastructure that is fast, secure and
          globally distributed.
        </p>
      </>
    ),
  },
  {
    id: 'what-does-kicero-do',
    heading: 'What does Kicero do?',
    body: (
      <>
        <p>Kicero builds and looks after small business websites. Specifically:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Custom web design</strong> — bespoke, no-template
            websites designed around each business&apos;s brand and goals.
          </li>
          <li>
            <strong>Web development</strong> — clean, fast, mobile-first
            builds focused on Core Web Vitals.
          </li>
          <li>
            <strong>Website hosting</strong> — enterprise Cloudflare hosting
            with SSL and DDoS protection built in.
          </li>
          <li>
            <strong>Ongoing maintenance</strong> — small updates included in
            the monthly plan so the site never goes stale.
          </li>
          <li>
            <strong>Domain management</strong> — optional add-on if you want
            Kicero to register and manage your domain.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'who-runs-kicero',
    heading: 'Who runs Kicero?',
    body: (
      <>
        <p>
          Kicero is a small Scottish studio. Every project is handled
          end-to-end by the same person who designed it — there are no account
          managers, no offshore teams, and no handoffs. That keeps quality
          high and pricing low.
        </p>
        <p>
          The studio is intentionally lean: small enough to give every client
          personal attention, but careful enough about technology choices that
          the websites it builds outperform much larger competitors.
        </p>
      </>
    ),
  },
  {
    id: 'how-much-does-kicero-cost',
    heading: 'How much does Kicero cost?',
    body: (
      <>
        <p>
          Kicero charges £40 once a website goes live — that&apos;s a £25
          one-off setup fee plus the first month (£15) — and then £15 per
          month after that. The monthly fee covers hosting, the contact form,
          security, and up to 30 minutes of small updates each month at no
          extra cost.
        </p>
        <p>
          Clients only pay once their website is live and they are happy with
          it. There is no upfront cost, no long contract, and Kicero can be
          cancelled any time with 30 days&apos; notice.{' '}
          <Link to="/services" className="underline">
            See full pricing.
          </Link>
        </p>
      </>
    ),
  },
  {
    id: 'why-was-kicero-founded',
    heading: 'Why was Kicero founded?',
    body: (
      <>
        <p>
          Most UK small businesses are quoted between £1,500 and £5,000 for a
          website that does, in practice, very little — and then charged
          £60–£150 every time they want a small edit. Kicero was founded in
          2026 to change that.
        </p>
        <p>
          The idea is simple: build the website properly the first time, host
          it on enterprise-grade infrastructure, include the small updates,
          and charge a fair, transparent monthly fee.
        </p>
      </>
    ),
  },
];

const FAQS = [
  {
    question: 'What is Kicero?',
    answer:
      'Kicero is a Scottish web design studio that builds simple, high-end, low-cost custom websites for small businesses, startups and individuals across the United Kingdom. Every site is designed and built in Scotland.',
  },
  {
    question: 'Where is Kicero based?',
    answer:
      'Kicero is based in Scotland and serves clients across the entire United Kingdom, including Edinburgh, Glasgow, Aberdeen, Dundee, Inverness, London, Manchester, Birmingham and other cities.',
  },
  {
    question: 'When was Kicero founded?',
    answer:
      'Kicero was founded in 2026 with the aim of giving UK small businesses high-end custom websites without agency-level pricing.',
  },
  {
    question: 'What does Kicero do?',
    answer:
      'Kicero designs custom websites, builds them with fast modern code, hosts them on Cloudflare, and handles small updates and domain management — all for £15 per month.',
  },
  {
    question: 'How much does Kicero cost?',
    answer:
      'Kicero charges £40 at launch (£25 setup plus the first month of £15) and then £15 per month, with hosting, the contact form and small updates included. Clients only pay once the website is live.',
  },
  {
    question: 'Does Kicero work outside Scotland?',
    answer:
      'Yes. Kicero is based in Scotland but works with small businesses, startups and individuals across the whole United Kingdom. The process is fully remote.',
  },
];

export default function AboutPage() {
  usePageSeo({
    meta: pageMeta.about,
    structuredData: [
      aboutPageSchema,
      faqSchema(FAQS),
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'About', path: '/about'},
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
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">
          About the studio
        </span>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter mb-6 uppercase leading-[1.05]">
          About Kicero
        </h1>
        <p className="text-brand-gray-600 text-lg md:text-xl font-light leading-relaxed mb-16 border-l-2 border-brand-gray-300 pl-6">
          Kicero is a Scottish web design studio that builds affordable,
          high-end custom websites for small businesses, startups and
          individuals across the United Kingdom.
        </p>

        <div className="space-y-12 text-brand-gray-700 font-light leading-relaxed text-base md:text-lg">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight mb-4 text-brand-black">
                {section.heading}
              </h2>
              <div className="space-y-4">{section.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-brand-gray-200">
          <p className="text-brand-gray-500 text-sm font-light mb-6">
            Ready to talk about your project?
          </p>
          <Link
            to="/contact"
            className="group inline-flex items-center gap-3 px-8 py-5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors font-mono"
          >
            Start a project
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </motion.article>
    </div>
  );
}
