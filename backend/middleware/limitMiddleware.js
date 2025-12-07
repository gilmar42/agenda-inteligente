/**
 * Middleware para verificar limites do plano
 */
const checkLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const { tenant, plan } = req;
      
      if (!tenant || !plan) {
        return res.status(403).json({ 
          error: 'Tenant não identificado' 
        });
      }
      
      const limit = plan.limits[resource];
      
      // Se unlimited (-1), permitir
      if (limit === -1) {
        return next();
      }
      
      // Verificar se atingiu o limite
      if (tenant.usage[resource] >= limit) {
        return res.status(403).json({ 
          error: 'Limite atingido',
          message: `Você atingiu o limite de ${limit} ${resource} do seu plano`,
          currentUsage: tenant.usage[resource],
          limit: limit,
          planName: plan.displayName,
          upgradeUrl: '/settings/billing'
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar limite:', error);
      res.status(500).json({ error: 'Erro ao verificar limite' });
    }
  };
};

/**
 * Middleware para verificar se tem acesso a uma feature
 */
const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const { plan } = req;
      
      if (!plan) {
        return res.status(403).json({ 
          error: 'Plano não identificado' 
        });
      }
      
      if (!plan.features[featureName]) {
        return res.status(403).json({ 
          error: 'Feature não disponível',
          message: `Esta funcionalidade não está disponível no seu plano`,
          feature: featureName,
          planName: plan.displayName,
          upgradeUrl: '/settings/billing'
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar feature:', error);
      res.status(500).json({ error: 'Erro ao verificar feature' });
    }
  };
};

/**
 * Middleware para incrementar uso após ação bem-sucedida
 */
const incrementUsage = (resource, amount = 1) => {
  return async (req, res, next) => {
    try {
      const { tenant } = req;
      
      if (tenant) {
        await tenant.incrementUsage(resource, amount);
      }
      
      next();
    } catch (error) {
      console.error('Erro ao incrementar uso:', error);
      next(); // Não bloquear a requisição se houver erro
    }
  };
};

module.exports = {
  checkLimit,
  checkFeature,
  incrementUsage
};
