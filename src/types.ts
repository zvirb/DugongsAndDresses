// QUARTERMASTER'S JOURNAL - CRITICAL LEARNINGS ONLY:
// Format: ## YYYY-MM-DD - [Schema] Mess: [Found string in HP field] Tidy: [Enforced number parsing]
// ## 2024-05-24 - [Schema] Mess: [Duplicate interface definitions across components] Tidy: [Centralized types in src/types.ts]
// ## 2024-05-24 - [Schema] Mess: [Unsafe JSON.parse in actions] Tidy: [Enforced safe-json helpers]
// ## 2024-05-24 - [Schema] Mess: [Inconsistent Attribute Keys] Tidy: [Standardized to 3-letter codes with Zod migration]
// ## 2024-05-25 - [Schema] Mess: [Inconsistent form data parsing] Tidy: [Standardized to CharacterFormSchema and safe Zod preprocessing]
// ## 2024-05-25 - [Schema] Mess: [Untyped log types and action inputs] Tidy: [Enforced Zod schemas for actions and logs]

import { Character, LogEntry, Campaign, Encounter, Settings } from '@prisma/client';
import { Attributes, Conditions, Inventory, Participant, Participants, LogType, AttackAction, SkillCheckAction, SpellCastAction } from '@/lib/schemas';

export type { Character, LogEntry, Campaign, Encounter, Settings };
export type { Attributes, Conditions, Inventory, Participant, Participants, LogType, AttackAction, SkillCheckAction, SpellCastAction };
