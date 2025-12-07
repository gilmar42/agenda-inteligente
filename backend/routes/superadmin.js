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
    req.user = { role: decoded.role || 'user' };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * Middleware para verificar se é super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

/**
 * GET /api/superadmin/dashboard
 * Dashboard com métricas globais
 */
router.get('/dashboard', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    // Total de tenants
    const totalTenants = await Tenant.countDocuments({ isActive: true });
    const activeTenants = await Tenant.countDocuments({ 
      isActive: true,
      'subscription.status': { $in: ['trial', 'active'] }
    });
    const trialTenants = await Tenant.countDocuments({
      isActive: true,
      'subscription.status': 'trial'
    });
    
    // Total de usuários
    const totalUsers = await User.countDocuments();
    
    // MRR (Monthly Recurring Revenue)
    const tenantsWithSubscriptions = await Tenant.find({
      isActive: true,
      'subscription.status': 'active'
    }).populate('subscription.planId');
    
    let mrr = 0;
    tenantsWithSubscriptions.forEach(tenant => {
      const plan = tenant.subscription.planId;
      if (plan) {
        mrr += tenant.subscription.billingCycle === 'yearly' 
          ? plan.price.yearly / 12
          : plan.price.monthly;
      }
    });
    
    // Distribuição por planos
    const planDistribution = await Tenant.aggregate([
      { $match: { isActive: true } },
      { 
        $group: {
          _id: '$subscription.planId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: '$plan' },
      {
        $project: {
          planName: '$plan.displayName',
          count: 1
        }
      }
    ]);
    
    // Novos tenants nos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newTenants = await Tenant.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Churn (cancelamentos) nos últimos 30 dias
    const churned = await Tenant.countDocuments({
      'subscription.status': 'canceled',
      updatedAt: { $gte: thirtyDaysAgo }
    });
    
    // Growth rate
    const previousMonth = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const tenantsPreviousMonth = await Tenant.countDocuments({
      createdAt: { $lte: previousMonth }
    });
    const growthRate = tenantsPreviousMonth > 0
      ? ((totalTenants - tenantsPreviousMonth) / tenantsPreviousMonth * 100).toFixed(2)
      : 0;
    
    // Receita total
    const allHistory = await SubscriptionHistory.find({
      paymentStatus: 'paid'
    });
    const totalRevenue = allHistory.reduce((sum, record) => sum + (record.amount || 0), 0);
    
    res.json({
      overview: {
        totalTenants,
        activeTenants,
        trialTenants,
        totalUsers,
        mrr: mrr.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        newTenants,
        churned,
        growthRate
      },
      planDistribution,
      churnRate: totalTenants > 0 ? ((churned / totalTenants) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

/**
 * GET /api/superadmin/tenants
 * Listar todos os tenants
 */
router.get('/tenants', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, planId, search } = req.query;
    
    const query = {};
    
    if (status) {
      query['subscription.status'] = status;
    }
    
    if (planId) {
      query['subscription.planId'] = planId;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } },
        { 'companyInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    const tenants = await Tenant.find(query)
      .populate('subscription.planId', 'displayName price')
      .populate('owner.userId', 'name email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Tenant.countDocuments(query);
    
    res.json({
      tenants,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

/**
 * GET /api/superadmin/tenants/:id
 * Detalhes de um tenant específico
 */
router.get('/tenants/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('subscription.planId')
      .populate('owner.userId');
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    // Buscar histórico
    const history = await SubscriptionHistory.find({ tenantId: tenant._id })
      .populate('planId', 'displayName')
      .sort('-createdAt')
      .limit(20);
    
    // Buscar usuários do tenant
    const users = await User.find({ /* adicionar campo tenantId no modelo User */ })
      .select('name email role createdAt');
    
    res.json({
      tenant,
      history,
      users
    });
  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar tenant' });
  }
});

/**
 * PUT /api/superadmin/tenants/:id/suspend
 * Suspender tenant
 */
router.put('/tenants/:id/suspend', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    tenant.isSuspended = true;
    tenant.suspensionReason = reason;
    tenant.subscription.status = 'suspended';
    
    await tenant.save();
    
    res.json({ message: 'Tenant suspenso com sucesso', tenant });
  } catch (error) {
    console.error('Erro ao suspender tenant:', error);
    res.status(500).json({ error: 'Erro ao suspender tenant' });
  }
});

/**
 * PUT /api/superadmin/tenants/:id/activate
 * Reativar tenant
 */
router.put('/tenants/:id/activate', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    tenant.isSuspended = false;
    tenant.suspensionReason = null;
    tenant.subscription.status = 'active';
    
    await tenant.save();
    
    res.json({ message: 'Tenant reativado com sucesso', tenant });
  } catch (error) {
    console.error('Erro ao reativar tenant:', error);
    res.status(500).json({ error: 'Erro ao reativar tenant' });
  }
});

/**
 * GET /api/superadmin/analytics
 * Análises e métricas avançadas
 */
router.get('/analytics', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Crescimento por mês
    const growthByMonth = await Tenant.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Receita por mês
    const revenueByMonth = await SubscriptionHistory.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Taxa de conversão trial -> paid
    const totalTrials = await Tenant.countDocuments({
      'subscription.status': 'trial'
    });
    
    const convertedFromTrial = await SubscriptionHistory.countDocuments({
      action: 'upgraded',
      createdAt: { $gte: start, $lte: end }
    });
    
    const conversionRate = totalTrials > 0
      ? ((convertedFromTrial / totalTrials) * 100).toFixed(2)
      : 0;
    
    res.json({
      growthByMonth,
      revenueByMonth,
      conversionRate,
      totalTrials,
      convertedFromTrial
    });
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

export default router;
