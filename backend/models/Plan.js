import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  price: {
    monthly: { type: Number, required: true },
    yearly: { type: Number, required: true }
  },
  limits: {
    appointments: { type: Number, default: -1 }, // -1 = unlimited
    clients: { type: Number, default: -1 },
    users: { type: Number, default: 1 },
    services: { type: Number, default: -1 },
    storage: { type: Number, default: 1024 }, // MB
    apiCalls: { type: Number, default: 10000 } // per month
  },
  features: {
    customDomain: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false },
    advancedReports: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    emailIntegration: { type: Boolean, default: false },
    calendarSync: { type: Boolean, default: false },
    multipleLocations: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model('Plan', planSchema);
