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
    const newVal: Record<string, any> = { ...val };
    for (const key of Object.keys(newVal)) {
       let currentKey = key;
       let value = newVal[key];

       // Migration
       if (Object.prototype.hasOwnProperty.call(attributeMappings, key)) {
         currentKey = attributeMappings[key];
         newVal[currentKey] = value;
         delete newVal[key];
       }

       // Re-read value in case it moved
       value = newVal[currentKey];

       // Coercion & Cleanup
       if (typeof value === 'string') {
         const num = parseFloat(value);
         if (!isNaN(num)) {
           newVal[currentKey] = num;
         } else {
           // Invalid string for number, remove it to prevent validation failure
           delete newVal[currentKey];
         }
       } else if (typeof value !== 'number') {
           // Remove non-number/non-string values
           delete newVal[currentKey];
       }
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
