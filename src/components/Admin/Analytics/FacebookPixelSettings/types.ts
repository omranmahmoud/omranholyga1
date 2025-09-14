export interface FacebookPixelConfig {
  pixelId: string;
  enabled: boolean;
}

export interface FacebookPixelFormData {
  pixelId: string;
  enabled: boolean;
}

export interface FacebookPixelValidation {
  isValid: boolean;
  errors: string[];
}
