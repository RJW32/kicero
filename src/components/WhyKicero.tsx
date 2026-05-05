import {motion} from 'motion/react';
import {MapPin, Lock, Sparkles} from 'lucide-react';

const pillars = [
  {
    icon: <MapPin size={28} strokeWidth={1.5} />,
    title: 'Scottish-built, UK-wide',
    body: 'Designed and developed in Scotland, working with small businesses, startups and individuals across England, Scotland, Wales and Northern Ireland. The whole process happens online.',
  },
  {
    icon: <Lock size={28} strokeWidth={1.5} />,
    title: 'No payment until live',
    body: 'You never pay before your website is published and you are happy with it. The first invoice only goes out after launch — so you are never paying for work you do not want to keep.',
  },
  {
    icon: <Sparkles size={28} strokeWidth={1.5} />,
    title: 'Simple, high-end, low-cost',
    body: 'A fully custom website for the price of an off-the-shelf builder. Hosting, contact form and small monthly updates included — no agency markups, no surprise invoices.',
  },
];

export default function WhyKicero() {
  return (
    <motion.section
      initial={{opacity: 0, y: 32}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-80px'}}
      transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
      className="relative"
      aria-labelledby="why-kicero-heading"
    >
      <div className="text-center mb-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
          Why Kicero
        </span>
        <h2
          id="why-kicero-heading"
          className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter"
        >
          Affordable websites,
          <br />
          built properly.
        </h2>
        <p className="text-brand-gray-600 max-w-2xl mx-auto text-lg font-light leading-relaxed mt-6">
          A small Scottish studio for small UK businesses that want a real website, not a template, and refuse to pay agency rates for it.
        </p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pillars.map((pillar, idx) => (
          <motion.li
            key={pillar.title}
            initial={{opacity: 0, y: 24}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{
              duration: 0.7,
              delay: idx * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="border border-brand-gray-200 p-8 flex flex-col"
          >
            <div className="text-brand-gray-500 mb-6">{pillar.icon}</div>
            <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-4">
              {pillar.title}
            </h3>
            <p className="text-brand-gray-600 font-light leading-relaxed">
              {pillar.body}
            </p>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
