import { generateId } from './id';

describe('ID Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate IDs with expected format', () => {
      const id = generateId();
      // Should be timestamp in base36 + random string in base36
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate IDs with consistent length', () => {
      const ids = Array.from({ length: 10 }, () => generateId());
      const lengths = new Set(ids.map((id) => id.length));
      expect(lengths.size).toBe(1);
    });
  });
});
