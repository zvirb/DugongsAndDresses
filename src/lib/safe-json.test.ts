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
  stringifyParticipants
} from './safe-json';

describe('safe-json', () => {
  describe('parseAttributes', () => {
    it('parses valid attributes', () => {
      const json = JSON.stringify({ str: 10, dex: 12 });
      expect(parseAttributes(json)).toEqual({ str: 10, dex: 12 });
    });

    it('returns empty object for null/undefined', () => {
      expect(parseAttributes(null)).toEqual({});
      expect(parseAttributes(undefined)).toEqual({});
    });

    it('returns empty object for invalid JSON', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(parseAttributes('invalid')).toEqual({});
      spy.mockRestore();
    });

    it('recovers numeric strings', () => {
      const json = JSON.stringify({ str: "10", dex: 12, speed: "30" });
      expect(parseAttributes(json)).toEqual({ str: 10, dex: 12, speed: 30 });
    });

    it('ignores non-numeric strings during recovery', () => {
      const json = JSON.stringify({ str: "10", name: "Grom" });
      expect(parseAttributes(json)).toEqual({ str: 10 });
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
      expect(stringifyAttributes({ str: "invalid" })).toBe("{}");
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
