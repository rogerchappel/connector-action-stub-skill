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
const AFFIRMATIVE_HUMAN_APPROVAL = /^(?:requires? (?:explicit )?human approval|human approval (?:is )?required|must (?:obtain|receive) (?:explicit )?human approval)(?:$|[\s:;,.!?()[\]{}-])/u;
const escapeMarkdownText = (value) => String(value)
  .replaceAll('\\', '\\\\')
  .replaceAll('|', '\\|')
  .replace(/\r\n?|\n/gu, '<br>');
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const normalizeApproval = (value) => typeof value === 'string'
  ? value.trim().toLowerCase().replace(/\s+/gu, ' ')
  : '';

export function inspectAction(action) {
  const missing = [];
  if (!isNonEmptyString(action.name)) missing.push('name (non-empty string)');
  if (!isNonEmptyString(action.description)) missing.push('description (non-empty string)');
  if (!isNonEmptyString(action.sideEffect)) missing.push('sideEffect');
  if (!isNonEmptyString(action.approval)) missing.push('approval (non-empty string)');
  if (!Array.isArray(action.scopes) || action.scopes.length === 0 || !action.scopes.every(isNonEmptyString)) {
    missing.push('scopes (non-empty array of non-empty strings)');
  }
  if (!isObject(action.sampleInput)) missing.push('sampleInput (object)');
  const sideEffect = typeof action.sideEffect === 'string' ? action.sideEffect.trim().toLowerCase() : '';
  const supportedSideEffect = SUPPORTED_SIDE_EFFECTS.has(sideEffect);
  if (sideEffect && !supportedSideEffect) missing.push('sideEffect (supported: read, write, send, delete)');
  if (supportedSideEffect && sideEffect !== 'read' && !AFFIRMATIVE_HUMAN_APPROVAL.test(normalizeApproval(action.approval))) {
    missing.push('approval (must affirm an explicit human approval requirement for write, send, and delete actions)');
  }
  if (supportedSideEffect && sideEffect !== 'read' && !isNonEmptyString(action.idempotencyKey)) {
    missing.push('idempotencyKey (non-empty string)');
  } else if (action.idempotencyKey !== undefined && !isNonEmptyString(action.idempotencyKey)) {
    missing.push('idempotencyKey (non-empty string when provided)');
  }
  const risk = sideEffect === 'read' ? 'low' : 'high';
  return { name: isNonEmptyString(action.name) ? action.name : '<unnamed>', sideEffect, risk, missing, ready: missing.length === 0 };
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
  return { connector: plan.connector, generatedAt: 'stable-fixture', responses: manifest.actions.map((action, index) => ({ action: plan.actions[index].name, ok: true, dryRun: true, request: action.sampleInput, response: { id: `dryrun-${plan.actions[index].name}-${index + 1}`, status: 'planned' } })) };
}
export function renderSkillGuide(manifest) {
  const plan = buildPlan(manifest);
  return `# ${plan.connector} connector action skill\n\n## When To Use\n\nUse for dry-run planning of ${plan.connector} connector actions.\n\n## Approval Requirements\n\nLive execution requires explicit approval after reviewing generated plans and fixtures.\n\n## Actions\n\n${plan.actions.map((action) => `- ${action.name}: ${action.risk} risk, ${action.ready ? 'ready' : 'missing ' + action.missing.join(', ')}`).join('\n')}\n`;
}
