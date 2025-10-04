
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function HexGridBackground() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <>
      {/* Radial gradient overlay */}
      <div className="pointer-events-none fixed inset-0 -z-30">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div 
        className="pointer-events-none fixed inset-0 -z-25 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* Animated gradient mesh */}
      <motion.div 
        className="pointer-events-none fixed inset-0 -z-22"
        style={{ opacity }}
      >
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-5"
          style={{
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            filter: 'blur(80px)'
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-5"
          style={{
            background: 'linear-gradient(225deg, #3b82f6, #8b5cf6)',
            filter: 'blur(80px)'
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />

        <motion.div
          className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full opacity-5"
          style={{
            background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
            filter: 'blur(60px)',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Original hex grid */}
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 1024"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none fixed inset-0 -z-20 select-none fill-transparent stroke-orange-500/20"
        style={{ y }}
      >
        <defs>
          <pattern
            id="hex2d"
            width="120"
            height="104"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(60 0)"
          >
            <polygon
              points="60 0, 120 30, 120 90, 60 120, 0 90, 0 30"
              vectorEffect="non-scaling-stroke"
              strokeWidth="1"
            />
          </pattern>
          <mask id="fadeMask">
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="white" />
              <stop offset="70%" stopColor="black" />
            </linearGradient>
            <rect width="100%" height="100%" fill="url(#grad)" />
          </mask>
        </defs>

        {/* dark hero zone */}
        <rect width="100%" height="60%" fill="url(#hex2d)" mask="url(#fadeMask)" />

        {/* lighter body zone */}
        <rect y="60%" width="100%" height="40%" fill="url(#hex2d)" opacity=".35" />
      </motion.svg>
    </>
  );
}
