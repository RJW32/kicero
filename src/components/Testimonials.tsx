import {motion} from 'motion/react';
import {Quote} from 'lucide-react';
import {testimonials} from '../data/testimonials';

export default function Testimonials() {
  return (
    <motion.section
      initial={{opacity: 0, y: 32}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-80px'}}
      transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
      className="relative"
      aria-labelledby="testimonials-heading"
    >
      <div className="text-center mb-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
          What clients say
        </span>
        <h2
          id="testimonials-heading"
          className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter"
        >
          Trusted by small businesses
        </h2>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, idx) => (
          <motion.li
            key={testimonial.name}
            initial={{opacity: 0, y: 24}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{
              duration: 0.7,
              delay: idx * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="border border-brand-gray-200 p-8 flex flex-col"
            itemScope
            itemType="https://schema.org/Review"
          >
            <Quote
              size={28}
              className="text-brand-gray-300 mb-6"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p
              className="text-brand-gray-700 font-light leading-relaxed text-base md:text-lg flex-1"
              itemProp="reviewBody"
            >
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div
              className="mt-8 pt-6 border-t border-brand-gray-100"
              itemProp="author"
              itemScope
              itemType="https://schema.org/Person"
            >
              <p
                className="font-display font-bold uppercase tracking-tight"
                itemProp="name"
              >
                {testimonial.name}
              </p>
              <p className="text-xs text-brand-gray-500 uppercase tracking-widest mt-1">
                {testimonial.role} · {testimonial.location}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
