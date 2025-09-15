]import type { Hero } from '../../../types/store';

export function validateHeroData(data: Partial<Hero>): string[] {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Title is required');
  }

  if (!data.subtitle?.trim()) {
    errors.push('Subtitle is required');
  }

  if (!data.image?.trim()) {
    errors.push('Image is required');
  }

  if (!data.primaryButtonText?.trim()) {
    errors.push('Primary button text is required');
  }

  if (!data.secondaryButtonText?.trim()) {
    errors.push('Secondary button text is required');
  }

  return errors;
}
