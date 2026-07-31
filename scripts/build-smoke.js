import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

for (let run = 1; run <= 2; run += 1) {
  const result = spawnSync('npm', ['run', 'build'], {
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`Build smoke failed on run ${run}`);
    process.exit(result.status ?? 1);
  }
}

function listFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(prefix, entry.name);
    return entry.isDirectory()
      ? listFiles(path.join(directory, entry.name), relativePath)
      : [relativePath];
  });
}

const files = listFiles('dist').sort();
const expected = ['src/cli.js', 'src/index.js'];

if (JSON.stringify(files) !== JSON.stringify(expected)) {
  console.error(`Build smoke expected ${expected.join(', ')}; found ${files.join(', ') || '<none>'}`);
  process.exit(1);
}

console.log(`Build smoke ok after consecutive builds: ${files.join(', ')}`);
