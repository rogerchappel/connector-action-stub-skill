import { spawnSync } from 'node:child_process';

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

console.log(`Package smoke ok: ${packument.name}-${packument.version}.tgz`);
