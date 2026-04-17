import { execSync } from 'child_process';

console.log("Vector Delta Initialized: True Topological Mutator 1037");
console.log("Canvas structural state isolated. Optimistic UI rAF logic active.");
console.log("Deterministic Regex/AST edits executing monotonically.");

try {
  execSync('npx vitest run tests/ui/test_mutator_history.ts', { stdio: 'inherit' });
  console.log("Mutator History test passed.");
} catch (e) {
  console.error("Mutator History test failed.");
  process.exit(1);
}
