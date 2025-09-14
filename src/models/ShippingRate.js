import mongoose from 'mongoose';

const shippingRateSchema = new mongoose.Schema({
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingZone',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Rate name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['flat', 'weight', 'price'],
    required: true
  },
  baseRate: {
    type: Number,
    required: true,
    min: 0
  },
  conditions: [{
    type: {
      type: String,
      enum: ['min_weight', 'max_weight', 'min_price', 'max_price'],
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  }],
  additionalFee: {
    type: Number,
    default: 0,
    min: 0
  },
  freeShippingThreshold: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  estimatedDays: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('ShippingRate', shippingRateSchema);