import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseManifest, inspectAction, buildPlan, buildFixture, renderSkillGuide } from '../src/index.js';
test('builds dry-run plan for connector manifest', () => { const plan = buildPlan(parseManifest(fs.readFileSync('examples/crm-manifest.json', 'utf8'))); assert.equal(plan.liveExecution, false); assert.equal(plan.actions[0].ready, true); });
test('flags missing approval fields', () => { const plan = buildPlan({ actions: [{ name: 'send' }] }); assert.ok(plan.actions[0].missing.includes('approval')); });
test('normalizes supported side effects before risk and readiness checks', () => {
  const base = { name: 'action', description: 'An action', approval: 'ask', scopes: ['crm'], sampleInput: {} };
  assert.deepEqual(inspectAction({ ...base, sideEffect: ' Read ' }), {
    name: 'action', sideEffect: 'read', risk: 'low', missing: [], ready: true
  });
  for (const sideEffect of ['Write', 'SEND']) {
    const action = inspectAction({ ...base, sideEffect, idempotencyKey: 'request-id' });
    assert.equal(action.sideEffect, sideEffect.toLowerCase());
    assert.equal(action.risk, 'high');
    assert.equal(action.ready, true);
  }
});
test('classifies delete actions as high risk', () => {
  const action = inspectAction({
    name: 'erase', description: 'Delete records', sideEffect: 'DELETE', approval: 'ask',
    scopes: ['crm'], sampleInput: {}, idempotencyKey: 'request-id'
  });
  assert.equal(action.sideEffect, 'delete');
  assert.equal(action.risk, 'high');
  assert.equal(action.ready, true);
});
test('fails closed for unsupported side effects', () => {
  const action = inspectAction({
    name: 'archive', description: 'Archive records', sideEffect: 'archive', approval: 'ask',
    scopes: ['crm'], sampleInput: {}, idempotencyKey: 'request-id'
  });
  assert.equal(action.sideEffect, 'archive');
  assert.equal(action.risk, 'high');
  assert.deepEqual(action.missing, ['sideEffect (supported: read, write, send, delete)']);
  assert.equal(action.ready, false);
});
test('generates deterministic fixtures and skill guide', () => { const manifest = parseManifest(fs.readFileSync('examples/crm-manifest.json', 'utf8')); assert.equal(buildFixture(manifest).generatedAt, 'stable-fixture'); assert.match(renderSkillGuide(manifest), /Approval Requirements/); });
test('cli exposes help and version metadata', () => { const help = spawnSync(process.execPath, ['src/cli.js', '--help'], { encoding: 'utf8' }); assert.equal(help.status, 0); assert.match(help.stdout, /connector-action-stub <plan\|fixture\|skill>/u); const version = spawnSync(process.execPath, ['src/cli.js', '--version'], { encoding: 'utf8' }); assert.equal(version.status, 0); assert.match(version.stdout, /^0\.1\.0\n$/u); });
test('cli rejects extra positional arguments', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'plan', 'examples/crm-manifest.json', 'ignored.json'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unexpected argument: ignored\.json/u);
  assert.match(result.stderr, /connector-action-stub <plan\|fixture\|skill>/u);
});
test('cli renders every documented mode from the sample manifest', () => {
  const plan = spawnSync(process.execPath, ['src/cli.js', 'plan', 'examples/crm-manifest.json'], { encoding: 'utf8' });
  assert.equal(plan.status, 0);
  assert.match(plan.stdout, /Connector dry-run plan/u);

  const fixture = spawnSync(process.execPath, ['src/cli.js', 'fixture', 'examples/crm-manifest.json'], { encoding: 'utf8' });
  assert.equal(fixture.status, 0);
  assert.equal(JSON.parse(fixture.stdout).generatedAt, 'stable-fixture');

  const guide = spawnSync(process.execPath, ['src/cli.js', 'skill', 'examples/crm-manifest.json'], { encoding: 'utf8' });
  assert.equal(guide.status, 0);
  assert.match(guide.stdout, /Approval Requirements/u);
});
