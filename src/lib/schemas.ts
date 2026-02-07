import { z } from "zod";

// Attributes are a flexible dictionary of string keys to number values.
// e.g. { str: 10, dex: 12, speed: 30 }
export const AttributesSchema = z.record(z.string(), z.number());

export type Attributes = z.infer<typeof AttributesSchema>;

// Conditions are an array of strings.
// e.g. ["Prone", "Stunned"]
export const ConditionsSchema = z.array(z.string());

export type Conditions = z.infer<typeof ConditionsSchema>;

// Participants in an encounter.
export const ParticipantSchema = z.object({
  characterId: z.string(),
  initiative: z.number(),
  currentHp: z.number().optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const ParticipantsSchema = z.array(ParticipantSchema);

export type Participants = z.infer<typeof ParticipantsSchema>;
