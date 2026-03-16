import { generateId, generateUUID } from './id';

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

  describe('generateUUID', () => {
    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate string UUIDs', () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe('string');
    });

    it('should generate UUIDs in valid format', () => {
      const uuid = generateUUID();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate UUIDs with version 4 identifier', () => {
      const uuid = generateUUID();
      // The 13th character should be '4' (version 4)
      expect(uuid.charAt(14)).toBe('4');
    });

    it('should generate UUIDs with correct variant bits', () => {
      const uuid = generateUUID();
      // The 17th character should be 8, 9, a, or b
      const variantChar = uuid.charAt(19).toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(variantChar);
    });

    it('should generate multiple unique UUIDs', () => {
      const uuids = Array.from({ length: 100 }, () => generateUUID());
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(100);
    });

    it('should use fallback when crypto.randomUUID is not available', () => {
      const originalRandomUUID = crypto.randomUUID;
      Object.defineProperty(crypto, 'randomUUID', { value: undefined, writable: true, configurable: true });

      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      Object.defineProperty(crypto, 'randomUUID', { value: originalRandomUUID, writable: true, configurable: true });
    });

    it('should use fallback when crypto.randomUUID throws', () => {
      const originalRandomUUID = crypto.randomUUID;
      Object.defineProperty(crypto, 'randomUUID', {
        value: () => {
          throw new Error('Insecure context');
        },
        writable: true,
        configurable: true,
      });

      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      Object.defineProperty(crypto, 'randomUUID', { value: originalRandomUUID, writable: true, configurable: true });
    });
  });
});
