import { execSync } from 'child_process';

console.log("Vector Delta Initialized: Sovereign Compiler 1041");
console.log("Compiler resurrected.");

try {
  execSync('npx tsx src/bin/check.ts --version', { stdio: 'inherit' });
  console.log("Compiler Version Verified.");
  process.exit(0);
} catch (e) {
  process.exit(1);
}
