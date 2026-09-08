import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
assert.equal(
  packageJson.scripts["package:smoke"],
  "npm run build:smoke && node scripts/package-smoke.js",
  "package:smoke must build and validate the package from a clean checkout",
);
assert.equal(
  packageJson.scripts["release:check"],
  "npm run release:contract && npm run check && npm test && npm run smoke && npm run package:smoke",
  "release:check must retain every release verification stage",
);

const compatibilityGate = readFileSync(new URL("./validate.sh", import.meta.url), "utf8");
assert.match(compatibilityGate, /^npm run release:check$/m, "validate.sh must delegate to release:check");

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
assert.match(workflow, /^permissions:\n  contents: read$/m, "CI must declare least-privilege read access");
assert.match(workflow, /node-version: \[20, 24\]/, "CI must test the minimum and current Node lines");
assert.match(
  workflow,
  /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/,
  "checkout must use the reviewed v7.0.1 commit",
);
assert.match(
  workflow,
  /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/,
  "setup-node must use the reviewed v7.0.0 commit",
);
assert.match(workflow, /node-version: \$\{\{ matrix\.node-version \}\}/, "setup-node must use the compatibility matrix");
assert.match(workflow, /^      - run: npm ci$/m, "CI must install from the lockfile with npm ci");
assert.match(workflow, /^      - run: npm run release:check$/m, "every matrix entry must run the canonical release gate");

for (const path of ["README.md", "SKILL.md", "docs/ORCHESTRATION.md", "docs/RELEASE_CANDIDATE.md", "docs/examples.md"]) {
  const content = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(content, /npm run release:check/, `${path} must name the canonical release gate`);
}

console.log("Release contract ok: release:check is canonical");
