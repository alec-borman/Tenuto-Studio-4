import { execSync } from 'child_process';

console.log("Vector Delta Initialized: Modal Matrix 1051");

try {
  execSync('npx vitest run tests/ui/test_editor_shell.tsx', { stdio: 'inherit' });
  console.log("Modal Dialog Accessibility Matrix Verified");
  process.exit(0);
} catch (e) {
  process.exit(1);
}
