import {motion} from 'motion/react';

const steps = [
  {
    title: 'Brief',
    body: 'Tell us about your business, audience and what the site needs to do. We respond within 24 hours with an honest scope and price — no jargon, no upsell.',
  },
  {
    title: 'Design',
    body: 'We design a layout that fits your brand and conversion goals. You review, give feedback, and we iterate until it actually feels right.',
  },
  {
    title: 'Build',
    body: 'We build the site on enterprise-grade infrastructure with a focus on speed, mobile experience and SEO. You see progress as it goes.',
  },
  {
    title: 'Launch',
    body: 'Once you are happy, the site goes live on your domain. The first invoice goes out only after launch — never before. Then we handle the small updates each month.',
  },
];

export default function Process() {
  return (
    <motion.section
      initial={{opacity: 0, y: 32}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-80px'}}
      transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
      className="relative"
      aria-labelledby="process-heading"
    >
      <div className="text-center mb-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
          How it works
        </span>
        <h2
          id="process-heading"
          className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter"
        >
          Four steps. No surprises.
        </h2>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, idx) => (
          <motion.li
            key={step.title}
            initial={{opacity: 0, y: 24}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{
              duration: 0.7,
              delay: idx * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative pt-10"
          >
            <span className="absolute top-0 left-0 font-display text-7xl font-black tracking-tighter text-brand-gray-100 leading-none select-none">
              0{idx + 1}
            </span>
            <div className="relative z-10 pl-2">
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-4">
                {step.title}
              </h3>
              <p className="text-brand-gray-600 font-light leading-relaxed">
                {step.body}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
