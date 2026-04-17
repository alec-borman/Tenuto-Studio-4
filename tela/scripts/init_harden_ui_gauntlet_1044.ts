import { execSync } from 'child_process';

console.log("Vector Delta Initialized: Harden UI Gauntlet 1044");

try {
  execSync('npx vitest run tests/ui/test_editor_shell.tsx', { stdio: 'inherit' });
  console.log("Error: Test unexpectedly passed before UI was hardened.");
  process.exit(1);
} catch (e) {
  console.log("Gauntlet perfectly failed (Exit 1) catching the facade.");
  process.exit(0);
}
