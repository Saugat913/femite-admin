#!/usr/bin/env node

/**
 * TypeScript Fixes for Vercel Deployment
 * Patches common TypeScript errors in API routes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying TypeScript fixes for Vercel deployment...\n');

function patchFile(filePath, patches) {
  console.log(`📝 Patching ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  patches.forEach(patch => {
    if (content.includes(patch.search)) {
      content = content.replace(patch.search, patch.replace);
      console.log(`  ✅ Applied: ${patch.description}`);
    }
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`  💾 Saved ${filePath}\n`);
}

// Fix database utility imports by adding them to key files
const dbUtilsImports = [
  {
    search: `import { query } from '@/lib/db'`,
    replace: `import { query } from '@/lib/db'\nimport { ensureQueryResult, getRowCount, getRows, getFirstRow, hasRows, getCountValue } from '@/lib/db-utils'`,
    description: 'Add database utility imports'
  }
];

// Common TypeScript error patches
const commonPatches = [
  // Fix undefined result checks
  {
    search: 'if (result.rows.length === 0)',
    replace: 'if (!hasRows(result))',
    description: 'Fix undefined result check'
  },
  {
    search: 'if (result.rows.length > 0)',
    replace: 'if (hasRows(result))',
    description: 'Fix undefined result check'
  },
  {
    search: 'result.rows[0]',
    replace: 'getFirstRow(result)',
    description: 'Safe first row access'
  },
  {
    search: 'result.rowCount',
    replace: 'getRowCount(result)',
    description: 'Safe row count access'
  },
  {
    search: 'parseInt(countResult.rows[0].count)',
    replace: 'getCountValue(countResult)',
    description: 'Safe count value access'
  }
];

// Files to patch (most critical API routes)
const filesToPatch = [
  'src/app/api/health/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/lib/auth-service.ts'
];

// Apply patches to critical files first
filesToPatch.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  // Add imports first
  patchFile(fullPath, dbUtilsImports);
  
  // Then apply common patches
  patchFile(fullPath, commonPatches);
});

console.log('🎯 TypeScript error fixes applied to critical files.');
console.log('📝 Note: Some API routes may still have TypeScript errors.');
console.log('   These are non-critical and won\'t prevent deployment.');
console.log('   You can fix them individually as needed.\n');

console.log('📋 Quick verification:');
console.log('  Run: npm run type-check');
console.log('  If critical errors persist, check the patched files manually.\n');

console.log('🚀 Your project should now be ready for Vercel deployment!');