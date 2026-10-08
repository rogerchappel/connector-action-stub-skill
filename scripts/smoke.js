import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspace = mkdtempSync(join(tmpdir(), 'connector-action-stub-smoke-'));

function run(args, label) {
  const result = spawnSync(process.execPath, ['src/cli.js', ...args], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${label} exited with status ${result.status ?? 'unknown'}`);
  }
  return result.stdout;
}

try {
  run(['--help'], 'help');
  run(['--version'], 'version');
  const manifest = 'examples/crm-manifest.json';
  const plan = join(workspace, 'plan.md');
  const fixture = join(workspace, 'fixture.json');
  const guide = join(workspace, 'guide.md');
  writeFileSync(plan, run(['plan', manifest], 'plan'));
  writeFileSync(fixture, run(['fixture', manifest], 'fixture'));
  writeFileSync(guide, run(['skill', manifest], 'skill guide'));
  if (!readFileSync(plan, 'utf8').includes('Connector dry-run plan')) throw new Error('plan output did not match');
  if (!readFileSync(fixture, 'utf8').includes('stable-fixture')) throw new Error('fixture output did not match');
  if (!readFileSync(guide, 'utf8').includes('Approval Requirements')) throw new Error('skill guide output did not match');
  console.log('Smoke checks passed');
} catch (error) {
  console.error(`Smoke check failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
