#!/usr/bin/env node

/**
 * Voice Audit Script
 *
 * Checks content files for voice consistency following PRD 42 patterns.
 * Flags forbidden patterns (critical/judgmental language) and checks for required patterns.
 *
 * Usage: node audit-voice.js /path/to/repo
 */

const fs = require('fs');
const path = require('path');

// Forbidden patterns that violate voice guidelines
const FORBIDDEN_PATTERNS = [
  {
    regex: /most coaches (make|do|get|have|struggle with|fail)/gi,
    description: "Critical of other coaches ('most coaches make...')",
    severity: 'high'
  },
  {
    regex: /\d+%\s+of\s+(coaches|players|teams|clubs)/gi,
    description: "Using statistics about coaches/players critically",
    severity: 'high'
  },
  {
    regex: /\b(useless|terrible|destroying|disaster|glorified)\b/gi,
    description: "Harsh/judgmental language",
    severity: 'high'
  },
  {
    regex: /you\s+(must|need to|should never|have to|can't|don't)/gi,
    description: "Commanding/absolute language",
    severity: 'medium'
  },
  {
    regex: /the problem with/gi,
    description: "Problem-bashing tone",
    severity: 'medium'
  },
  {
    regex: /unlike other (coaches|courses|programs|methods)/gi,
    description: "Comparing to competitors",
    severity: 'high'
  },
  {
    regex: /\b(never|always|only way|must|can't)\b/gi,
    description: "Absolute statements (football has grey areas)",
    severity: 'medium'
  },
  {
    regex: /after (training|coaching|working with) \d+\+?\s+(players|coaches|teams)/gi,
    description: "Resume-recitation credential statements",
    severity: 'medium'
  },
  {
    regex: /(stop|quit|never) (doing|using|teaching|coaching)/gi,
    description: "Commanding negative instructions",
    severity: 'medium'
  }
];

// Required patterns that should be present (Kevin's authentic voice)
const REQUIRED_PATTERNS = [
  {
    regex: /have you ever/gi,
    description: "Empathy hook ('Have you ever...')",
    weight: 2
  },
  {
    regex: /do you struggle with/gi,
    description: "Problem awareness question",
    weight: 2
  },
  {
    regex: /(i've found|i've noticed|in my experience|for me|i think)/gi,
    description: "Personal experience framing",
    weight: 3
  },
  {
    regex: /(here's what|something i)/gi,
    description: "Helpful sharing tone",
    weight: 2
  },
  {
    regex: /(tends to|often|might|seems to|can be)/gi,
    description: "Nuanced language (avoiding absolutes)",
    weight: 1
  }
];

// File patterns to check
const FILE_PATTERNS = [
  '**/emails/**/*.tsx',
  '**/emails/**/*.ts',
  '**/lib/*prompt*.ts',
  '**/lib/*system*.ts',
  '**/*-copy.ts',
  '**/blog/**/*.tsx',
  '**/blog/**/*.md',
  '**/app/**/page.tsx',
  '**/components/**/*-text.tsx'
];

// Extensions to scan
const VALID_EXTENSIONS = ['.tsx', '.ts', '.md', '.js', '.jsx'];

/**
 * Check if a file path matches any of the patterns
 */
function matchesPattern(filePath, patterns) {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  return patterns.some(pattern => {
    // Convert glob pattern to regex
    let regex = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*\*/g, '§§')  // Temporarily replace **
      .replace(/\*/g, '[^/]*')  // * matches anything except /
      .replace(/§§/g, '.*');   // ** matches anything including /

    // Anchor the pattern
    regex = '^' + regex + '$';

    return new RegExp(regex).test(normalizedPath);
  });
}

/**
 * Recursively find all files matching patterns
 */
function findFiles(dir, patterns, results = [], rootDir = null) {
  if (!rootDir) rootDir = dir;

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules, .next, .git
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findFiles(filePath, patterns, results, rootDir);
      }
    } else {
      const ext = path.extname(file);
      if (VALID_EXTENSIONS.includes(ext)) {
        const relativePath = path.relative(rootDir, filePath);
        if (matchesPattern(relativePath, patterns)) {
          results.push(filePath);
        }
      }
    }
  }

  return results;
}

/**
 * Scan a file for forbidden and required patterns
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const violations = [];
  const required = [];

  // Check each line for forbidden patterns
  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern.regex);
      if (matches) {
        violations.push({
          line: index + 1,
          text: line.trim(),
          pattern: pattern.description,
          severity: pattern.severity,
          match: matches[0]
        });
      }
    });

    // Check for required patterns
    REQUIRED_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern.regex);
      if (matches) {
        required.push({
          line: index + 1,
          pattern: pattern.description,
          weight: pattern.weight,
          match: matches[0]
        });
      }
    });
  });

  return {
    filePath,
    totalLines: lines.length,
    violations,
    required,
    content
  };
}

/**
 * Calculate voice score
 */
