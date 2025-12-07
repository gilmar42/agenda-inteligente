import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  // Identificação
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  domain: {
    type: String,
    sparse: true,
    unique: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  // Dados da empresa
  companyInfo: {
    legalName: String,
    taxId: String, // CNPJ/CPF
    email: { type: String, required: true },
    phone: String,
    website: String,
    address: {
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'Brasil' }
    }
  },
  
  // Configurações
  settings: {
    timezone: { type: String, default: 'America/Sao_Paulo' },
    language: { type: String, default: 'pt-BR' },
    currency: { type: String, default: 'BRL' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    logo: String,
    primaryColor: { type: String, default: '#667eea' },
    secondaryColor: { type: String, default: '#764ba2' }
  },
  
  // Assinatura
  subscription: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'suspended', 'canceled', 'expired'],
      default: 'trial'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    trialEndDate: Date,
    autoRenew: { type: Boolean, default: true },
    paymentMethod: String,
    lastPaymentDate: Date,
    nextPaymentDate: Date
  },
  
  // Uso e limites
  usage: {
    appointments: { type: Number, default: 0 },
    clients: { type: Number, default: 0 },
    users: { type: Number, default: 0 },
    services: { type: Number, default: 0 },
    storage: { type: Number, default: 0 }, // MB
    apiCalls: { type: Number, default: 0 }
  },
  
  // Métricas
  metrics: {
    mrr: { type: Number, default: 0 }, // Monthly Recurring Revenue
    totalRevenue: { type: Number, default: 0 },
    lastActivityDate: Date,
    signupSource: String
  },
  
  // Administrador principal
  owner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: String,
  deletedAt: Date
}, {
  timestamps: true
});

// Índices
tenantSchema.index({ slug: 1 });
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ domain: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ isActive: 1 });

// Virtual para verificar se está em trial
tenantSchema.virtual('isInTrial').get(function() {
  return this.subscription.status === 'trial' && 
         this.subscription.trialEndDate && 
         new Date() < this.subscription.trialEndDate;
});

// Virtual para verificar se assinatura está ativa
tenantSchema.virtual('hasActiveSubscription').get(function() {
  return ['trial', 'active'].includes(this.subscription.status);
});

// Método para verificar limite
tenantSchema.methods.checkLimit = async function(resource) {
  const Plan = mongoose.model('Plan');
  const plan = await Plan.findById(this.subscription.planId);
  
  if (!plan) return false;
  
  const limit = plan.limits[resource];
  if (limit === -1) return true; // unlimited
  
  return this.usage[resource] < limit;
};

// Método para incrementar uso
tenantSchema.methods.incrementUsage = async function(resource, amount = 1) {
  this.usage[resource] += amount;
  return this.save();
};

// Método para verificar feature
tenantSchema.methods.hasFeature = async function(featureName) {
  const Plan = mongoose.model('Plan');
  const plan = await Plan.findById(this.subscription.planId);
  
  return plan?.features[featureName] || false;
};

export default mongoose.model('Tenant', tenantSchema);
