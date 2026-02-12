import { describe, it, expect, vi } from 'vitest';
import {
  parseAttributes,
  parseConditions,
  parseInventory,
  parseParticipants,
  extractAttributesFromFormData,
  stringifyAttributes,
  stringifyConditions,
  stringifyInventory,
  stringifyParticipants,
  parseCharacterInputs
} from './safe-json';

describe('safe-json', () => {
  describe('parseAttributes', () => {
    it('parses valid attributes and adds defaults', () => {
      const json = JSON.stringify({ str: 15, dex: 12 });
      const expected = {
        str: 15, dex: 12, con: 10, int: 10, wis: 10, cha: 10
      };
      expect(parseAttributes(json)).toEqual(expected);
    });

    it('migrates legacy attribute names', () => {
      const json = JSON.stringify({ strength: 18, dexterity: 14 });
      const result = parseAttributes(json);
      expect(result.str).toBe(18);
      expect(result.dex).toBe(14);
      // @ts-expect-error Testing that old key is gone
      expect(result.strength).toBeUndefined();
    });

    it('returns default attributes for null/undefined/invalid', () => {
      const defaults = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      expect(parseAttributes(null)).toEqual(defaults);
      expect(parseAttributes(undefined)).toEqual(defaults);

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(parseAttributes('invalid')).toEqual(defaults);
      spy.mockRestore();
    });

    it('recovers numeric strings', () => {
      const json = JSON.stringify({ str: "16", dex: 12, speed: "30" });
      const result = parseAttributes(json);
      expect(result.str).toBe(16);
      expect(result.dex).toBe(12);
      expect(result.speed).toBe(30);
    });

    it('strips non-numeric strings but keeps valid attributes', () => {
      const json = JSON.stringify({ str: 10, name: "Grom", speed: "fast" });
      const result = parseAttributes(json);
      expect(result.str).toBe(10);
      // @ts-expect-error Testing stripped key
      expect(result.name).toBeUndefined();
      // @ts-expect-error Testing stripped key
      expect(result.speed).toBeUndefined();
    });
  });

  describe('parseCharacterInputs', () => {
      it('parses valid character inputs', () => {
          const inputs = JSON.stringify([{
              name: "Hero",
              hp: 20,
              maxHp: 20,
              armorClass: 15,
              attributes: { str: 18 }
          }]);
          const result = parseCharacterInputs(inputs);
          expect(result).toHaveLength(1);
          expect(result[0].name).toBe("Hero");
          expect(result[0].attributes?.str).toBe(18);
          // Check defaults in attributes
          expect(result[0].attributes?.dex).toBe(10);
      });

      it('returns empty array for invalid JSON', () => {
          const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
          expect(parseCharacterInputs("invalid")).toEqual([]);
          spy.mockRestore();
      });

      it('returns empty array for invalid schema', () => {
          const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
          const inputs = JSON.stringify([{ name: "NoHP" }]); // Missing required fields
          expect(parseCharacterInputs(inputs)).toEqual([]);
          spy.mockRestore();
      });
  });

  describe('parseConditions', () => {
    it('parses valid conditions', () => {
      const json = JSON.stringify(["Prone", "Stunned"]);
      expect(parseConditions(json)).toEqual(["Prone", "Stunned"]);
    });

    it('returns empty array for null/undefined', () => {
      expect(parseConditions(null)).toEqual([]);
      expect(parseConditions(undefined)).toEqual([]);
    });

    it('filters non-string items', () => {
      const json = JSON.stringify(["Prone", 123, { status: "ok" }]);
      expect(parseConditions(json)).toEqual(["Prone"]);
    });
  });

  describe('parseInventory', () => {
    it('parses valid inventory', () => {
      const json = JSON.stringify(["Sword", "Shield"]);
      expect(parseInventory(json)).toEqual(["Sword", "Shield"]);
    });

    it('filters non-string items', () => {
      const json = JSON.stringify(["Sword", 123]);
      expect(parseInventory(json)).toEqual(["Sword"]);
    });
  });

  describe('stringify helpers', () => {
    it('stringifyAttributes validates input', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error Testing invalid input
      // Should fallback to default attributes stringified
      const result = stringifyAttributes({ str: "invalid" });
      const defaults = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      expect(JSON.parse(result)).toEqual(defaults);
      spy.mockRestore();
    });

    it('stringifyConditions validates input', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // @ts-expect-error Testing invalid input
        expect(stringifyConditions(["Valid", 123])).toBe("[]");
        spy.mockRestore();
    });
  });

  describe('extractAttributesFromFormData', () => {
    it('extracts valid attributes', () => {
      const formData = new FormData();
      formData.append('str', '12');
      formData.append('dex', '14');

      const result = extractAttributesFromFormData(formData);
      expect(result.str).toBe(12);
      expect(result.dex).toBe(14);
      expect(result.con).toBe(10); // Default
    });

    it('handles invalid numbers by defaulting to 10', () => {
      const formData = new FormData();
      formData.append('str', 'invalid');

      const result = extractAttributesFromFormData(formData);
      expect(result.str).toBe(10);
    });

    it('defaults all to 10 if empty', () => {
      const formData = new FormData();
      const result = extractAttributesFromFormData(formData);
      expect(result).toEqual({
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
      });
    });
  });
});
