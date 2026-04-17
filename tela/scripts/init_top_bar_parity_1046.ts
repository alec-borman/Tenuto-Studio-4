import { execSync } from 'child_process';

console.log("Vector Delta Initialized: Top Bar Parity 1046");

try {
  execSync('npx vitest run tests/ui/test_editor_shell.tsx', { stdio: 'inherit' });
  console.log("Strict Form factor proven via rigid ARIA accessibility querying.");
  process.exit(0);
} catch (e) {
  console.log("Test gauntlet failed.");
  process.exit(1);
}
