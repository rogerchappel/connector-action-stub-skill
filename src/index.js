export function parseManifest(text) {
  const manifest = JSON.parse(text);
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('manifest must be a non-null object');
  }
  if (!Array.isArray(manifest.actions)) throw new Error('manifest must include an actions array');
  for (const [index, action] of manifest.actions.entries()) {
    if (action === null || typeof action !== 'object' || Array.isArray(action)) {
      const received = action === null ? 'null' : Array.isArray(action) ? 'array' : typeof action;
      throw new Error(`manifest actions[${index}] must be a non-null object (received ${received})`);
    }
  }
  return manifest;
}
const SUPPORTED_SIDE_EFFECTS = new Set(['read', 'write', 'send', 'delete']);
const escapeMarkdownText = (value) => String(value)
  .replaceAll('\\', '\\\\')
  .replaceAll('|', '\\|')
  .replace(/\r\n?|\n/gu, '<br>');

export function inspectAction(action) {
  const missing = [];
  for (const field of ['name', 'description', 'sideEffect', 'approval', 'sampleInput']) if (!action[field]) missing.push(field);
  if (!Array.isArray(action.scopes) || action.scopes.length === 0) missing.push('scopes');
  const sideEffect = typeof action.sideEffect === 'string' ? action.sideEffect.trim().toLowerCase() : '';
  const supportedSideEffect = SUPPORTED_SIDE_EFFECTS.has(sideEffect);
  if (sideEffect && !supportedSideEffect) missing.push('sideEffect (supported: read, write, send, delete)');
  if (supportedSideEffect && sideEffect !== 'read' && !action.idempotencyKey) missing.push('idempotencyKey');
  const risk = sideEffect === 'read' ? 'low' : 'high';
  return { name: action.name || '<unnamed>', sideEffect, risk, missing, ready: missing.length === 0 };
}
export function buildPlan(manifest) {
  return { connector: manifest.name || 'connector', actionCount: manifest.actions.length, actions: manifest.actions.map(inspectAction), liveExecution: false };
}
export function renderPlan(plan) {
  const rows = plan.actions.map((action) => {
    const readiness = action.ready ? 'ready' : `missing ${action.missing.join(', ')}`;
    return `| ${escapeMarkdownText(action.name)} | ${escapeMarkdownText(action.risk)} | ${escapeMarkdownText(readiness)} |`;
  }).join('\n');
  return `# Connector dry-run plan\n\nConnector: ${escapeMarkdownText(plan.connector)}\nLive execution: ${plan.liveExecution}\n\n| Action | Risk | Readiness |\n|---|---|---|\n${rows}\n`;
}
export function buildFixture(manifest) {
  const plan = buildPlan(manifest);
  const unready = plan.actions.filter((action) => !action.ready);
  if (unready.length > 0) {
    const details = unready.map((action) => `${action.name}: ${action.missing.join(', ')}`).join('; ');
    throw new Error(`Cannot generate fixture for unready actions: ${details}`);
  }
  return { connector: plan.connector, generatedAt: 'stable-fixture', responses: manifest.actions.map((action, index) => ({ action: plan.actions[index].name, ok: true, dryRun: true, request: action.sampleInput, response: { id: `dryrun-${plan.actions[index].name}`, status: 'planned' } })) };
}
export function renderSkillGuide(manifest) {
  const plan = buildPlan(manifest);
  return `# ${plan.connector} connector action skill\n\n## When To Use\n\nUse for dry-run planning of ${plan.connector} connector actions.\n\n## Approval Requirements\n\nLive execution requires explicit approval after reviewing generated plans and fixtures.\n\n## Actions\n\n${plan.actions.map((action) => `- ${action.name}: ${action.risk} risk, ${action.ready ? 'ready' : 'missing ' + action.missing.join(', ')}`).join('\n')}\n`;
}
