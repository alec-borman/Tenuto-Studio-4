import { execSync } from 'child_process';
try {
  console.log(execSync('python3 -m pytest tests/test_engrave_svg.py -v', { encoding: 'utf-8' }));
} catch(e: any) {
  console.log(e.stdout, e.stderr, e.message);
}
