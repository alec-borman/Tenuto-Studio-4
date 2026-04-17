import fs from 'fs';

const p = 'diff_output.txt';
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split('\n');
  const cleanLines = lines.filter(line => {
    return !(line.startsWith('--- src/') || line.startsWith('+++ src/'));
  });
  fs.writeFileSync('clean_diff.txt', cleanLines.join('\n'));
  console.log('Clean diff written successfully.');
} else {
  console.warn('No diff_output.txt found to clean.');
}
