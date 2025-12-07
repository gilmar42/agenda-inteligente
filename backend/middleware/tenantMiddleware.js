const Tenant = require('../models/Tenant');

/**
 * Middleware de multi-tenancy
 * Identifica o tenant pela URL (subdomínio ou domínio customizado)
 * e injeta no contexto da requisição
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    const host = req.hostname || req.get('host');
    
    // Extrair subdomínio ou domínio
    let tenant = null;
    
    // Verificar se é domínio customizado
    tenant = await Tenant.findOne({ 
      domain: host,
      isActive: true,
      isSuspended: false
    }).populate('subscription.planId');
    
    // Se não encontrou, tentar por subdomínio
    if (!tenant) {
      const subdomain = host.split('.')[0];
      
      // Ignorar subdomínios do sistema (www, api, admin, etc)
      const systemSubdomains = ['www', 'api', 'admin', 'app', 'localhost'];
      
      if (!systemSubdomains.includes(subdomain)) {
        tenant = await Tenant.findOne({ 
          subdomain,
          isActive: true,
          isSuspended: false
        }).populate('subscription.planId');
      }
    }
    
    // Verificar se tenant foi encontrado
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant não encontrado',
        message: 'Esta empresa não existe ou está inativa'
      });
    }
    
    // Verificar status da assinatura
    if (!tenant.hasActiveSubscription) {
      return res.status(403).json({ 
        error: 'Assinatura inativa',
        message: 'A assinatura desta empresa está inativa ou expirada',
        status: tenant.subscription.status
      });
    }
    
    // Verificar se trial expirou
    if (tenant.subscription.status === 'trial' && tenant.subscription.trialEndDate) {
      if (new Date() > tenant.subscription.trialEndDate) {
        tenant.subscription.status = 'expired';
        await tenant.save();
        
        return res.status(403).json({ 
          error: 'Trial expirado',
          message: 'O período de teste desta empresa expirou'
        });
      }
    }
    
    // Injetar tenant e plan no contexto da requisição
    req.tenant = tenant;
    req.plan = tenant.subscription.planId;
    
    // Atualizar última atividade
    tenant.metrics.lastActivityDate = new Date();
    await tenant.save();
    
    next();
  } catch (error) {
    console.error('Erro no middleware de tenant:', error);
    res.status(500).json({ error: 'Erro ao identificar tenant' });
  }
};

/**
 * Middleware opcional - permite requests sem tenant (para rotas públicas)
 */
const optionalTenantMiddleware = async (req, res, next) => {
  try {
    const host = req.hostname || req.get('host');
    
    let tenant = await Tenant.findOne({ 
      domain: host,
      isActive: true 
    }).populate('subscription.planId');
    
    if (!tenant) {
      const subdomain = host.split('.')[0];
      const systemSubdomains = ['www', 'api', 'admin', 'app', 'localhost'];
      
      if (!systemSubdomains.includes(subdomain)) {
        tenant = await Tenant.findOne({ 
          subdomain,
          isActive: true 
        }).populate('subscription.planId');
      }
    }
    
    if (tenant) {
      req.tenant = tenant;
      req.plan = tenant.subscription.planId;
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware opcional de tenant:', error);
    next();
  }
};

module.exports = {
  tenantMiddleware,
  optionalTenantMiddleware
};
