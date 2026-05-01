import { motion, useScroll, useTransform } from 'motion/react';

export default function ParallaxBackground() {
  const { scrollYProgress } = useScroll();

  // Different speeds and directions for layers
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.03, 0.08, 0.03]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-brand-white">
      {/* Dynamic Grid Pattern */}
      <motion.div 
        style={{ 
          opacity,
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
        className="absolute inset-0" 
      />

      {/* Layer 1: Large decorative letter K */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-[10%] -left-10 text-[50vw] font-display font-black text-brand-gray-100/40 select-none leading-none tracking-tighter"
      >
        K
      </motion.div>

      {/* Layer 2: Geometric Shapes */}
      <motion.div 
        style={{ y: y2, rotate: rotate1 }}
        className="absolute top-[40%] right-[5%] w-96 h-96 border-[0.5px] border-brand-gray-300/30 rotate-12"
      />
      
      <motion.div 
        style={{ y: y4, rotate: rotate2 }}
        className="absolute top-[70%] left-[15%] w-48 h-48 border-[0.5px] border-brand-black/10 rounded-full"
      />

      {/* Layer 3: Abstract Text Blocks */}
      <motion.div 
        style={{ y: y3, writingMode: 'vertical-rl' } as any}
        className="absolute top-[25%] right-[10%] text-[10vw] font-display font-bold text-brand-gray-100/30 select-none vertical-text"
      >
        EST. 2026
      </motion.div>

      <motion.div 
        style={{ y: y2 }}
        className="absolute top-[85%] right-[20%] text-[12vw] font-display font-black text-brand-gray-100/20 select-none"
      >
        DIGITAL
      </motion.div>

      {/* Vertical Accent Lines */}
      <div className="absolute inset-0 flex justify-between px-[10%] opacity-[0.03]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-[1px] h-full bg-black" />
        ))}
      </div>
    </div>
  );
}
