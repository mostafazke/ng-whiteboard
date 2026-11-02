import { WhiteboardConfig } from '../types';

export const THEME_DEFAULT_COLORS: Record<'light' | 'dark', { backgroundColor: string; strokeColor: string }> = {
  light: { backgroundColor: '#F8F9FA', strokeColor: '#333333' },
  dark: { backgroundColor: '#1a1a1a', strokeColor: '#e5e7eb' },
};

export function applyThemeColors(prev: WhiteboardConfig, next: WhiteboardConfig): WhiteboardConfig {
  const from = prev.theme ?? 'light';
  const to = next.theme ?? 'light';
  if (from === to) {
    return next;
  }

  const fromColors = THEME_DEFAULT_COLORS[from];
  const toColors = THEME_DEFAULT_COLORS[to];

  return {
    ...next,
    backgroundColor: next.backgroundColor === fromColors.backgroundColor ? toColors.backgroundColor : next.backgroundColor,
    strokeColor: next.strokeColor === fromColors.strokeColor ? toColors.strokeColor : next.strokeColor,
  };
}
