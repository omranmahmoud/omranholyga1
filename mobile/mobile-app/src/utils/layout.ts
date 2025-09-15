export const MAX_CONTENT_WIDTH = 1100;

export const getContainerWidth = (screenWidth: number, max: number = MAX_CONTENT_WIDTH): number => {
  return Math.min(screenWidth, max);
};

export const centeredStyle = (screenWidth: number, max: number = MAX_CONTENT_WIDTH) => ({
  width: getContainerWidth(screenWidth, max),
  alignSelf: 'center' as const,
});
