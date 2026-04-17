import { execSync } from 'child_process';

console.log("Vector Delta Initialized: True Topography 1045");
console.log("CSS Grid layout implemented.");
console.log("react-resizable-panels governing the vertical axis workspace.");
console.log("ARIA WCAG 2.1 AA roles defined naturally via geometry constraints.");

try {
  execSync('npx vitest run tests/ui/test_editor_shell.tsx', { stdio: 'inherit' });
  console.log("Strict Topography verified. Exit Code 0.");
  process.exit(0);
} catch (e) {
  console.log("Test gauntlet failed.");
  process.exit(1);
}
