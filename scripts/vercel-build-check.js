#!/usr/bin/env node

/**
 * Vercel Build Verification Script
 * Checks project configuration and dependencies before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Build Check Starting...\n');

const errors = [];
const warnings = [];

// Check required files
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'vercel.json',
  '.env.vercel',
  'src/app/layout.tsx',
  'src/lib/db.ts'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file: ${file}`);
  } else {
    console.log(`✅ ${file}`);
  }
});

// Check package.json configuration
console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check build scripts
  if (!packageJson.scripts?.build) {
    errors.push('Missing "build" script in package.json');
  } else if (packageJson.scripts.build.includes('--turbopack')) {
    errors.push('Build script contains --turbopack flag (not supported on Vercel)');
  } else {
    console.log('✅ Build script configured correctly');
  }
  
  if (!packageJson.scripts?.['vercel-build']) {
    warnings.push('Missing "vercel-build" script (recommended for Vercel deployment)');
  } else {
    console.log('✅ Vercel build script found');
  }
  
  // Check dependencies
  const requiredDeps = ['next', 'react', 'react-dom', 'pg'];
  const missing = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missing.length > 0) {
    errors.push(`Missing required dependencies: ${missing.join(', ')}`);
  } else {
    console.log('✅ Required dependencies found');
  }
  
} catch (error) {
  errors.push(`Error reading package.json: ${error.message}`);
}

// Check Next.js configuration
console.log('\n⚙️  Checking Next.js configuration...');
try {
  const nextConfigContent = fs.readFileSync('next.config.ts', 'utf8');
  
  if (nextConfigContent.includes('turbopack:')) {
    warnings.push('next.config.ts contains turbopack configuration (remove for Vercel)');
  }
  
  if (nextConfigContent.includes("output: 'standalone'")) {
    warnings.push("Remove 'output: standalone' from next.config.ts for Vercel deployment");
  }
  
  if (nextConfigContent.includes('cacheHandler:')) {
    warnings.push('Remove custom cacheHandler from next.config.ts for Vercel deployment');
  }
  
  console.log('✅ Next.js configuration checked');
} catch (error) {
  errors.push(`Error reading next.config.ts: ${error.message}`);
}

// Check Vercel configuration
console.log('\n🚀 Checking Vercel configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (!vercelConfig.version) {
    warnings.push('Vercel configuration missing version field');
  }
  
  if (!vercelConfig.framework) {
    warnings.push('Vercel configuration missing framework field');
  }
  
  console.log('✅ Vercel configuration found');
} catch (error) {
  errors.push(`Error reading vercel.json: ${error.message}`);
}

// Check environment variables template
console.log('\n🔐 Checking environment configuration...');
if (fs.existsSync('.env.vercel')) {
  const envContent = fs.readFileSync('.env.vercel', 'utf8');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'CLOUDINARY_CLOUD_NAME',
    'SMTP_HOST'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => 
    !envContent.includes(envVar)
  );
  
  if (missingEnvVars.length > 0) {
    warnings.push(`Environment template missing variables: ${missingEnvVars.join(', ')}`);
  } else {
    console.log('✅ Environment template contains required variables');
  }
} else {
  warnings.push('Missing .env.vercel template file');
}

// Check TypeScript configuration
console.log('\n📘 Checking TypeScript configuration...');
if (fs.existsSync('tsconfig.json')) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    if (!tsConfig.compilerOptions?.paths?.['@/*']) {
      warnings.push('Missing path mapping for @/* in tsconfig.json');
    } else {
      console.log('✅ TypeScript path mapping configured');
    }
  } catch (error) {
    warnings.push(`Error reading tsconfig.json: ${error.message}`);
  }
} else {
  errors.push('Missing tsconfig.json file');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 BUILD CHECK SUMMARY');
console.log('='.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERRORS (must fix before deployment):');
  errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (recommended to fix):');
  warnings.forEach((warning, index) => {
    console.log(`  ${index + 1}. ${warning}`);
  });
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n🎉 All checks passed! Project is ready for Vercel deployment.');
  console.log('\n📋 Next steps:');
  console.log('  1. Install Vercel CLI: npm i -g vercel');
  console.log('  2. Deploy: vercel --prod');
  console.log('  3. Configure environment variables in Vercel dashboard');
} else if (errors.length === 0) {
  console.log('\n✅ No blocking errors found. Project should deploy to Vercel.');
  console.log('⚠️  Consider addressing warnings for optimal deployment.');
} else {
  console.log('\n🚫 Deployment blocked. Fix errors before deploying to Vercel.');
  process.exit(1);
}

console.log('\n📚 For detailed deployment guide, see: docs/VERCEL_DEPLOYMENT.md');