#!/usr/bin/env node

/**
 * Production Readiness Checker
 * Verifica se o sistema está pronto para deploy em produção
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
}

const checks = {
  passed: [],
  warnings: [],
  failed: []
}

function log(type, message) {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`
  }[type]
  
  console.log(`${prefix} ${message}`)
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath)
  const fileName = path.basename(filePath)
  
  if (exists) {
    checks.passed.push(fileName)
    log('success', `${fileName} encontrado`)
    return true
  } else {
    if (required) {
      checks.failed.push(fileName)
      log('error', `${fileName} NÃO encontrado (obrigatório)`)
    } else {
      checks.warnings.push(fileName)
      log('warning', `${fileName} NÃO encontrado (opcional)`)
    }
    return false
  }
}

function checkEnvVariables(envPath) {
  if (!fs.existsSync(envPath)) {
    log('error', '.env não encontrado')
    checks.failed.push('.env configuration')
    return false
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const requiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'NODE_ENV',
    'PORT'
  ]

  const importantVars = [
    'MONGODB_URI',
    'CORS_ORIGIN'
  ]

  let allGood = true

  console.log(`\n${colors.blue}Verificando variáveis de ambiente:${colors.reset}`)
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm')
    const hasVar = regex.test(envContent)
    
    if (hasVar) {
      // Check if it's using default/weak value
      const match = envContent.match(new RegExp(`${varName}=(.+)`, 'm'))
      const value = match ? match[1].trim() : ''
      
      if (value.includes('change') || value.includes('dev-') || value.includes('your-') || value.length < 20) {
        log('warning', `${varName} está configurado mas parece usar valor padrão/fraco`)
        checks.warnings.push(`${varName} weak value`)
      } else {
        log('success', `${varName} configurado`)
        checks.passed.push(`${varName}`)
      }
    } else {
      log('error', `${varName} NÃO configurado (obrigatório)`)
      checks.failed.push(`${varName}`)
      allGood = false
    }
  })

  importantVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm')
    const hasVar = regex.test(envContent)
    
    if (!hasVar) {
      log('warning', `${varName} NÃO configurado (importante para produção)`)
      checks.warnings.push(`${varName}`)
    } else {
      log('success', `${varName} configurado`)
      checks.passed.push(`${varName}`)
    }
  })

  return allGood
}

function checkPackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) {
    log('error', 'package.json não encontrado')
    return false
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  
  console.log(`\n${colors.blue}Verificando package.json:${colors.reset}`)
  
  if (pkg.scripts && pkg.scripts.start) {
    log('success', 'Script "start" configurado')
    checks.passed.push('start script')
  } else {
    log('error', 'Script "start" NÃO configurado')
    checks.failed.push('start script')
  }

  if (pkg.engines && pkg.engines.node) {
    log('success', `Node.js version especificada: ${pkg.engines.node}`)
    checks.passed.push('node version')
  } else {
    log('warning', 'Node.js version não especificada em engines')
    checks.warnings.push('node version')
  }

  return true
}

async function main() {
  console.log(`\n${colors.magenta}╔═══════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.magenta}║  PRODUCTION READINESS CHECKER             ║${colors.reset}`)
  console.log(`${colors.magenta}║  Agenda Inteligente                       ║${colors.reset}`)
  console.log(`${colors.magenta}╚═══════════════════════════════════════════╝${colors.reset}\n`)

  // Backend checks
  console.log(`${colors.blue}═══ BACKEND ═══${colors.reset}`)
  const backendPath = path.join(__dirname, '..')
  
  checkFile(path.join(backendPath, 'package.json'), true)
  checkFile(path.join(backendPath, 'src/server.js'), true)
  checkFile(path.join(backendPath, '.env.example'), true)
  checkFile(path.join(backendPath, 'Dockerfile'), false)
  checkFile(path.join(backendPath, 'ecosystem.config.js'), false)
  
  checkPackageJson(path.join(backendPath, 'package.json'))
  checkEnvVariables(path.join(backendPath, '.env'))

  // Frontend checks
  console.log(`\n${colors.blue}═══ FRONTEND ═══${colors.reset}`)
  const frontendPath = path.join(__dirname, '../../frontend')
  
  if (fs.existsSync(frontendPath)) {
    checkFile(path.join(frontendPath, 'package.json'), true)
    checkFile(path.join(frontendPath, 'index.html'), true)
    checkFile(path.join(frontendPath, 'vite.config.ts'), true)
    checkFile(path.join(frontendPath, 'Dockerfile'), false)
    checkFile(path.join(frontendPath, 'nginx.conf'), false)
  } else {
    log('warning', 'Diretório frontend não encontrado')
  }

  // Root files
  console.log(`\n${colors.blue}═══ ROOT FILES ═══${colors.reset}`)
  const rootPath = path.join(__dirname, '../..')
  
  checkFile(path.join(rootPath, '.gitignore'), true)
  checkFile(path.join(rootPath, 'README.md'), false)
  checkFile(path.join(rootPath, 'docker-compose.yml'), false)
  checkFile(path.join(rootPath, 'DEPLOYMENT.md'), false)

  // Summary
  console.log(`\n${colors.magenta}═══════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.magenta}RESUMO:${colors.reset}`)
  console.log(`${colors.green}Passed:   ${checks.passed.length}${colors.reset}`)
  console.log(`${colors.yellow}Warnings: ${checks.warnings.length}${colors.reset}`)
  console.log(`${colors.red}Failed:   ${checks.failed.length}${colors.reset}`)
  
  if (checks.failed.length === 0 && checks.warnings.length === 0) {
    console.log(`\n${colors.green}✓ Sistema pronto para produção!${colors.reset}`)
    process.exit(0)
  } else if (checks.failed.length === 0) {
    console.log(`\n${colors.yellow}⚠ Sistema quase pronto. Revise os warnings.${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`\n${colors.red}✗ Sistema NÃO está pronto. Corrija os erros.${colors.reset}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(`${colors.red}Erro ao executar verificação:${colors.reset}`, err)
  process.exit(1)
})
