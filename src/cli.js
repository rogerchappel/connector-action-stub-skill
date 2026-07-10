#!/usr/bin/env node
import fs from 'node:fs';
import { parseManifest, buildPlan, renderPlan, buildFixture, renderSkillGuide } from './index.js';
const [cmd = 'plan', file = 'examples/crm-manifest.json'] = process.argv.slice(2);

if (cmd === '--help' || cmd === '-h') {
  console.log('Usage: connector-action-stub <plan|fixture|skill> <manifest.json>');
  process.exit(0);
}

if (cmd === '--version' || cmd === '-v') {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(packageJson.version);
  process.exit(0);
}

if (!['plan', 'fixture', 'skill'].includes(cmd)) { console.error('Usage: connector-action-stub <plan|fixture|skill> <manifest.json>'); process.exit(2); }
const manifest = parseManifest(fs.readFileSync(file, 'utf8'));
if (cmd === 'plan') console.log(renderPlan(buildPlan(manifest)));
if (cmd === 'fixture') console.log(JSON.stringify(buildFixture(manifest), null, 2));
if (cmd === 'skill') console.log(renderSkillGuide(manifest));
