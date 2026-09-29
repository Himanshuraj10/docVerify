export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } }
};

export const cardStagger = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const cardItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export const pulseEffect = {
  scale: [1, 1.02, 1],
  transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
};
