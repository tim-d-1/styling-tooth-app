import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

const IGNORED_PATHS = [
  /__mocks__/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /src[/\\]config[/\\]/,
];

const AUDIT_RULES = [
  {
    id: 'MOCK_DATA_ARRAY',
    name: 'Hardcoded Mock / Default Data Array or Object',
    regex: /(?:const|let|var)\s+(?:default|mock)(?:Transactions|Procedures|SavedMethods|Address|FormData|Visits|Pets|LoyaltyData|Schedule)\b/g,
    message: 'Remove embedded mock dataset from production code. Use empty state [] or central config.',
  },
  {
    id: 'PLACEHOLDER_NAME',
    name: 'Hardcoded Mock Identity Name',
    regex: /['"]Катерина Ковальчук['"]/g,
    message: 'Do not use hardcoded user mock identity. Default to real profile name or generic fallback.',
  },
  {
    id: 'PLACEHOLDER_EMAIL',
    name: 'Hardcoded Mock Email Address',
    regex: /['"][a-zA-Z0-9._%+-]+@(?:example\.com|gmail\.com)['"]/g,
    message: 'Do not hardcode placeholder email address in production component state.',
  },
  {
    id: 'PLACEHOLDER_PHONE',
    name: 'Hardcoded Mock Phone Number',
    regex: /\+380\s*\(\d{2}\)\s*123[\s-]*45[\s-]*67/g,
    message: 'Do not hardcode placeholder phone number in production component state.',
  },
  {
    id: 'PLACEHOLDER_STREET',
    name: 'Hardcoded Mock Address Street',
    regex: /['"]вул\.\s*Хрещатик,\s*15['"]/g,
    message: 'Do not hardcode placeholder street in component defaults. Default to empty string.',
  },
  {
    id: 'MAGIC_LOYALTY_THRESHOLD',
    name: 'Inline Magic Loyalty Tier Threshold',
    regex: /(?:completedSpend|lifetimeSpend)\s*>=\s*(?:15000|5000|2000)/g,
    message: 'Import and use resolveLoyaltyTier() from @/config/loyalty instead of inline magic numbers.',
  },
];

function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (/\.[tj]sx?$/.test(entry.name)) {
      const isIgnored = IGNORED_PATHS.some((pattern) => pattern.test(fullPath));
      if (!isIgnored) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  for (const rule of AUDIT_RULES) {
    rule.regex.lastIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (rule.regex.test(line)) {
        findings.push({
          ruleId: rule.id,
          ruleName: rule.name,
          line: i + 1,
          snippet: line.trim(),
          message: rule.message,
        });
      }
      rule.regex.lastIndex = 0;
    }
  }

  return findings;
}

function main() {
  const files = getFiles(SRC_DIR);
  let totalIssues = 0;
  const results = [];

  for (const file of files) {
    const relativePath = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');
    const issues = auditFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      results.push({ file: relativePath, issues });
    }
  }

  console.log('\n=== Placeholders & Hardcoded Data Audit ===');
  console.log(`Scanned ${files.length} production source files in src/ (ignoring tests and config).\n`);

  if (totalIssues === 0) {
    console.log('✓ PASS: No hardcoded mock datasets, placeholder identities, or magic loyalty thresholds found.\n');
    process.exit(0);
  }

  console.error(`✗ FAIL: Found ${totalIssues} issue(s) across ${results.length} file(s):\n`);

  for (const { file, issues } of results) {
    console.error(`File: ${file}`);
    for (const issue of issues) {
      console.error(`  Line ${issue.line} [${issue.ruleId}]: ${issue.ruleName}`);
      console.error(`    Code: ${issue.snippet}`);
      console.error(`    Fix:  ${issue.message}`);
    }
    console.error('');
  }

  process.exit(1);
}

main();
