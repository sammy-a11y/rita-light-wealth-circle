// Framer Motion page transition variants
export const pageVariants = {
  initial:  { opacity: 0, y: 24 },
  animate:  { 
    opacity: 1, 
    y: 0,  
    transition: { duration: 0.4, ease: 'easeOut' } 
  },
  exit:     { 
    opacity: 0, 
    y: -24, 
    transition: { duration: 0.25 } 
  }
}

// Stagger children (for lists of cards)
export const containerVariants = {
  initial:  {},
  animate:  { 
    transition: { staggerChildren: 0.08 } 
  }
}

export const itemVariants = {
  initial:  { opacity: 0, y: 20 },
  animate:  { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.35 } 
  }
}

// Slot number animations
export const slotVariants = {
  initial:  { opacity: 0, scale: 0.8 },
  animate:  { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  },
  tap:      { scale: 0.92 },
  hover:    { scale: 1.08 }
}

// Modal / bottom sheet slide up
export const modalVariants = {
  initial:  { opacity: 0, y: 100 },
  animate:  { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 260, damping: 28 } 
  },
  exit:     { 
    opacity: 0, 
    y: 100, 
    transition: { duration: 0.2 } 
  }
}

// Notification drop down
export const notifVariants = {
  initial:  { opacity: 0, y: -10, scale: 0.95 },
  animate:  { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.2 } 
  },
  exit:     { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: 0.15 } 
  }
}

// Card entrance
export const cardVariants = {
  initial:  { opacity: 0, y: 30 },
  animate:  { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

// Penalty warning shake
export const shakeVariants = {
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.4 }
  }
}