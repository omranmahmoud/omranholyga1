import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Eva Curves Fashion Store'
  },
  email: {
    type: String,
    required: true,
    default: 'contact@evacurves.com'
  },
  phone: {
    type: String,
    default: '+1 (555) 123-4567'
  },
  address: {
    type: String,
    default: '123 Fashion Street, NY 10001'
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'IQD', 'ILS'],
    default: 'USD'
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC-5'
  },
  logo: {
    type: String,
    default: null
  },
  
  // Design/Theme settings
  primaryColor: {
    type: String,
    default: '#3b82f6' // Blue
  },
  secondaryColor: {
    type: String,
    default: '#64748b' // Slate
  },
  accentColor: {
    type: String,
    default: '#f59e0b' // Amber
  },
  textColor: {
    type: String,
    default: '#1f2937' // Gray 800
  },
  backgroundColor: {
    type: String,
    default: '#ffffff' // White
  },
  fontFamily: {
    type: String,
    default: 'Inter, system-ui, sans-serif'
  },
  headingFont: {
    type: String,
    default: 'Inter, system-ui, sans-serif'
  },
  bodyFont: {
    type: String,
    default: 'Inter, system-ui, sans-serif'
  },
  borderRadius: {
    type: String,
    default: '8px'
  },
  buttonStyle: {
    type: String,
    enum: ['rounded', 'square', 'pill'],
    default: 'rounded'
  },
  
  // Layout settings
  headerLayout: {
    type: String,
    enum: ['classic', 'modern', 'minimal'],
    default: 'modern'
  },
  footerStyle: {
    type: String,
    enum: ['simple', 'detailed', 'newsletter'],
    default: 'detailed'
  },
  productCardStyle: {
    type: String,
    enum: ['modern', 'classic', 'minimal'],
    default: 'modern'
  },
  // Product grid layout variants
  productGridStyle: {
    type: String,
    enum: ['standard', 'compact', 'masonry', 'list', 'wide', 'gallery', 'carousel'],
    default: 'standard'
  },
  
  // Social media links
  socialLinks: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    tiktok: { type: String, default: '' }
  },
  
  // SEO settings
  siteTitle: {
    type: String,
    default: 'Eva Curves Fashion Store'
  },
  siteDescription: {
    type: String,
    default: 'Premium fashion store offering the latest trends in clothing and accessories'
  },
  keywords: [{
    type: String
  }],
  
  // Analytics
  facebookPixel: {
    pixelId: { type: String, default: '' },
    enabled: { type: Boolean, default: false }
  },
  googleAnalytics: {
    trackingId: { type: String, default: '' },
    enabled: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Create default settings or migrate existing ones
settingsSchema.statics.createDefaultSettings = async function() {
  try {
    const settings = await this.findOne();
    if (!settings) {
      // No settings exist, create default ones
      await this.create({});
      console.log('Default store settings created successfully');
    } else {
      // Settings exist, check if we need to add new theme fields
      let needsUpdate = false;
      const updateData = {};
      
      // Check for missing theme fields and add defaults
      if (!settings.primaryColor) {
        updateData.primaryColor = '#3b82f6';
        needsUpdate = true;
      }
      if (!settings.secondaryColor) {
        updateData.secondaryColor = '#64748b';
        needsUpdate = true;
      }
      if (!settings.accentColor) {
        updateData.accentColor = '#f59e0b';
        needsUpdate = true;
      }
      if (!settings.textColor) {
        updateData.textColor = '#1f2937';
        needsUpdate = true;
      }
      if (!settings.backgroundColor) {
        updateData.backgroundColor = '#ffffff';
        needsUpdate = true;
      }
      if (!settings.fontFamily) {
        updateData.fontFamily = 'Inter, system-ui, sans-serif';
        needsUpdate = true;
      }
      if (!settings.productGridStyle) {
        updateData.productGridStyle = 'standard';
        needsUpdate = true;
      }
      if (!settings.productCardStyle) {
        updateData.productCardStyle = 'modern';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await this.findByIdAndUpdate(settings._id, updateData);
        console.log('Existing settings migrated with new theme fields');
      }
    }
  } catch (error) {
    console.error('Error creating/migrating settings:', error);
  }
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;