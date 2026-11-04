import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const WRITE_APIS =
  /\b(setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction|deleteField|arrayUnion|arrayRemove|increment|firebase\/(storage|database|functions))\b/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

describe('solo lectura', () => {
  it('ningún archivo usa APIs de escritura de Firebase', () => {
    const offenders = sourceFiles(SRC).filter((file) => WRITE_APIS.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('solo src/data/firestore.ts importa Firestore', () => {
    const importers = sourceFiles(SRC).filter((file) => readFileSync(file, 'utf8').includes("from 'firebase/"));
    expect(importers.map((file) => file.replace(/\\/g, '/').split('/src/')[1])).toEqual(['data/firestore.ts']);
  });
});
