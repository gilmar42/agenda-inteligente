const Plan = require('../models/Plan');

/**
 * Seed inicial dos planos
 */
const seedPlans = async () => {
  try {
    const existingPlans = await Plan.countDocuments();
    
    if (existingPlans > 0) {
      console.log('Planos já existem no banco de dados');
      return;
    }
    
    const plans = [
      {
        name: 'free',
        displayName: 'Gratuito',
        description: 'Ideal para começar e testar a plataforma',
        price: {
          monthly: 0,
          yearly: 0
        },
        limits: {
          appointments: 50,
          clients: 25,
          users: 1,
          services: 5,
          storage: 100, // MB
          apiCalls: 1000
        },
        features: {
          customDomain: false,
          whiteLabel: false,
          advancedReports: false,
          apiAccess: false,
          prioritySupport: false,
          smsNotifications: false,
          emailIntegration: true,
          calendarSync: false,
          multipleLocations: false,
          customBranding: false
        },
        order: 1
      },
      {
        name: 'basic',
        displayName: 'Básico',
        description: 'Para pequenos negócios em crescimento',
        price: {
          monthly: 49.90,
          yearly: 479.90 // ~20% desconto
        },
        limits: {
          appointments: 500,
          clients: 250,
          users: 3,
          services: 20,
          storage: 1024, // 1GB
          apiCalls: 10000
        },
        features: {
          customDomain: false,
          whiteLabel: false,
          advancedReports: true,
          apiAccess: false,
          prioritySupport: false,
          smsNotifications: true,
          emailIntegration: true,
          calendarSync: true,
          multipleLocations: false,
          customBranding: false
        },
        order: 2
      },
      {
        name: 'pro',
        displayName: 'Profissional',
        description: 'Para negócios estabelecidos com múltiplos usuários',
        price: {
          monthly: 99.90,
          yearly: 959.90
        },
        limits: {
          appointments: 2000,
          clients: 1000,
          users: 10,
          services: 50,
          storage: 5120, // 5GB
          apiCalls: 50000
        },
        features: {
          customDomain: true,
          whiteLabel: false,
          advancedReports: true,
          apiAccess: true,
          prioritySupport: true,
          smsNotifications: true,
          emailIntegration: true,
          calendarSync: true,
          multipleLocations: true,
          customBranding: true
        },
        order: 3
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Soluções customizadas para grandes empresas',
        price: {
          monthly: 299.90,
          yearly: 2879.90
        },
        limits: {
          appointments: -1, // unlimited
          clients: -1,
          users: -1,
          services: -1,
          storage: 20480, // 20GB
          apiCalls: -1
        },
        features: {
          customDomain: true,
          whiteLabel: true,
          advancedReports: true,
          apiAccess: true,
          prioritySupport: true,
          smsNotifications: true,
          emailIntegration: true,
          calendarSync: true,
          multipleLocations: true,
          customBranding: true
        },
        order: 4
      }
    ];
    
    await Plan.insertMany(plans);
    console.log('✅ Planos criados com sucesso!');
    
    return plans;
  } catch (error) {
    console.error('Erro ao criar planos:', error);
    throw error;
  }
};

module.exports = { seedPlans };
