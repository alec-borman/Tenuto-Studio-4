import { execSync } from 'child_process';

console.log("Vector Delta Initialized: WebAssembly/Pyodide Compiler Bridge 1052");

try {
  execSync('npx vitest run tests/ui/test_editor_shell.tsx', { stdio: 'inherit' });
  console.log("Asynchronous Sub-50ms Delta Bound");
  process.exit(0);
} catch (e) {
  process.exit(1);
}
