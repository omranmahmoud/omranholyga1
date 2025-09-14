export function getSlideAnimation(delay: number = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
      delay
    }
  };
}

export function getGradientAnimation() {
  return {
    backgroundSize: '200% 200%',
    animation: 'gradient 15s ease infinite'
  };
}
