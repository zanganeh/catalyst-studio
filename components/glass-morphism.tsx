'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFeatureEnabled } from '@/config/features';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
}

/**
 * Glass Morphism Card Component
 * Story 1.1c - Provides glass effect when feature flags are enabled
 */
export function GlassCard({ 
  children, 
  className = '', 
  blur = 'md',
  opacity = 0.1 
}: GlassCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isGlassEnabled, setIsGlassEnabled] = useState(false);
  const [isAnimationsEnabled, setIsAnimationsEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsGlassEnabled(isFeatureEnabled('glassMorphism'));
    setIsAnimationsEnabled(isFeatureEnabled('animations'));
  }, []);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  const blurClass = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  }[blur];

  const glassClasses = isGlassEnabled
    ? `${blurClass} bg-white/10 border border-white/20 shadow-2xl`
    : '';

  if (isAnimationsEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        className={`${className} ${glassClasses} transition-all`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${className} ${glassClasses}`}>
      {children}
    </div>
  );
}

/**
 * Animated Panel Component
 * Provides slide-in animations for panels
 */
export function AnimatedPanel({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [isAnimationsEnabled, setIsAnimationsEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAnimationsEnabled(isFeatureEnabled('animations'));
  }, []);

  if (!mounted || !isAnimationsEnabled) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    hidden: {
      opacity: 0,
      x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
      y: direction === 'top' ? -50 : direction === 'bottom' ? 50 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Floating Geometric Shape
 * Background decoration element
 */
export function FloatingShape({
  size = 100,
  color = 'orange',
  position = { top: '10%', left: '10%' },
  delay = 0,
}: {
  size?: number;
  color?: 'orange' | 'blue' | 'green';
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  delay?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [isAnimationsEnabled, setIsAnimationsEnabled] = useState(false);
  const [isGlassEnabled, setIsGlassEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAnimationsEnabled(isFeatureEnabled('animations'));
    setIsGlassEnabled(isFeatureEnabled('glassMorphism'));
  }, []);

  if (!mounted || !isGlassEnabled) {
    return null;
  }

  const bgColor = {
    orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
    green: 'bg-gradient-to-br from-green-400 to-green-600',
  }[color];

  const shape = (
    <div
      className={`absolute ${bgColor} rounded-lg transform rotate-45 opacity-20`}
      style={{
        width: size,
        height: size,
        ...position,
        zIndex: -1,
      }}
    />
  );

  if (isAnimationsEnabled) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [45, 50, 45],
        }}
        transition={{
          duration: 10,
          delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute"
        style={{
          width: size,
          height: size,
          ...position,
          zIndex: -1,
        }}
      >
        <div className={`w-full h-full ${bgColor} rounded-lg opacity-20`} />
      </motion.div>
    );
  }

  return shape;
}

/**
 * Page Transition Wrapper
 * Provides smooth page transitions
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAnimationsEnabled, setIsAnimationsEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAnimationsEnabled(isFeatureEnabled('animations'));
  }, []);

  if (!mounted || !isAnimationsEnabled) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}