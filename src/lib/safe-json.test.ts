import { describe, it, expect, vi } from 'vitest';
import { parseAttributes, parseConditions, stringifyAttributes } from './safe-json';

describe('safe-json', () => {
  describe('parseAttributes', () => {
    it('parses valid attributes', () => {
      const input = JSON.stringify({ str: 10, dex: 12 });
      expect(parseAttributes(input)).toEqual({ str: 10, dex: 12 });
    });

    it('returns empty object for invalid JSON', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      expect(parseAttributes('{ invalid }')).toEqual({});
      consoleSpy.mockRestore();
    });

    it('recovers string numbers to numbers', () => {
      // Legacy data support
      const input = JSON.stringify({ str: "10", dex: 12 });
      expect(parseAttributes(input)).toEqual({ str: 10, dex: 12 });
    });

    it('ignores non-numeric strings that cannot be parsed', () => {
      const input = JSON.stringify({ str: "strong", dex: 12 });
      expect(parseAttributes(input)).toEqual({ dex: 12 });
    });

    it('returns empty object for empty input', () => {
      expect(parseAttributes(null)).toEqual({});
      expect(parseAttributes(undefined)).toEqual({});
      expect(parseAttributes("")).toEqual({});
    });
  });

  describe('parseConditions', () => {
    it('parses valid conditions', () => {
      const input = JSON.stringify(["Prone", "Stunned"]);
      expect(parseConditions(input)).toEqual(["Prone", "Stunned"]);
    });

    it('returns empty array for invalid JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      expect(parseConditions('{ invalid }')).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('recovers by filtering string items', () => {
      // Mixed types
      const input = JSON.stringify(["Prone", 123, "Stunned"]);
      expect(parseConditions(input)).toEqual(["Prone", "Stunned"]);
    });
  });

  describe('stringifyAttributes', () => {
    it('stringifies valid attributes', () => {
      const input = { str: 10, dex: 15 };
      expect(stringifyAttributes(input)).toBe(JSON.stringify(input));
    });

    it('handles invalid input by returning {}', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      // @ts-expect-error - intentional type violation
      expect(stringifyAttributes({ str: "invalid" })).toBe("{}");
      consoleSpy.mockRestore();
    });
  });
});
