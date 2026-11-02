import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const scssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return scssFiles(path);
    return path.endsWith('.scss') ? [path] : [];
  });

describe('editor styles stay inside the editor', () => {
  const files = scssFiles(__dirname);
  const globalSheet = readFileSync(join(__dirname, 'whiteboard-editor.component.scss'), 'utf8');

  it('declares and reads only --wb-* custom properties', () => {
    const foreign = files.flatMap((file) =>
      (readFileSync(file, 'utf8').match(/--[a-z][a-z0-9-]*/g) ?? []).filter((name) => !name.startsWith('--wb-'))
    );
    expect(foreign).toEqual([]);
  });

  it('the layer panel takes every color from a theme token', () => {
    const sheet = readFileSync(join(__dirname, 'panels/layer-panel/layer-panel.component.scss'), 'utf8');
    expect(sheet.match(/#[0-9a-f]{3,8}\b|rgba?\(|(?<![\w-])white(?![\w-])/gi) ?? []).toEqual([]);
  });

  it('container-relative sizes subtract tokens, never pixel literals tied to panel heights', () => {
    const magic = files.flatMap((file) =>
      (readFileSync(file, 'utf8').match(/calc\(100(?:cqh|cqw|%)[^;]*?-\s*\d+px[^;]*;/g) ?? []).map(
        (rule) => `${file.split(/[\\/]/).pop()}: ${rule}`
      )
    );
    expect(magic).toEqual([]);
  });

  it('the unencapsulated sheet defines nothing on :root and prefixes its keyframes', () => {
    expect(globalSheet).not.toMatch(/:root/);
    expect(globalSheet.match(/@keyframes\s+[\w-]+/g)?.every((k) => /@keyframes\s+wb-/.test(k))).toBe(true);
  });

  it('every top-level rule of the unencapsulated sheet is scoped to .editor', () => {
    const topLevelSelectors = globalSheet
      .split('\n')
      .filter((line) => /^[^\s/@}][^{]*\{\s*$/.test(line) || /^[^\s/@}][^{]*,\s*$/.test(line))
      .map((line) => line.replace(/[{,]\s*$/, '').trim());
    const unscoped = topLevelSelectors.filter((selector) => !/^(:where\(\.editor\)|\.editor\b)/.test(selector));
    expect(unscoped).toEqual([]);
  });
});
