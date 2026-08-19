import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseManifest, inspectAction, buildPlan, renderPlan, buildFixture, renderSkillGuide } from '../src/index.js';
test('builds dry-run plan for connector manifest', () => { const plan = buildPlan(parseManifest(fs.readFileSync('examples/crm-manifest.json', 'utf8'))); assert.equal(plan.liveExecution, false); assert.equal(plan.actions[0].ready, true); });
test('rejects manifest action entries that are not objects', () => {
  for (const [index, value] of [null, 'read', 42, true, []].entries()) {
    assert.throws(
      () => parseManifest(JSON.stringify({ actions: [value] })),
      new Error(`manifest actions[0] must be a non-null object (received ${['null', 'string', 'number', 'boolean', 'array'][index]})`)
    );
  }
});
test('rejects manifests with no actions before generating output', () => {
  assert.throws(
    () => parseManifest(JSON.stringify({ name: 'empty-connector', actions: [] })),
    new Error('manifest actions array must not be empty')
  );
});
test('keeps manifest-controlled text inside Markdown table cells', () => {
  const output = renderPlan({
    connector: 'demo|connector\nsecond line',
    liveExecution: false,
    actions: [{
      name: 'read|records\r\nnext',
      risk: 'low|risk',
      ready: false,
      missing: ['approval|owner', 'sample\ninput']
    }]
  });
  assert.match(output, /Connector: demo\\\|connector<br>second line/u);
  assert.match(output, /\| read\\\|records<br>next \| low\\\|risk \| missing approval\\\|owner, sample<br>input \|/u);
  assert.equal(output.split('\n').filter((line) => line.startsWith('| read')).length, 1);
});
test('flags missing approval fields', () => { const plan = buildPlan({ actions: [{ name: 'send' }] }); assert.ok(plan.actions[0].missing.includes('approval (non-empty string)')); });
test('marks malformed action fields unready', () => {
  const malformed = {
    name: { bad: true },
    description: 7,
    sideEffect: 'read',
    approval: {},
    scopes: [null, '', '  ', 42],
    sampleInput: 'not-an-object',
    idempotencyKey: []
  };
  assert.deepEqual(inspectAction(malformed), {
    name: '<unnamed>',
    sideEffect: 'read',
    risk: 'low',
    missing: [
      'name (non-empty string)',
      'description (non-empty string)',
      'approval (non-empty string)',
      'scopes (non-empty array of non-empty strings)',
      'sampleInput (object)',
      'idempotencyKey (non-empty string when provided)'
    ],
    ready: false
  });
});
test('requires a non-empty string idempotency key for non-read actions', () => {
  const base = {
    name: 'send', description: 'Send a message', sideEffect: 'send',
    approval: 'required', scopes: ['messages.send'], sampleInput: {}
  };
  for (const idempotencyKey of [undefined, '', '  ', 42, {}]) {
    const action = inspectAction({ ...base, idempotencyKey });
    assert.ok(action.missing.includes('idempotencyKey (non-empty string)'));
    assert.equal(action.ready, false);
  }
});
test('rejects approval denial metadata for high-risk actions', () => {
  const base = {
    name: 'send', description: 'Send a message', sideEffect: 'send',
    scopes: ['messages.send'], sampleInput: {}, idempotencyKey: 'request-id'
  };
  for (const approval of [
    'not required', '  NOT   REQUIRED  ', 'approval not required',
    'no approval required', 'none', 'absent', 'approval is absent',
    'denied', 'false', 'no', 'ask', 'approval handled elsewhere',
    'this prose does not affirm a human approval requirement'
  ]) {
    const action = inspectAction({ ...base, approval });
    assert.ok(action.missing.includes('approval (must affirm an explicit human approval requirement for write, send, and delete actions)'));
    assert.equal(action.ready, false);
  }
});
test('accepts affirmative human approval metadata for high-risk actions', () => {
  const base = {
    name: 'send', description: 'Send a message', sideEffect: 'send',
    scopes: ['messages.send'], sampleInput: {}, idempotencyKey: 'request-id'
  };
  for (const approval of [
    'Require human approval',
    '  REQUIRES   EXPLICIT   HUMAN   APPROVAL before sending. ',
    'Human approval required: show the recipient and message.',
    'Human approval is required before live execution.',
    'Must obtain human approval before sending.',
    'Must receive explicit human approval before sending.'
  ]) {
    const action = inspectAction({ ...base, approval });
    assert.deepEqual(action.missing, []);
    assert.equal(action.ready, true);
  }
});
test('allows contextual approval metadata for reads', () => {
  const action = inspectAction({
    name: 'lookup', description: 'Read a contact', sideEffect: 'read',
    approval: '  NOT   REQUIRED  ', scopes: ['contacts.read'], sampleInput: {}
  });
  assert.equal(action.ready, true);
  assert.deepEqual(action.missing, []);
});
test('normalizes supported side effects before risk and readiness checks', () => {
  const base = { name: 'action', description: 'An action', approval: 'Require human approval', scopes: ['crm'], sampleInput: {} };
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
    name: 'erase', description: 'Delete records', sideEffect: 'DELETE', approval: 'Require human approval',
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
test('generates stable, distinct response IDs for every action', () => {
  const action = {
    name: 'same', description: 'Read records', sideEffect: 'read',
    approval: 'not required', scopes: ['records.read'], sampleInput: {}
  };
  const manifest = { name: 'duplicate-actions', actions: [action, { ...action, sampleInput: { page: 2 } }] };

  const first = buildFixture(manifest);
  const second = buildFixture(manifest);

  assert.deepEqual(first, second);
  assert.deepEqual(first.responses.map(({ response }) => response.id), ['dryrun-same-1', 'dryrun-same-2']);
  assert.equal(new Set(first.responses.map(({ response }) => response.id)).size, 2);

  const single = buildFixture({ name: 'single-action', actions: [action] });
  assert.equal(single.responses[0].response.id, 'dryrun-same-1');
});
test('fixture generation rejects actions that are not ready', () => {
  const manifest = {
    actions: [{
      name: 'archive', description: 'Archive records', sideEffect: 'archive',
      approval: 'ask', scopes: ['crm'], sampleInput: {}, idempotencyKey: 'request-id'
    }]
  };
  assert.throws(() => buildFixture(manifest), /Cannot generate fixture.*archive.*sideEffect/u);
});
test('fixture generation rejects high-risk actions that deny approval', () => {
  const manifest = {
    actions: [{
      name: 'send', description: 'Send a message', sideEffect: 'send',
      approval: ' Approval   Not Required ', scopes: ['messages.send'],
      sampleInput: { text: 'hi' }, idempotencyKey: 'request-id'
    }]
  };
  assert.throws(
    () => buildFixture(manifest),
    /Cannot generate fixture.*send.*must affirm an explicit human approval requirement/u
  );
});
test('cli exposes help and version metadata', () => { const help = spawnSync(process.execPath, ['src/cli.js', '--help'], { encoding: 'utf8' }); assert.equal(help.status, 0); assert.match(help.stdout, /connector-action-stub <plan\|fixture\|skill>/u); const version = spawnSync(process.execPath, ['src/cli.js', '--version'], { encoding: 'utf8' }); assert.equal(version.status, 0); assert.match(version.stdout, /^0\.1\.0\n$/u); });
test('cli requires both a mode and manifest path', () => {
  for (const args of [[], ['plan']]) {
    const result = spawnSync(process.execPath, ['src/cli.js', ...args], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Missing (command|manifest path)/u);
    assert.match(result.stderr, /connector-action-stub <plan\|fixture\|skill>/u);
  }
});
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
test('cli reports malformed and unready manifests without rendering output', () => {
  const malformed = spawnSync(process.execPath, ['src/cli.js', 'plan', 'tests/fixtures/malformed.json'], { encoding: 'utf8' });
  assert.equal(malformed.status, 1);
  assert.equal(malformed.stdout, '');
  assert.match(malformed.stderr, /Failed to read manifest/u);

  const unready = spawnSync(process.execPath, ['src/cli.js', 'fixture', 'tests/fixtures/unready-manifest.json'], { encoding: 'utf8' });
  assert.equal(unready.status, 1);
  assert.equal(unready.stdout, '');
  assert.match(unready.stderr, /Cannot generate fixture.*archive.*sideEffect/u);
});
test('cli fails closed for high-risk actions without affirmative human approval', (context) => {
  for (const [label, approval] of [
    ['denied', 'denied'], ['false', 'false'], ['no', 'no'],
    ['ambiguous', 'a reviewer might look at this later']
  ]) {
    const path = `/tmp/connector-action-stub-${process.pid}-approval-${label}.json`;
    fs.writeFileSync(path, JSON.stringify({
      name: 'messages',
      actions: [{
        name: 'send', description: 'Send a message', sideEffect: 'send', approval,
        scopes: ['messages.send'], sampleInput: { text: 'hi' }, idempotencyKey: 'request-id'
      }]
    }));
    context.after(() => fs.rmSync(path, { force: true }));

    const plan = spawnSync(process.execPath, ['src/cli.js', 'plan', path], { encoding: 'utf8' });
    assert.equal(plan.status, 0);
    assert.match(plan.stdout, /missing approval \(must affirm an explicit human approval requirement/u);
    assert.doesNotMatch(plan.stdout, /\| send \| high \| ready \|/u);

    const fixture = spawnSync(process.execPath, ['src/cli.js', 'fixture', path], { encoding: 'utf8' });
    assert.equal(fixture.status, 1);
    assert.equal(fixture.stdout, '');
    assert.match(fixture.stderr, /Cannot generate fixture.*must affirm an explicit human approval requirement/u);
  }
});
test('cli reports invalid action entries as manifest validation errors', (context) => {
  for (const [label, value] of [['null', null], ['string', 'read'], ['number', 42], ['array', []]]) {
    const path = `/tmp/connector-action-stub-${process.pid}-${label}.json`;
    fs.writeFileSync(path, JSON.stringify({ actions: [value] }));
    context.after(() => fs.rmSync(path, { force: true }));

    const result = spawnSync(process.execPath, ['src/cli.js', 'plan', path], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`Failed to read manifest.*actions\\[0\\].*received ${label}`, 'u'));
    assert.doesNotMatch(result.stderr, /TypeError|Cannot read properties|\\s+at\\s/u);
  }
});
test('cli rejects empty actions without rendering any mode', (context) => {
  const path = `/tmp/connector-action-stub-${process.pid}-empty-actions.json`;
  fs.writeFileSync(path, JSON.stringify({ name: 'empty-connector', actions: [] }));
  context.after(() => fs.rmSync(path, { force: true }));

  for (const mode of ['plan', 'fixture', 'skill']) {
    const result = spawnSync(process.execPath, ['src/cli.js', mode, path], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Failed to read manifest.*actions array must not be empty/u);
  }
});
test('cli never presents malformed action fields as ready', (context) => {
  const path = `/tmp/connector-action-stub-${process.pid}-malformed-fields.json`;
  fs.writeFileSync(path, JSON.stringify({
    name: 'malformed',
    actions: [{
      name: { bad: true }, description: 7, sideEffect: 'read', approval: {},
      scopes: [null], sampleInput: 'not-an-object'
    }]
  }));
  context.after(() => fs.rmSync(path, { force: true }));

  for (const mode of ['plan', 'skill']) {
    const result = spawnSync(process.execPath, ['src/cli.js', mode, path], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /missing name \(non-empty string\)/u);
    assert.doesNotMatch(result.stdout, /\|\s*ready\s*\||:\s*low risk, ready/u);
  }

  const fixture = spawnSync(process.execPath, ['src/cli.js', 'fixture', path], { encoding: 'utf8' });
  assert.equal(fixture.status, 1);
  assert.equal(fixture.stdout, '');
  assert.match(fixture.stderr, /Cannot generate fixture.*name \(non-empty string\)/u);
});
