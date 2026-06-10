import {useCallback, useState} from 'react';
import {AnimatePresence, motion, type PanInfo} from 'motion/react';
import {ChevronLeft, ChevronRight, Quote} from 'lucide-react';
import {testimonials, type Testimonial} from '../data/testimonials';
import {usePrefersReducedMotion} from '../hooks/useMediaQuery';

const SWIPE_OFFSET_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 280;
const SLIDE_OFFSET = 28;

function TestimonialCard({testimonial}: {testimonial: Testimonial}) {
  return (
    <article
      className="border border-brand-gray-200 p-8 flex flex-col min-h-[280px]"
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
    </article>
  );
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reducedMotion = usePrefersReducedMotion();
  const count = testimonials.length;

  const goTo = useCallback(
    (nextIndex: number, slideDirection: number) => {
      setDirection(slideDirection);
      setIndex(((nextIndex % count) + count) % count);
    },
    [count],
  );

  const goNext = useCallback(() => {
    goTo(index + 1, 1);
  }, [goTo, index]);

  const goPrev = useCallback(() => {
    goTo(index - 1, -1);
  }, [goTo, index]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const {offset, velocity} = info;
      const swipedLeft =
        offset.x <= -SWIPE_OFFSET_THRESHOLD ||
        velocity.x <= -SWIPE_VELOCITY_THRESHOLD;
      const swipedRight =
        offset.x >= SWIPE_OFFSET_THRESHOLD ||
        velocity.x >= SWIPE_VELOCITY_THRESHOLD;

      if (swipedLeft) goNext();
      else if (swipedRight) goPrev();
    },
    [goNext, goPrev],
  );

  const slideMotion = reducedMotion
    ? {
        initial: {opacity: 0},
        animate: {opacity: 1},
        exit: {opacity: 0},
      }
    : {
        initial: {opacity: 0, x: direction * SLIDE_OFFSET},
        animate: {opacity: 1, x: 0},
        exit: {opacity: 0, x: direction * -SLIDE_OFFSET},
      };

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

      <div
        className="relative max-w-2xl mx-auto"
        role="region"
        aria-roledescription="carousel"
        aria-label="Client testimonials"
      >
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="w-full min-w-0 overflow-hidden touch-pan-y">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                {...slideMotion}
                drag={reducedMotion ? false : 'x'}
                dragConstraints={{left: 0, right: 0}}
                dragElastic={0.18}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{touchAction: 'pan-y'}}
                className="cursor-grab active:cursor-grabbing select-none"
                transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
              >
                <TestimonialCard testimonial={testimonials[index]} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={goPrev}
              className="shrink-0 flex items-center justify-center size-10 md:size-11 border border-brand-gray-200 text-brand-gray-500 hover:text-brand-black hover:border-brand-gray-400 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="shrink-0 flex items-center justify-center size-10 md:size-11 border border-brand-gray-200 text-brand-gray-500 hover:text-brand-black hover:border-brand-gray-400 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="flex justify-center gap-2 mt-8"
          role="tablist"
          aria-label="Choose a review"
        >
          {testimonials.map((testimonial, testimonialIndex) => (
            <button
              key={testimonial.name}
              type="button"
              role="tab"
              aria-selected={testimonialIndex === index}
              aria-label={`Review ${testimonialIndex + 1} of ${count}`}
              onClick={() =>
                goTo(
                  testimonialIndex,
                  testimonialIndex === index
                    ? direction
                    : testimonialIndex > index
                      ? 1
                      : -1,
                )
              }
              className={`h-1.5 rounded-full transition-all duration-300 ${
                testimonialIndex === index
                  ? 'w-6 bg-brand-black'
                  : 'w-1.5 bg-brand-gray-300 hover:bg-brand-gray-400'
              }`}
            />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          Review {index + 1} of {count}
        </p>
      </div>
    </motion.section>
  );
}
