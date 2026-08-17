import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = realpathSync(new URL('..', import.meta.url));
const workspace = mkdtempSync(join(tmpdir(), 'connector-action-stub-package-smoke-'));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
}

function requireSuccess(result, label) {
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${label} exited with status ${result.status ?? 'unknown'}`);
  }
}

try {
  const pack = run('npm', ['pack', '--json', '--pack-destination', workspace], { cwd: root });
  requireSuccess(pack, 'npm pack');
  const [packument] = JSON.parse(pack.stdout);
  const files = new Set(packument.files.map((file) => file.path));
  const required = [
    'package.json',
    'src/cli.js',
    'src/index.js',
    'dist/src/cli.js',
    'dist/src/index.js',
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
  if (missing.length > 0) throw new Error(`packed artifact is missing: ${missing.join(', ')}`);

  const nestedBuildFiles = [...files].filter((file) => file.startsWith('dist/src/src/'));
  if (nestedBuildFiles.length > 0) throw new Error(`packed artifact contains nested build output: ${nestedBuildFiles.join(', ')}`);

  const tarball = join(workspace, packument.filename);
  const prefix = join(workspace, 'installed');
  const install = run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--prefix', prefix, tarball]);
  requireSuccess(install, 'installing packed artifact');

  const packageRoot = join(prefix, 'node_modules', packument.name);
  const installedPackage = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const exportTarget = installedPackage.exports?.['.'];
  const binTarget = installedPackage.bin?.['connector-action-stub'];
  for (const [label, target] of [['package export', exportTarget], ['connector-action-stub bin', binTarget]]) {
    if (typeof target !== 'string' || !existsSync(resolve(packageRoot, target))) {
      throw new Error(`${label} points to a missing installed file: ${String(target)}`);
    }
  }

  const importSmoke = run(process.execPath, ['--input-type=module', '-e', [
    "import('connector-action-stub-skill').then((mod) => {",
    "  if (typeof mod.buildPlan !== 'function' || typeof mod.renderPlan !== 'function') process.exit(1);",
    "  const plan = mod.buildPlan({ name: 'installed', actions: [] });",
    "  if (plan.connector !== 'installed' || !mod.renderPlan(plan).includes('Connector dry-run plan')) process.exit(1);",
    '});',
  ].join('\n')], { cwd: prefix });
  requireSuccess(importSmoke, 'importing installed package export');

  const bin = join(prefix, 'node_modules', '.bin', 'connector-action-stub');
  const manifest = join(packageRoot, 'examples', 'crm-manifest.json');
  const commands = [
    { args: ['--help'], status: 0, stream: 'stdout', match: /Usage: connector-action-stub/u },
    { args: ['plan', manifest], status: 0, stream: 'stdout', match: /Connector dry-run plan/u },
    { args: ['fixture', manifest], status: 0, stream: 'stdout', match: /"generatedAt": "stable-fixture"/u },
    { args: ['skill', manifest], status: 0, stream: 'stdout', match: /Approval Requirements/u },
    { args: [], status: 2, stream: 'stderr', match: /Missing command/u },
    { args: ['plan', manifest, 'extra.json'], status: 2, stream: 'stderr', match: /Unexpected argument: extra\.json/u },
    { args: ['plan', join(workspace, 'missing.json')], status: 1, stream: 'stderr', match: /Failed to read manifest/u },
  ];
  for (const check of commands) {
    const result = run(bin, check.args);
    if (result.status !== check.status || !check.match.test(result[check.stream])) {
      process.stderr.write(result.stdout);
      process.stderr.write(result.stderr);
      throw new Error(`installed CLI check failed for: ${check.args.join(' ') || '<no arguments>'}`);
    }
  }

  console.log(`Package smoke ok: installed and exercised ${packument.filename}`);
} catch (error) {
  console.error(`Package smoke failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
