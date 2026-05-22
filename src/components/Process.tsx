import {motion} from 'motion/react';

const steps = [
  {
    title: 'Brief',
    body: 'Reach out however suits you — our contact page or email — to tell us you are interested in a new site. We reply with practical next steps and send over our questionnaire so we can capture your business, audience, priorities, and any examples you already like. Answer in your own time; anything that does not fit the form can go in free text.',
  },
  {
    title: 'Design',
    body: 'We read every response and translate it into a clear structure and visual direction that stays true to your brand, not an off‑the‑shelf template. Layouts, typography, imagery, and key messages are wired up with speed, accessibility, and a strong mobile experience in mind.',
  },
  {
    title: 'Review',
    body: 'You receive a preview of your new site so you can actually use it — read copy, navigate pages, and sanity‑check imagery. Share what should change — wording tweaks, reordering sections, sharper calls‑to‑action, colour refinement — and we iterate with you until you are confident it is launch‑ready.',
  },
  {
    title: 'Launch',
    body: 'Once you are happy, the site goes live. The first invoice goes out only after launch — never before. We handle any small updates you have each month.',
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
