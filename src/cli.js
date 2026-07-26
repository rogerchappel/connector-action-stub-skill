#!/usr/bin/env node
import fs from 'node:fs';
import { parseManifest, buildPlan, renderPlan, buildFixture, renderSkillGuide } from './index.js';
const usage = 'Usage: connector-action-stub <plan|fixture|skill> <manifest.json>';
const [cmd, file, extra] = process.argv.slice(2);

if (cmd === '--help' || cmd === '-h') {
  console.log(usage);
  process.exit(0);
}

if (cmd === '--version' || cmd === '-v') {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(packageJson.version);
  process.exit(0);
}

if (!cmd) {
  console.error('Missing command.');
  console.error(usage);
  process.exit(2);
}
if (!['plan', 'fixture', 'skill'].includes(cmd)) {
  console.error('Unknown command: ' + cmd);
  console.error(usage);
  process.exit(2);
}
if (!file) {
  console.error('Missing manifest path.');
  console.error(usage);
  process.exit(2);
}
if (extra) {
  console.error('Unexpected argument: ' + extra);
  console.error(usage);
  process.exit(2);
}

let manifest;
try {
  manifest = parseManifest(fs.readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`Failed to read manifest "${file}": ${error.message}`);
  process.exit(1);
}

try {
  if (cmd === 'plan') console.log(renderPlan(buildPlan(manifest)));
  if (cmd === 'fixture') console.log(JSON.stringify(buildFixture(manifest), null, 2));
  if (cmd === 'skill') console.log(renderSkillGuide(manifest));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
