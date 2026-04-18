import { execSync } from 'child_process';

console.log("Vector Delta Initialized: AST Pipeline 1048");

try {
  execSync('npx vitest run tests/ui/test_editor_shell.tsx', { stdio: 'inherit' });
  console.log("AST Unidirectional Pipeline Bound");
  process.exit(0);
} catch (e) {
  process.exit(1);
}
