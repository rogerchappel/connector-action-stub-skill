import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
assert.equal(
  packageJson.scripts["release:check"],
  "npm run release:contract && npm run check && npm test && npm run build:smoke && npm run smoke && npm run package:smoke",
  "release:check must retain every release verification stage",
);

const compatibilityGate = readFileSync(new URL("./validate.sh", import.meta.url), "utf8");
assert.match(compatibilityGate, /^npm run release:check$/m, "validate.sh must delegate to release:check");

for (const path of ["README.md", "SKILL.md", "docs/ORCHESTRATION.md", "docs/RELEASE_CANDIDATE.md", "docs/examples.md"]) {
  const content = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(content, /npm run release:check/, `${path} must name the canonical release gate`);
}

console.log("Release contract ok: release:check is canonical");
