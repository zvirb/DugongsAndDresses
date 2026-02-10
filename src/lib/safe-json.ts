import {
  Attributes, AttributesSchema,
  Conditions, ConditionsSchema,
  Inventory, InventorySchema,
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
 * Extracts attributes from FormData.
 * Defaults to 10 for missing values.
 */
export function extractAttributesFromFormData(formData: FormData): Attributes {
  const attributes: Attributes = {};
  const keys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  for (const key of keys) {
    const value = formData.get(key);
    if (value) {
      const parsed = parseInt(value as string);
      attributes[key] = isNaN(parsed) ? 10 : parsed;
    } else {
      attributes[key] = 10;
    }
  }
  return attributes;
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
