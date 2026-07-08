export function parseManifest(text) {
  const manifest = JSON.parse(text);
  if (!Array.isArray(manifest.actions)) throw new Error('manifest must include an actions array');
  return manifest;
}
export function inspectAction(action) {
  const missing = [];
  for (const field of ['name', 'description', 'sideEffect', 'approval', 'sampleInput']) if (!action[field]) missing.push(field);
  if (!Array.isArray(action.scopes) || action.scopes.length === 0) missing.push('scopes');
  if (action.sideEffect && action.sideEffect !== 'read' && !action.idempotencyKey) missing.push('idempotencyKey');
  const risk = action.sideEffect === 'write' || action.sideEffect === 'send' ? 'high' : action.sideEffect === 'read' ? 'low' : 'medium';
  return { name: action.name || '<unnamed>', risk, missing, ready: missing.length === 0 };
}
export function buildPlan(manifest) {
  return { connector: manifest.name || 'connector', actionCount: manifest.actions.length, actions: manifest.actions.map(inspectAction), liveExecution: false };
}
export function renderPlan(plan) {
  const rows = plan.actions.map((action) => `| ${action.name} | ${action.risk} | ${action.ready ? 'ready' : 'missing ' + action.missing.join(', ')} |`).join('\n');
  return `# Connector dry-run plan\n\nConnector: ${plan.connector}\nLive execution: ${plan.liveExecution}\n\n| Action | Risk | Readiness |\n|---|---|---|\n${rows}\n`;
}
export function buildFixture(manifest) {
  return { connector: manifest.name || 'connector', generatedAt: 'stable-fixture', responses: manifest.actions.map((action) => ({ action: action.name, ok: true, dryRun: true, request: action.sampleInput || {}, response: { id: `dryrun-${action.name || 'action'}`, status: 'planned' } })) };
}
export function renderSkillGuide(manifest) {
  const plan = buildPlan(manifest);
  return `# ${plan.connector} connector action skill\n\n## When To Use\n\nUse for dry-run planning of ${plan.connector} connector actions.\n\n## Approval Requirements\n\nLive execution requires explicit approval after reviewing generated plans and fixtures.\n\n## Actions\n\n${plan.actions.map((action) => `- ${action.name}: ${action.risk} risk, ${action.ready ? 'ready' : 'missing ' + action.missing.join(', ')}`).join('\n')}\n`;
}