function calculateScore(results) {
  const totalLines = results.reduce((sum, r) => sum + r.totalLines, 0);
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const highSeverityViolations = results.reduce(
    (sum, r) => sum + r.violations.filter(v => v.severity === 'high').length,
    0
  );
  const totalRequired = results.reduce((sum, r) => sum + r.required.length, 0);
  const requiredWeight = results.reduce(
    (sum, r) => sum + r.required.reduce((s, req) => s + req.weight, 0),
    0
  );

  const violationsPerKLines = totalLines > 0 ? (totalViolations / totalLines) * 1000 : 0;
  const requiredPerKLines = totalLines > 0 ? (requiredWeight / totalLines) * 1000 : 0;

  // Pass criteria:
  // - Less than 5 violations per 1000 lines
  // - No more than 2 high severity violations total
  // - At least 2 required patterns per 1000 lines
  const pass = violationsPerKLines < 5 &&
                highSeverityViolations <= 2 &&
                requiredPerKLines >= 2;

  return {
    totalLines,
    totalViolations,
    highSeverityViolations,
    violationsPerKLines: violationsPerKLines.toFixed(2),
    totalRequired,
    requiredWeight,
    requiredPerKLines: requiredPerKLines.toFixed(2),
    pass
  };
}

/**
 * Generate report
 */
function generateReport(results, score, repoPath) {
  console.log('\n' + '='.repeat(80));
  console.log('VOICE AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`\nRepository: ${repoPath}`);
  console.log(`Files scanned: ${results.length}`);
  console.log(`Total lines: ${score.totalLines.toLocaleString()}`);

  // Overall score
  console.log('\n' + '-'.repeat(80));
  console.log('OVERALL SCORE');
  console.log('-'.repeat(80));
  console.log(`Status: ${score.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Violations: ${score.totalViolations} (${score.violationsPerKLines} per 1K lines)`);
  console.log(`High severity: ${score.highSeverityViolations}`);
  console.log(`Required patterns: ${score.totalRequired} (${score.requiredPerKLines} per 1K lines)`);

  // Violations by file
  const filesWithViolations = results.filter(r => r.violations.length > 0);

  if (filesWithViolations.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('VIOLATIONS FOUND');
    console.log('-'.repeat(80));

    filesWithViolations.forEach(result => {
      console.log(`\n📄 ${path.relative(repoPath, result.filePath)}`);
      console.log(`   ${result.violations.length} violation(s) found:\n`);

      result.violations.forEach((v, index) => {
        const severityIcon = v.severity === 'high' ? '🔴' : '🟡';
        console.log(`   ${severityIcon} Line ${v.line}: ${v.pattern}`);
        console.log(`      Match: "${v.match}"`);
        console.log(`      Context: ${v.text.substring(0, 100)}${v.text.length > 100 ? '...' : ''}`);
        if (index < result.violations.length - 1) console.log('');
      });
    });
  } else {
    console.log('\n✅ No violations found!');
  }

  // Required patterns summary
  console.log('\n' + '-'.repeat(80));
  console.log('REQUIRED PATTERNS');
  console.log('-'.repeat(80));

  const filesWithRequired = results.filter(r => r.required.length > 0);

  if (filesWithRequired.length > 0) {
    console.log(`\n✅ Found in ${filesWithRequired.length} file(s):\n`);

    // Group by pattern type
    const patternCounts = {};
    results.forEach(r => {
      r.required.forEach(req => {
        patternCounts[req.pattern] = (patternCounts[req.pattern] || 0) + 1;
      });
    });

    Object.entries(patternCounts).forEach(([pattern, count]) => {
      console.log(`   ${pattern}: ${count} occurrence(s)`);
    });
  } else {
    console.log('\n⚠️  No required patterns found. Consider adding more authentic voice.');
  }

  // Recommendations
  console.log('\n' + '-'.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('-'.repeat(80));

  if (score.highSeverityViolations > 0) {
    console.log('\n🔴 HIGH PRIORITY: Fix high severity violations first');
    console.log('   - Remove critical/judgmental language');
    console.log('   - Avoid comparing to other coaches/methods');
    console.log('   - Replace harsh words with helpful alternatives');
  }

  if (score.violationsPerKLines >= 5) {
    console.log('\n🟡 MEDIUM PRIORITY: Reduce commanding language');
    console.log('   - Replace "you must" with "I\'ve found"');
    console.log('   - Replace "never/always" with "tends to/often"');
    console.log('   - Use questions instead of commands');
  }

  if (score.requiredPerKLines < 2) {
    console.log('\n💡 IMPROVEMENT: Add more authentic voice patterns');
    console.log('   - Start with empathy questions ("Have you ever...")');
    console.log('   - Share personal experience ("I\'ve noticed...")');
    console.log('   - Use helpful framing ("Here\'s what...")');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`FINAL RESULT: ${score.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(80) + '\n');

  return score.pass ? 0 : 1;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node audit-voice.js /path/to/repo');
    process.exit(1);
  }

  const repoPath = path.resolve(args[0]);

  if (!fs.existsSync(repoPath)) {
    console.error(`Error: Repository path does not exist: ${repoPath}`);
    process.exit(1);
  }

  console.log('🔍 Scanning repository for voice consistency...\n');
  console.log(`Path: ${repoPath}`);
  console.log(`Patterns: ${FILE_PATTERNS.join(', ')}\n`);

  // Find all matching files
  const files = findFiles(repoPath, FILE_PATTERNS);

  if (files.length === 0) {
    console.log('⚠️  No files found matching patterns.');
    process.exit(0);
  }

  console.log(`Found ${files.length} file(s) to scan...\n`);

  // Scan all files
  const results = files.map(scanFile);

  // Calculate score and generate report
  const score = calculateScore(results);
  const exitCode = generateReport(results, score, repoPath);

  process.exit(exitCode);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { scanFile, calculateScore, findFiles };
