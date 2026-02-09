import { z } from "zod";

// Attributes are a flexible dictionary of string keys to number values.
// e.g. { str: 10, dex: 12, speed: 30 }
export const AttributesSchema = z.record(z.string(), z.number());

export type Attributes = z.infer<typeof AttributesSchema>;

// Conditions are an array of strings.
// e.g. ["Prone", "Stunned"]
export const ConditionsSchema = z.array(z.string());

export type Conditions = z.infer<typeof ConditionsSchema>;

// Inventory is an array of strings.
// e.g. ["Sword", "Shield"]
export const InventorySchema = z.array(z.string());

export type Inventory = z.infer<typeof InventorySchema>;

// Participants in an encounter.
export const ParticipantSchema = z.object({
  characterId: z.string(),
  initiative: z.number(),
  currentHp: z.number().optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const ParticipantsSchema = z.array(ParticipantSchema);

export type Participants = z.infer<typeof ParticipantsSchema>;

// Character Input Schema for creation/updates
export const CharacterInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().default("PLAYER"), // Defaults to PLAYER, but allows other strings
  race: z.string().optional().nullable(),
  class: z.string().optional().nullable(),
  level: z.number().int().default(1),
  hp: z.number().int(),
  maxHp: z.number().int(),
  armorClass: z.number().int(),
  speed: z.number().int().default(30),
  initiative: z.number().int().default(0),
  attributes: AttributesSchema.optional(),
  sourceId: z.string().optional().nullable(),
});

export type CharacterInput = z.infer<typeof CharacterInputSchema>;
