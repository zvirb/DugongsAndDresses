import { z } from "zod";
import {
  Attributes, AttributesSchema,
  Conditions, ConditionsSchema,
  Inventory, InventorySchema,
  Participants, ParticipantsSchema,
  CharacterInput, CharacterInputSchema,
  CharacterForm, CharacterFormSchema
} from "./schemas";

// Pre-calculate default attributes for fallback
const defaultAttributes = AttributesSchema.parse({});

export const ATTRIBUTE_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export function createDefaultAttributes(): Attributes {
  return { ...defaultAttributes };
}

/**
 * Safely parses a JSON string into Attributes.
 * Attempts to recover valid data if the schema doesn't match perfectly
 * (e.g. converting string numbers to actual numbers).
 */
export function parseAttributes(json: string | null | undefined): Attributes {
  if (!json) return defaultAttributes;
  try {
    const parsed = JSON.parse(json);

    // AttributesSchema now handles migration and coercion via z.preprocess and z.coerce
    const result = AttributesSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    console.error("Attributes schema validation failed:", result.error);
    return defaultAttributes;
  } catch (e) {
    console.error("Failed to parse attributes JSON:", e);
    return defaultAttributes;
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
      // Recovery: if it's an array, filter only valid participants
      if (Array.isArray(parsed)) {
         // Valid participants must have characterId (string) and initiative (number)
         // We can use the ParticipantSchema for individual validation if we exported it,
         // but manual check is simple enough for recovery.
         const validItems = parsed.filter(item => {
             return typeof item === 'object' && item !== null &&
                    typeof item.characterId === 'string' &&
                    typeof item.initiative === 'number';
         });
         return validItems as Participants;
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
export function parseInventory(json: string | null | undefined): Inventory {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    const result = InventorySchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      return [];
    }
  } catch {
    return [];
  }
}

/**
 * Safely parses a JSON string into an array of CharacterInputs.
 * Returns an empty array if parsing fails.
 */
export function parseCharacterInputs(json: string | null | undefined): CharacterInput[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    const result = z.array(CharacterInputSchema).safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
        console.error("Character inputs validation failed:", result.error);
        return [];
    }
  } catch (e) {
    console.error("Failed to parse character inputs JSON:", e);
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
    return JSON.stringify(defaultAttributes);
  }
  return JSON.stringify(result.data);
}

/**
 * Safely stringifies Conditions.
 */
export function stringifyConditions(data: Conditions): string {
    const result = ConditionsSchema.safeParse(data);
    if (!result.success) {
        console.error("Invalid conditions data provided for stringify:", result.error);
        return "[]";
    }
    return JSON.stringify(data);
}

/**
 * Extracts character data from FormData.
 * Can handle partial updates (only fields present in FormData are validated).
 * Attributes are handled separately: if any attribute key is present or it's a full parse, attributes are extracted.
 */
export function parseCharacterForm(formData: FormData, partial: boolean = false): Partial<CharacterForm> & { attributes?: Attributes } {
  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
        rawData[key] = value;
    }
  });

  let parsed: Partial<CharacterForm>;
  try {
    if (partial) {
      parsed = CharacterFormSchema.partial().parse(rawData);
    } else {
      parsed = CharacterFormSchema.parse(rawData);
    }
  } catch (e) {
    console.error("Character form validation failed:", e);
    throw new Error("Invalid character data");
  }

  const result: Partial<CharacterForm> & { attributes?: Attributes } = { ...parsed };

  // Check if we should extract attributes
  const hasAttributeKeys = ATTRIBUTE_KEYS.some(k => formData.has(k));

  if (!partial || hasAttributeKeys) {
      result.attributes = extractAttributesFromFormData(formData);
  }

  return result;
}

/**
 * Extracts attributes from FormData.
 * Defaults to 10 for missing values.
 */
export function extractAttributesFromFormData(formData: FormData): Attributes {
  const attributes: Record<string, number> = {};

  for (const key of ATTRIBUTE_KEYS) {
    const value = formData.get(key);
    if (value) {
      const parsed = parseInt(value as string);
      attributes[key] = isNaN(parsed) ? 10 : parsed;
    } else {
      attributes[key] = 10;
    }
  }
  // Safe parsing ensures we conform to the schema (and its defaults/types)
  const result = AttributesSchema.safeParse(attributes);
  if (result.success) return result.data;
  return defaultAttributes;
}

/**
 * Safely stringifies Participants.
 */
export function stringifyParticipants(data: Participants): string {
    const result = ParticipantsSchema.safeParse(data);
    if (!result.success) {
        console.error("Invalid participants data provided for stringify:", result.error);
        return "[]";
    }
    return JSON.stringify(data);
}

/**
 * Safely stringifies Inventory.
 */
export function stringifyInventory(data: Inventory): string {
    const result = InventorySchema.safeParse(data);
    if (!result.success) {
        console.error("Invalid inventory data provided for stringify:", result.error);
        return "[]";
    }
    return JSON.stringify(data);
}
