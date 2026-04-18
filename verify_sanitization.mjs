import fs from 'node:fs';

const fails = [];
if (fs.existsSync('tela/scripts')) fails.push('tela/scripts');
if (fs.existsSync('app')) fails.push('app');
if (fs.existsSync('tests/pytest.py')) fails.push('tests/pytest.py');
if (fs.existsSync('run_pytest_shim.py')) fails.push('run_pytest_shim.py');

if (fails.length > 0) {
    console.error('FATAL: Shims still exist:', fails);
    process.exit(1);
} else {
    console.log('Sanitization Verified');
    process.exit(0);
}
