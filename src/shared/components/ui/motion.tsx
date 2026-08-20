import React from 'react';
import { motion, type HTMLMotionProps, AnimatePresence, type Variants } from 'framer-motion';

// Smooth spring and ease curves
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const itemFadeUpVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

export const cardHoverProps = {
  whileHover: { y: -2, transition: { duration: 0.18, ease: 'easeOut' } },
  whileTap: { scale: 0.995 },
};

export const buttonTapProps = {
  whileHover: { scale: 1.015, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

/**
 * AnimatedPage: Wrap full page views for smooth entrance transitions.
 */
export function AnimatedPage({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedList: Staggers the animation of child elements.
 */
export function AnimatedList({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedItem: Item inside an AnimatedList.
 */
export function AnimatedItem({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div variants={itemFadeUpVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export { motion, AnimatePresence };
