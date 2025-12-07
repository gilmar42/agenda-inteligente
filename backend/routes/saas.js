import express from 'express';
import Tenant from '../models/Tenant.js';
import Plan from '../models/Plan.js';
import SubscriptionHistory from '../models/SubscriptionHistory.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * GET /api/saas/plans
 * Listar todos os planos disponíveis
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort('order');
    res.json(plans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ error: 'Erro ao buscar planos' });
  }
});

/**
 * POST /api/saas/register
 * Registrar novo tenant (empresa)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      subdomain,
      email,
      password,
      planId,
      billingCycle,
      companyInfo
    } = req.body;
    
    // Validar subdomain único
    const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingTenant) {
      return res.status(400).json({ error: 'Este subdomínio já está em uso' });
    }
    
    // Validar email único
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    
    // Buscar plano
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    // Criar usuário administrador
    const user = new User({
      name,
      email,
      password, // será hasheado pelo pre-save hook
      role: 'admin'
    });
    await user.save();
    
    // Criar tenant
    const trialDays = 14;
    const tenant = new Tenant({
      name,
      slug: subdomain.toLowerCase(),
      subdomain: subdomain.toLowerCase(),
      companyInfo: {
        ...companyInfo,
        email
      },
      subscription: {
        planId: plan._id,
        status: 'trial',
        billingCycle: billingCycle || 'monthly',
        trialEndDate: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
      },
      owner: {
        userId: user._id,
        name: user.name,
        email: user.email
      },
      metrics: {
        signupSource: req.get('Referer') || 'direct'
      }
    });
    
    await tenant.save();
    
    // Registrar histórico
    await new SubscriptionHistory({
      tenantId: tenant._id,
      planId: plan._id,
      action: 'created',
      billingCycle: billingCycle || 'monthly',
      paymentStatus: 'pending',
      notes: 'Trial iniciado'
    }).save();
    
    // Gerar token
    const token = user.generateAuthToken();
    
    res.status(201).json({
      message: 'Conta criada com sucesso!',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        url: `https://${tenant.subdomain}.seudominio.com`,
        trialEndDate: tenant.subscription.trialEndDate
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token,
      plan: {
        name: plan.displayName,
        limits: plan.limits,
        features: plan.features
      }
    });
  } catch (error) {
    console.error('Erro ao registrar tenant:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

/**
 * GET /api/saas/subscription
 * Obter informações da assinatura atual
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const { tenant } = req;
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const plan = await Plan.findById(tenant.subscription.planId);
    
    res.json({
      subscription: tenant.subscription,
      plan: {
        name: plan.name,
        displayName: plan.displayName,
        price: plan.price,
        limits: plan.limits,
        features: plan.features
      },
      usage: tenant.usage,
      isInTrial: tenant.isInTrial,
      daysUntilTrialEnd: tenant.subscription.trialEndDate 
        ? Math.ceil((tenant.subscription.trialEndDate - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

/**
 * POST /api/saas/subscription/upgrade
 * Fazer upgrade do plano
 */
router.post('/subscription/upgrade', authenticateToken, async (req, res) => {
  try {
    const { tenant } = req;
    const { planId, billingCycle } = req.body;
    
    const newPlan = await Plan.findById(planId);
    if (!newPlan) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    const oldPlanId = tenant.subscription.planId;
    
    // Atualizar assinatura
    tenant.subscription.planId = newPlan._id;
    tenant.subscription.billingCycle = billingCycle || tenant.subscription.billingCycle;
    tenant.subscription.status = 'active';
    
    // Calcular próxima data de pagamento
    const cycleMonths = billingCycle === 'yearly' ? 12 : 1;
    tenant.subscription.nextPaymentDate = new Date(Date.now() + cycleMonths * 30 * 24 * 60 * 60 * 1000);
    
    await tenant.save();
    
    // Registrar histórico
    await new SubscriptionHistory({
      tenantId: tenant._id,
      planId: newPlan._id,
      previousPlanId: oldPlanId,
      action: 'upgraded',
      amount: newPlan.price[billingCycle],
      billingCycle,
      paymentStatus: 'pending'
    }).save();
    
    res.json({
      message: 'Plano atualizado com sucesso!',
      plan: {
        name: newPlan.displayName,
        limits: newPlan.limits,
        features: newPlan.features
      },
      nextPaymentDate: tenant.subscription.nextPaymentDate
    });
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

/**
 * POST /api/saas/subscription/cancel
 * Cancelar assinatura
 */
router.post('/subscription/cancel', authenticateToken, async (req, res) => {
  try {
    const { tenant } = req;
    const { reason } = req.body;
    
    tenant.subscription.status = 'canceled';
    tenant.subscription.autoRenew = false;
    tenant.subscription.endDate = tenant.subscription.nextPaymentDate || new Date();
    
    await tenant.save();
    
    // Registrar histórico
    await new SubscriptionHistory({
      tenantId: tenant._id,
      planId: tenant.subscription.planId,
      action: 'canceled',
      notes: reason || 'Cancelamento solicitado pelo usuário'
    }).save();
    
    res.json({
      message: 'Assinatura cancelada. Sua conta permanecerá ativa até o fim do período já pago.',
      endDate: tenant.subscription.endDate
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

/**
 * GET /api/saas/subscription/history
 * Obter histórico de assinaturas
 */
router.get('/subscription/history', authenticateToken, async (req, res) => {
  try {
    const { tenant } = req;
    
    const history = await SubscriptionHistory.find({ tenantId: tenant._id })
      .populate('planId', 'displayName price')
      .populate('previousPlanId', 'displayName')
      .sort('-createdAt')
      .limit(50);
    
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

/**
 * GET /api/saas/usage
 * Obter uso detalhado
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const { tenant, plan } = req;
    
    const usagePercentages = {};
    Object.keys(tenant.usage).forEach(key => {
      const limit = plan.limits[key];
      if (limit !== -1) {
        usagePercentages[key] = {
          current: tenant.usage[key],
          limit: limit,
          percentage: Math.round((tenant.usage[key] / limit) * 100)
        };
      } else {
        usagePercentages[key] = {
          current: tenant.usage[key],
          limit: 'unlimited',
          percentage: 0
        };
      }
    });
    
    res.json({
      usage: usagePercentages,
      plan: {
        name: plan.displayName,
        limits: plan.limits
      }
    });
  } catch (error) {
    console.error('Erro ao buscar uso:', error);
    res.status(500).json({ error: 'Erro ao buscar uso' });
  }
});

export default router;
