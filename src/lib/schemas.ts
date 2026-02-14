import { z } from "zod";

const attributeMappings: Record<string, string> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha'
};

// Attributes are a flexible dictionary of string keys to number values.
// e.g. { str: 10, dex: 12, speed: 30 }
export const AttributesSchema = z.preprocess((val) => {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const newVal: Record<string, any> = {};
    const entries = Object.entries(val as Record<string, any>);

    for (const [key, value] of entries) {
       let currentKey = key;
       let currentValue = value;

       // Migration
       if (Object.prototype.hasOwnProperty.call(attributeMappings, key)) {
         currentKey = attributeMappings[key];
       }

       // Coercion & Cleanup
       if (typeof currentValue === 'string') {
         const num = parseFloat(currentValue);
         if (!isNaN(num)) {
           currentValue = num;
         } else {
           continue; // Skip invalid strings
         }
       } else if (typeof currentValue !== 'number') {
           continue; // Skip non-number/non-string values
       }

       newVal[currentKey] = currentValue;
    }
    return newVal;
  }
  return val;
}, z.object({
  str: z.number().default(10),
  dex: z.number().default(10),
  con: z.number().default(10),
  int: z.number().default(10),
  wis: z.number().default(10),
  cha: z.number().default(10),
}).catchall(z.number()));

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

// Schema for form data (handles string -> number coercion)
export const CharacterFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().default("PLAYER"),
  race: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
  class: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
  level: z.coerce.number().int().default(1),
  hp: z.coerce.number().int().default(10),
  maxHp: z.coerce.number().int().default(10),
  armorClass: z.coerce.number().int().default(10),
  speed: z.coerce.number().int().default(30),
  initiative: z.coerce.number().int().default(0),
  sourceId: z.string().optional().nullable(),
});

export type CharacterForm = z.infer<typeof CharacterFormSchema>;
