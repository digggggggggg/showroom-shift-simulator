import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = __dirname;

function sources(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((e) => {
    const full = resolve(path, e.name);
    if (e.isDirectory()) return e.name === 'test' ? [] : sources(full);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : [];
  });
}

describe('src/game purity', () => {
  const files = sources(dir);

  it('finds the sim sources', () => {
    expect(files.some((f) => f.endsWith('sim.ts'))).toBe(true);
  });

  it.each(files.map((f) => [f.slice(dir.length + 1), f]))('%s imports no react, DOM or audio, and never calls Math.random', (_, file) => {
    const src = readFileSync(file, 'utf8');
    expect(src).not.toMatch(/from ['"](react|react-dom)(\/[^'"]*)?['"]/);
    expect(src).not.toMatch(/\b(document|window|AudioContext|requestAnimationFrame|HTMLElement|navigator)\b/);
    expect(src).not.toMatch(/Math\.random\s*\(/);
    expect(src).not.toMatch(/from ['"]\.\.\//);
  });
});
