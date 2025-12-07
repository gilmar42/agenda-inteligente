import mongoose from 'mongoose';

const subscriptionHistorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'upgraded', 'downgraded', 'renewed', 'canceled', 'suspended', 'reactivated'],
    required: true
  },
  previousPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  amount: Number,
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  transactionId: String,
  notes: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

subscriptionHistorySchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
