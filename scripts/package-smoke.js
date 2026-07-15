import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const [packument] = JSON.parse(result.stdout);
const files = new Set(packument.files.map((file) => file.path));
const required = [
  'package.json',
  'src/cli.js',
  'src/index.js',
  'scripts/package-smoke.js',
  'docs/CLI.md',
  'examples/crm-manifest.json',
  'SKILL.md',
  'README.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
];

const missing = required.filter((file) => !files.has(file));

if (missing.length > 0) {
  console.error(`Package smoke missing expected files: ${missing.join(', ')}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (pkg.exports?.['.'] !== './src/index.js') {
  console.error('Package smoke failed: package export must expose ./src/index.js');
  process.exit(1);
}

const importSmoke = spawnSync(process.execPath, [
  '--input-type=module',
  '-e',
  "import('./src/index.js').then((mod) => { if (typeof mod.buildPlan !== 'function' || typeof mod.renderPlan !== 'function') process.exit(1); })",
], {
  encoding: 'utf8',
});
if (importSmoke.status !== 0) {
  process.stderr.write(importSmoke.stderr);
  console.error('Package smoke failed: src/index.js import did not expose the expected API');
  process.exit(importSmoke.status ?? 1);
}

const cliSmoke = spawnSync(process.execPath, [
  'src/cli.js',
  'plan',
  'examples/crm-manifest.json',
  'ignored.json',
], {
  encoding: 'utf8',
});
if (cliSmoke.status !== 2 || !cliSmoke.stderr.includes('Unexpected argument: ignored.json')) {
  console.error('Package smoke failed: CLI must reject extra positional arguments with exit code 2');
  process.exit(1);
}

console.log(`Package smoke ok: ${packument.name}-${packument.version}.tgz`);
