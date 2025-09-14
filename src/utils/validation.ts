export function validateReviewData(data: { 
  rating: number; 
  comment: string; 
  photos?: any[];
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate rating
  if (!data.rating || isNaN(data.rating) || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  // Validate comment
  if (!data.comment?.trim()) {
    errors.push('Review comment is required');
  } else if (data.comment.trim().length < 10) {
    errors.push('Review comment must be at least 10 characters long');
  }

  // Validate photos if provided
  if (data.photos) {
    if (!Array.isArray(data.photos)) {
      errors.push('Photos must be provided as an array');
    } else if (data.photos.length > 5) {
      errors.push('Maximum 5 photos allowed per review');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateHexColor(color: string): boolean {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(color);
}

export function formatHexColor(color: string): string {
  // Remove any spaces or invalid characters
  let cleanColor = color.replace(/\s/g, '');
  
  // Add # if missing
  if (!cleanColor.startsWith('#')) {
    cleanColor = `#${cleanColor}`;
  }
  
  // Ensure 6 digits
  if (cleanColor.length === 4) {
    // Convert #RGB to #RRGGBB
    cleanColor = `#${cleanColor[1]}${cleanColor[1]}${cleanColor[2]}${cleanColor[2]}${cleanColor[3]}${cleanColor[3]}`;
  }
  
  return cleanColor.toUpperCase();
}

export function validateProductData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.name?.trim()) {
    errors.push('Product name is required');
  }

  if (!data.description?.trim()) {
    errors.push('Product description is required');
  }

  if (!data.price || isNaN(data.price) || data.price <= 0) {
    errors.push('Valid price is required');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.push('At least one product image is required');
  }

  // Validate colors
  if (Array.isArray(data.colors)) {
    data.colors.forEach((color: any, index: number) => {
      if (!color.name?.trim()) {
        errors.push(`Color name is required for color #${index + 1}`);
      }
      if (!validateHexColor(color.code)) {
        errors.push(`Invalid color code for ${color.name || `color #${index + 1}`}`);
      }
    });
  }

  // Validate sizes
  if (Array.isArray(data.sizes)) {
    data.sizes.forEach((size: any, index: number) => {
      if (!size.name?.trim()) {
        errors.push(`Size name is required for size #${index + 1}`);
      }
      if (typeof size.stock !== 'number' || size.stock < 0) {
        errors.push(`Invalid stock quantity for ${size.name || `size #${index + 1}`}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}