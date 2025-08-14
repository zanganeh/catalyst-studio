const fs = require('fs');
const path = require('path');

/**
 * Coverage Analysis Script
 * Analyzes test coverage and identifies gaps
 */

const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');

function analyzeCoverage() {
  console.log('📊 Analyzing test coverage...\n');
  
  if (!fs.existsSync(coverageFile)) {
    console.error('❌ Coverage file not found. Run tests with coverage first.');
    console.log('   npm run test:coverage');
    process.exit(1);
  }
  
  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  const { total } = coverage;
  
  console.log('=== COVERAGE SUMMARY ===');
  console.log(`📈 Lines:      ${total.lines.pct}%     (${total.lines.covered}/${total.lines.total})`);
  console.log(`🌿 Branches:   ${total.branches.pct}%     (${total.branches.covered}/${total.branches.total})`);
  console.log(`⚡ Functions:  ${total.functions.pct}%     (${total.functions.covered}/${total.functions.total})`);
  console.log(`📝 Statements: ${total.statements.pct}%     (${total.statements.covered}/${total.statements.total})\n`);
  
  // Check thresholds
  const thresholds = {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80
  };
  
  let passed = true;
  console.log('=== THRESHOLD CHECK ===');
  
  Object.keys(thresholds).forEach(metric => {
    const actual = total[metric].pct;
    const threshold = thresholds[metric];
    const status = actual >= threshold ? '✅' : '❌';
    const gap = actual >= threshold ? '' : ` (${(threshold - actual).toFixed(1)}% gap)`;
    
    console.log(`${status} ${metric}: ${actual}% >= ${threshold}%${gap}`);
    
    if (actual < threshold) {
      passed = false;
    }
  });
  
  console.log('');
  
  // Identify files with low coverage
  const lowCoverageFiles = [];
  Object.keys(coverage).forEach(file => {
    if (file === 'total') return;
    
    const fileCoverage = coverage[file];
    if (fileCoverage.lines.pct < 80) {
      lowCoverageFiles.push({
        file: file.replace(process.cwd(), ''),
        lines: fileCoverage.lines.pct,
        branches: fileCoverage.branches.pct,
        functions: fileCoverage.functions.pct
      });
    }
  });
  
  if (lowCoverageFiles.length > 0) {
    console.log('=== FILES NEEDING ATTENTION ===');
    lowCoverageFiles
      .sort((a, b) => a.lines - b.lines)
      .slice(0, 10)
      .forEach(({ file, lines, branches, functions }) => {
        console.log(`🎯 ${file}`);
        console.log(`   Lines: ${lines}% | Branches: ${branches}% | Functions: ${functions}%`);
      });
    console.log('');
  }
  
  if (passed) {
    console.log('🎉 All coverage thresholds met!');
    process.exit(0);
  } else {
    console.log('⚠️  Coverage thresholds not met. Consider adding more tests.');
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeCoverage();
}

module.exports = { analyzeCoverage };