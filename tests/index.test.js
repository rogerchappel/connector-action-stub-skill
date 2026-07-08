import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseManifest, buildPlan, buildFixture, renderSkillGuide } from '../src/index.js';
test('builds dry-run plan for connector manifest', () => { const plan = buildPlan(parseManifest(fs.readFileSync('examples/crm-manifest.json', 'utf8'))); assert.equal(plan.liveExecution, false); assert.equal(plan.actions[0].ready, true); });
test('flags missing approval fields', () => { const plan = buildPlan({ actions: [{ name: 'send' }] }); assert.ok(plan.actions[0].missing.includes('approval')); });
test('generates deterministic fixtures and skill guide', () => { const manifest = parseManifest(fs.readFileSync('examples/crm-manifest.json', 'utf8')); assert.equal(buildFixture(manifest).generatedAt, 'stable-fixture'); assert.match(renderSkillGuide(manifest), /Approval Requirements/); });
