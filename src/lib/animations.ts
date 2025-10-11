import confetti from 'canvas-confetti';

// Confetti animation (for achievements)
export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

// Success animation
export const triggerSuccess = () => {
  confetti({
    particleCount: 50,
    startVelocity: 30,
    spread: 360,
    origin: {
      x: Math.random(),
      y: Math.random() - 0.2
    }
  });
};

// Haptic feedback (mobile)
export const hapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    };
    navigator.vibrate(patterns[intensity]);
  }
};

// Page transition animation
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

// Card hover animation
export const cardHover = {
  hover: { 
    scale: 1.05,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
  },
  transition: { duration: 0.2 }
};

// Button click animation
export const buttonClick = {
  tap: { scale: 0.95 },
  transition: { duration: 0.1 }
};

