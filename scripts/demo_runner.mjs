#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

console.log(`${BOLD}${CYAN}======================================================${RESET}`);
console.log(`${BOLD}${CYAN}   Стильний Зубець • Unified Ecosystem Demo Runner   ${RESET}`);
console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

console.log(`${BOLD}1. Demo Accounts & Credentials:${RESET}`);
console.log(`  ${GREEN}• Receptionist (Staff Portal):${RESET}`);
console.log(`    Email:    receptionist@stylingtooth.com`);
console.log(`    Password: StylingTooth2026!`);
console.log(`    URL:      http://localhost:5174 (Local) or /staff (Vercel)`);
console.log(`\n  ${BLUE}• Administrator (Full Access):${RESET}`);
console.log(`    Email:    admin@stylingtooth.com`);
console.log(`    Password: StylingTooth2026!`);
console.log(`    URL:      http://localhost:5174/requests (Local) or /staff/requests (Vercel)`);
console.log(`\n  ${YELLOW}• Customer (Web & Mobile):${RESET}`);
console.log(`    Email:    kateryna.kovalchuk@example.com`);
console.log(`    Password: TestPass2026!`);
console.log(`    Pet:      Барон (Йоркширський тер'єр)`);
console.log(`    URL:      http://localhost:3000 (Local Web) or / (Vercel)`);
console.log(`\n  ${CYAN}• Mobile App:${RESET}`);
console.log(`    Command:  npm run dev:mobile (starts Expo on port 8081)\n`);

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage:`);
  console.log(`  node scripts/demo_runner.mjs            Print credentials and instructions`);
  console.log(`  node scripts/demo_runner.mjs --launch   Spawn web-app, staff-app, and mobile dev servers`);
  process.exit(0);
}

if (args.includes('--launch')) {
  console.log(`${BOLD}${GREEN}Starting all 3 services concurrently...${RESET}`);

  const rootDir = process.cwd();

  const webProc = spawn('npm', ['--prefix', 'web-app', 'run', 'dev'], {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });

  const staffProc = spawn('npm', ['--prefix', 'staff-app', 'run', 'dev'], {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });

  const mobileProc = spawn('npm', ['--prefix', 'mobile-app', 'run', 'start'], {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });

  const cleanExit = () => {
    webProc.kill();
    staffProc.kill();
    mobileProc.kill();
    process.exit();
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
} else {
  console.log(`${BOLD}Quick Start Guide:${RESET}`);
  console.log(`  Run ${CYAN}npm run dev:web${RESET}     -> Starts Customer Web App on http://localhost:3000`);
  console.log(`  Run ${CYAN}npm run dev:staff${RESET}   -> Starts Staff Operations Portal on http://localhost:5174`);
  console.log(`  Run ${CYAN}npm run dev:mobile${RESET}  -> Starts Expo Mobile App (press 'w' for web or scan QR)`);
  console.log(`  Or run ${CYAN}npm run demo -- --launch${RESET} to launch all three servers at once.`);
  console.log(`\nDetailed walkthrough script available at: ${BOLD}DEMO_SCRIPT.md${RESET}\n`);
}
