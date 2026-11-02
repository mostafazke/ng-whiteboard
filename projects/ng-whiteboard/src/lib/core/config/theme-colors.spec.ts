import { WhiteboardConfig } from '../types';
import { applyThemeColors } from './theme-colors';

const cfg = (overrides: Partial<WhiteboardConfig>) => overrides as WhiteboardConfig;

describe('applyThemeColors', () => {
  it('swaps defaults light to dark', () => {
    const prev = cfg({ theme: undefined, backgroundColor: '#F8F9FA', strokeColor: '#333333' });
    const next = { ...prev, theme: 'dark' as const };

    const result = applyThemeColors(prev, next);

    expect(result.backgroundColor).toBe('#1a1a1a');
    expect(result.strokeColor).toBe('#e5e7eb');
  });

  it('swaps defaults dark to light', () => {
    const prev = cfg({ theme: 'dark', backgroundColor: '#1a1a1a', strokeColor: '#e5e7eb' });
    const next = { ...prev, theme: 'light' as const };

    const result = applyThemeColors(prev, next);

    expect(result.backgroundColor).toBe('#F8F9FA');
    expect(result.strokeColor).toBe('#333333');
  });

  it('preserves consumer colors on theme change', () => {
    const prev = cfg({ theme: undefined, backgroundColor: '#ffffff', strokeColor: '#ff0000' });
    const next = { ...prev, theme: 'dark' as const };

    const result = applyThemeColors(prev, next);

    expect(result.backgroundColor).toBe('#ffffff');
    expect(result.strokeColor).toBe('#ff0000');
  });

  it('swaps only stroke when only stroke is default', () => {
    const prev = cfg({ theme: undefined, backgroundColor: '#abcdef', strokeColor: '#333333' });
    const next = { ...prev, theme: 'dark' as const };

    const result = applyThemeColors(prev, next);

    expect(result.backgroundColor).toBe('#abcdef');
    expect(result.strokeColor).toBe('#e5e7eb');
  });

  it('is a no-op when theme is unchanged', () => {
    const prev = cfg({ theme: 'dark', backgroundColor: '#1a1a1a' });
    const next = { ...prev, backgroundColor: '#123456' };

    expect(applyThemeColors(prev, next)).toBe(next);
  });

  it('treats unset to light as a no-op', () => {
    const prev = cfg({ theme: undefined, backgroundColor: '#F8F9FA', strokeColor: '#333333' });
    const next = { ...prev, theme: 'light' as const };

    expect(applyThemeColors(prev, next)).toBe(next);
  });
});
