import { buildDasharray, lineStyleOf, rescaleDasharray } from './dasharray';

describe('dasharray', () => {
  it('builds patterns in multiples of the width', () => {
    expect(buildDasharray('dashed', 2)).toBe('6,6');
    expect(buildDasharray('dotted', 2)).toBe('2,4');
    expect(buildDasharray('dashdot', 2)).toBe('10,4,2,4');
    expect(buildDasharray('solid', 2)).toBe('');
  });

  it.each([
    ['', 'solid'],
    [undefined, 'solid'],
    ['0,0', 'solid'],
    ['6,6', 'dashed'],
    ['24 24', 'dashed'],
    ['1.5,3', 'dotted'],
    ['25,10,5,10', 'dashdot'],
    ['5,5,5', undefined],
    ['4,9', undefined],
    ['none', undefined],
  ])('recognizes %p as %p at any width', (dasharray, style) => {
    expect(lineStyleOf(dasharray)).toBe(style);
  });

  it('rebuilds a recognized style for a new width and keeps custom patterns', () => {
    expect(rescaleDasharray('6,6', 5)).toBe('15,15');
    expect(rescaleDasharray('2,4', 3)).toBe('3,6');
    expect(rescaleDasharray('4,9', 3)).toBe('4,9');
    expect(rescaleDasharray('', 3)).toBe('');
    expect(rescaleDasharray(undefined, 3)).toBeUndefined();
  });
});
