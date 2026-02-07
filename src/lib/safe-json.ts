import {
  Attributes, AttributesSchema,
  Conditions, ConditionsSchema,
  Participants, ParticipantsSchema
} from "./schemas";

/**
 * Safely parses a JSON string into Attributes.
 * Attempts to recover valid data if the schema doesn't match perfectly
 * (e.g. converting string numbers to actual numbers).
 */
export function parseAttributes(json: string | null | undefined): Attributes {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);

    // First try strict schema
    const result = AttributesSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    // Attempt recovery: keep numbers, try to parse strings to numbers
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const cleaned: Attributes = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'number') {
          cleaned[key] = value;
        } else if (typeof value === 'string') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            cleaned[key] = num;
          }
        }
      }
      return cleaned;
    }

    console.error("Attributes schema validation failed and recovery impossible:", result.error);
    return {};
  } catch (e) {
    console.error("Failed to parse attributes JSON:", e);
    return {};
  }
}

/**
 * Safely parses a JSON string into Conditions.
 * Returns an empty array if parsing fails or schema validation fails.
 */
export function parseConditions(json: string | null | undefined): Conditions {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    const result = ConditionsSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
      // Recovery: if it's an array, filter for strings
      if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string');
      }
      console.error("Conditions schema validation failed:", result.error);
      return [];
    }
  } catch (e) {
    console.error("Failed to parse conditions JSON:", e);
    return [];
  }
}

/**
 * Safely parses a JSON string into Participants.
 * Returns an empty array if parsing fails or schema validation fails.
 */
export function parseParticipants(json: string | null | undefined): Participants {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    const result = ParticipantsSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
      // Recovery: if it's an array, try to parse individual items?
      // For now, simpler to just return empty or valid ones
      if (Array.isArray(parsed)) {
         // Try to validate each item individually
         // This requires importing ParticipantSchema which is exported
      }
      console.error("Participants schema validation failed:", result.error);
      return [];
    }
  } catch (e) {
    console.error("Failed to parse participants JSON:", e);
    return [];
  }
}

/**
 * Safely parses a JSON string into an inventory (string array).
 * Returns an empty array if parsing fails.
 */
export function parseInventory(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Safely stringifies Attributes.
 * Validates against schema before stringifying.
 */
export function stringifyAttributes(data: Attributes): string {
  const result = AttributesSchema.safeParse(data);
  if (!result.success) {
    console.error("Invalid attributes data provided for stringify:", result.error);
    return "{}";
  }
  return JSON.stringify(data);
}
