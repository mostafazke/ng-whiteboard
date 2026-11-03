import { nextRadioIndex } from './radio-group-keys';

describe('nextRadioIndex', () => {
  it('moves forward with ArrowRight and ArrowDown, wrapping', () => {
    expect(nextRadioIndex('ArrowRight', 0, 3)).toBe(1);
    expect(nextRadioIndex('ArrowDown', 2, 3)).toBe(0);
  });

  it('moves back with ArrowLeft and ArrowUp, wrapping', () => {
    expect(nextRadioIndex('ArrowLeft', 1, 3)).toBe(0);
    expect(nextRadioIndex('ArrowUp', 0, 3)).toBe(2);
  });

  it('jumps with Home and End', () => {
    expect(nextRadioIndex('Home', 2, 3)).toBe(0);
    expect(nextRadioIndex('End', 0, 3)).toBe(2);
  });

  it('returns null for other keys', () => {
    expect(nextRadioIndex('a', 0, 3)).toBeNull();
  });
});
