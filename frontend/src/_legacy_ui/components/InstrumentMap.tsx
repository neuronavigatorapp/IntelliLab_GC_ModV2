import React from 'react';
import { motion } from 'framer-motion';

interface InstrumentMapProps {
  className?: string;
  animated?: boolean;
}

export const InstrumentMap: React.FC<InstrumentMapProps> = ({ 
  className = "",
  animated = true 
}) => {
  const flowAnimation = {
    pathLength: [0, 1],
    opacity: [0.3, 1, 0.3]
  };

  const flowTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 800 200"
        className="w-full h-full"
        role="img"
        aria-label="Gas Chromatograph Flow Diagram"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="spectrumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(var(--color-primary-500))" stopOpacity="0.1" />
            <stop offset="25%" stopColor="rgb(var(--color-accent-mint))" stopOpacity="0.15" />
            <stop offset="50%" stopColor="rgb(var(--color-accent-orange))" stopOpacity="0.1" />
            <stop offset="75%" stopColor="rgb(var(--color-primary-400))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(var(--color-primary-500))" stopOpacity="0.1" />
          </linearGradient>
          
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(var(--color-accent-mint))" stopOpacity="0.6" />
            <stop offset="50%" stopColor="rgb(var(--color-primary-400))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(var(--color-accent-orange))" stopOpacity="0.6" />
          </linearGradient>

          {/* Flow arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="rgb(var(--color-primary-400))"
              opacity="0.8"
            />
          </marker>
        </defs>

        {/* Background spectrum band */}
        <rect
          x="0"
          y="80"
          width="800"
          height="40"
          fill="url(#spectrumGradient)"
          rx="20"
        />

        {/* Main flow line */}
        <motion.path
          d="M 50 100 L 750 100"
          stroke="url(#flowGradient)"
          strokeWidth="3"
          fill="none"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={animated ? flowAnimation : { pathLength: 1, opacity: 0.8 }}
          transition={animated ? flowTransition : { duration: 0 }}
        />

        {/* Inlet (Sample Injection) */}
        <g transform="translate(80, 100)">
          <circle
            cx="0"
            cy="0"
            r="25"
            fill="rgb(var(--color-surface))"
            stroke="rgb(var(--color-primary-500))"
            strokeWidth="3"
            opacity="0.9"
          />
          <motion.circle
            cx="0"
            cy="0"
            r="15"
            fill="rgb(var(--color-accent-mint))"
            opacity="0.6"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] } : {}}
            transition={animated ? { duration: 2, repeat: Infinity, delay: 0.5 } : {}}
          />
          <text
            x="0"
            y="45"
            textAnchor="middle"
            className="text-xs fill-theme-text font-medium"
          >
            Inlet
          </text>
        </g>

        {/* Column (Separation) */}
        <g transform="translate(300, 100)">
          <rect
            x="-60"
            y="-20"
            width="120"
            height="40"
            rx="20"
            fill="rgb(var(--color-surface))"
            stroke="rgb(var(--color-primary-500))"
            strokeWidth="3"
            opacity="0.9"
          />
          {/* Column coil visualization */}
          <motion.path
            d="M -40 -10 Q -20 -15 0 -10 Q 20 -5 40 -10 M -40 0 Q -20 5 0 0 Q 20 -5 40 0 M -40 10 Q -20 15 0 10 Q 20 5 40 10"
            stroke="rgb(var(--color-primary-400))"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
            animate={animated ? { 
              pathOffset: [0, 1], 
              opacity: [0.7, 1, 0.7] 
            } : {}}
            transition={animated ? { 
              duration: 4, 
              repeat: Infinity, 
              ease: "linear" 
            } : {}}
          />
          <text
            x="0"
            y="45"
            textAnchor="middle"
            className="text-xs fill-theme-text font-medium"
          >
            Column
          </text>
        </g>

        {/* Oven (Temperature Control) */}
        <g transform="translate(450, 100)">
          <rect
            x="-40"
            y="-30"
            width="80"
            height="60"
            rx="10"
            fill="rgb(var(--color-surface))"
            stroke="rgb(var(--color-accent-orange))"
            strokeWidth="3"
            opacity="0.9"
          />
          {/* Temperature indicator */}
          <motion.rect
            x="-30"
            y="-20"
            width="60"
            height="40"
            rx="5"
            fill="rgb(var(--color-accent-orange))"
            opacity="0.3"
            animate={animated ? { 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1]
            } : {}}
            transition={animated ? { 
              duration: 3, 
              repeat: Infinity,
              delay: 1
            } : {}}
          />
          {/* Heat waves */}
          <motion.path
            d="M -15 -15 Q -10 -20 -5 -15 Q 0 -10 5 -15 Q 10 -20 15 -15"
            stroke="rgb(var(--color-accent-orange))"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            animate={animated ? { 
              y: [-15, -25, -15],
              opacity: [0.6, 0.3, 0.6] 
            } : {}}
            transition={animated ? { 
              duration: 2, 
              repeat: Infinity,
              delay: 1.5
            } : {}}
          />
          <text
            x="0"
            y="50"
            textAnchor="middle"
            className="text-xs fill-theme-text font-medium"
          >
            Oven
          </text>
        </g>

        {/* Detector */}
        <g transform="translate(650, 100)">
          <rect
            x="-35"
            y="-25"
            width="70"
            height="50"
            rx="8"
            fill="rgb(var(--color-surface))"
            stroke="rgb(var(--color-primary-500))"
            strokeWidth="3"
            opacity="0.9"
          />
          {/* Detection signal */}
          <motion.path
            d="M -20 0 L -10 -10 L 0 5 L 10 -15 L 20 0"
            stroke="rgb(var(--color-accent-mint))"
            strokeWidth="3"
            fill="none"
            opacity="0.7"
            animate={animated ? {
              pathLength: [0, 1, 0],
              opacity: [0.4, 1, 0.4]
            } : {}}
            transition={animated ? {
              duration: 2.5,
              repeat: Infinity,
              delay: 2
            } : {}}
          />
          <text
            x="0"
            y="45"
            textAnchor="middle"
            className="text-xs fill-theme-text font-medium"
          >
            Detector
          </text>
        </g>

        {/* Flow dots animation */}
        {animated && (
          <>
            <motion.circle
              cx="0"
              cy="100"
              r="4"
              fill="rgb(var(--color-primary-400))"
              opacity="0.8"
              animate={{
                cx: [50, 750],
                opacity: [0, 0.8, 0.8, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.1, 0.9, 1]
              }}
            />
            <motion.circle
              cx="0"
              cy="100"
              r="3"
              fill="rgb(var(--color-accent-mint))"
              opacity="0.6"
              animate={{
                cx: [50, 750],
                opacity: [0, 0.6, 0.6, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
                times: [0, 0.1, 0.9, 1]
              }}
            />
            <motion.circle
              cx="0"
              cy="100"
              r="2"
              fill="rgb(var(--color-accent-orange))"
              opacity="0.7"
              animate={{
                cx: [50, 750],
                opacity: [0, 0.7, 0.7, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
                times: [0, 0.1, 0.9, 1]
              }}
            />
          </>
        )}

        {/* Status indicators */}
        <g transform="translate(50, 50)">
          <motion.circle
            cx="0"
            cy="0"
            r="4"
            fill="rgb(var(--color-accent-mint))"
            animate={animated ? {
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1]
            } : {}}
            transition={animated ? {
              duration: 2,
              repeat: Infinity
            } : {}}
          />
          <text
            x="10"
            y="5"
            className="text-xs fill-theme-text-muted"
          >
            System Ready
          </text>
        </g>
      </svg>
    </div>
  );
};