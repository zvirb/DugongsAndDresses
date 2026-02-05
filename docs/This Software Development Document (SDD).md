# This Software Development Document (SDD)

The **Dugongs & Dresses** project (Code: **GEMINI**) is a next-generation Dungeons & Dragons campaign management platform. It bridges the gap between physical tabletop play and AI-assisted storytelling through a hybrid digital environment.

## 1. Executive Summary

The GEMINI Project functions as a "Hybrid Digital DM Screen," allowing the Dungeon Master to track state (HP, Initiative), log narrative events, and generate high-fidelity context for external Large Language Models (LLMs) like Gemini 1.5 Pro.

- **Primary Goal**: Seamlessly integrate digital automation with traditional TTRPG mechanics.
- **Secondary Goal**: Provide a mobile "Player Second Screen" experience for real-time interaction.
- **Design Philosophy**: **Agent Mesh** — High-contrast, performance-oriented UI using Neon Blue (#2b2bee) and Dark Navy (#101022).

---

## 2. System Architecture

### 2.1 Tech Stack
- **Framework**: Next.js 15+ (App Router, Server Actions, RSC)
- **Language**: TypeScript (Strict Mode)
- **Database**: SQLite (Local persistent storage via Prisma ORM)
- **Styling**: Tailwind CSS 4.0 (Custom design tokens for Agent Mesh)
- **Testing**: Vitest + React Testing Library

### 2.2 Directory Structure
```plaintext
src/
├── app/
│   ├── dm/           # DM Dashboard (Write Access, Campaign Management)
│   ├── public/       # Passive TV Display (Read-Only Polling)
│   ├── player/       # Mobile Player Experience (Character-specific UI)
│   └── actions.ts    # Standardized Server Actions
├── components/
│   ├── ui/           # Atomic Design System (Button, Card, Badge, Input)
│   ├── DiceRoller/   # Physics-free digital dice logic
│   ├── TurnTracker/  # Reactive initiative management
│   └── ...           # Specialized feature components
├── lib/
│   ├── queries.ts    # Standardized, cached DB read operations
│   ├── actions-utils.ts # Error-handling wrappers for mutations
│   └── prisma.ts     # Database singleton
└── types/            # Centralized TypeScript definitions
```

---

## 3. Data Schema & Persistence

The system uses a persistent SQLite database (`dev.db`) managed via Prisma. 

### 3.1 Key Models
- **Campaign**: The root container for a game world. Supports multi-campaign residency.
- **Character**: Stores stats, level, race, class, and session state (HP, initiative, active turn).
- **LogEntry**: Narrative history and mechanical results (Rolls, Combat actions).
- **Encounter**: Temporary groupings for combat scenarios.

### 3.2 Standardized Features
- **Timestamps**: All models include `createdAt` and `updatedAt`.
- **Cascade Deletes**: Deleting a Campaign cleans up all associated Characters and Logs.
- **JSON Storage**: Flexible attributes and conditions stored as JSON strings.

---

## 4. Feature Specifications

### 4.1 DM Dashboard
The central hub for game orchestration.
- **Campaign Selector**: Real-time switching between active campaigns.
- **Initiative Tracker**: Automated sorting and turn management with visual "Active" indicators.
- **Dice Tray**: Digital rolls with advantage/disadvantage toggles.
- **AI Bridge**: `AICopyButton` aggregates logs, turn order, and status into a prompt-ready context for LLMs.

### 4.2 Player Mobile Experience
Mobile-optimized web interface accessible via `/player`.
- **Hero Selection**: Dynamic list of characters from the active campaign.
- **HP Management**: Large, thumb-friendly controls for rapid tracking.
- **Tactical Logging**: Players submit intents (e.g., "I cast Fireball") directly to the DM's log.
- **Real-time Sync**: High-frequency polling (2s) for instant turn awareness.

### 4.3 Public Display
Passive view designed for high-resolution monitors or TVs.
- **Visual Feedback**: Dynamic health bars and active character highlights.
- **Polling Sync**: Uses `AutoRefresh` component to maintain state without user interaction.

---

## 5. Protocols & Workflows

### 5.1 The "GEMINI" Loop
1. **Mechanical Action**: DM or Player performs a roll or HP change.
2. **Context Aggregation**: System compiles current session state.
3. **LLM Interaction**: DM copies context to external LLM (Gemini 1.5 Pro).
4. **Narrative Injection**: LLM-generated descriptions are logged back into the system.

### 5.2 GitOps Logging
The `ralph_loop.ps1` script periodically exports `LogEntry` records to Markdown files, which are committed to the repository. This provides a version-controlled, permanent record of the campaign's narrative progression.

---

## 6. Testing Strategy

The project maintains high reliability through a comprehensive testing suite:
- **Unit Testing**: Logic-heavy utilities in `lib/` and `actions-utils.ts`.
- **Component Testing**: Vitest/RTL tests for UI components (`DiceRoller.test.tsx`, `HPControls.test.tsx`).
- **Integration Testing**: Server Action flows and Prisma query validation.

---

## 7. Usage Examples

### 7.1 AI Bridge Context Example
When the DM clicks "Copy AI Context", the following structured data is prepared for the LLM:
```text
Campaign: The Whispering Woods
Active Turn: Thistle (Elf Rogue)

Initiative Order:
1. Thistle (22) - CURRENT
2. Orc Grunt (15)
3. Borin (12)

Recent Logs:
- [21:45:01] Thistle rolls Stealth: 18
- [21:45:30] Thistle attempts: I sneak behind the orc.
- [21:46:12] DM rolls Attack (Orc): 5 (Miss)

Character Status:
- Thistle: 24/30 HP (Healthy)
- Borin: 12/45 HP (Wounded)
```

### 7.2 Standardized Action Pattern
```typescript
// Example of a mutation using the standardized action wrapper
export const updateHP = actionWrapper(async (id: string, newHp: number) => {
    return await prisma.character.update({
        where: { id },
        data: { hp: newHp }
    });
});
```

---

## 8. Future Roadmap
- **Websockets**: Transition from polling to real-time events for instant feedback.
- **QR Integration**: Auto-generated QR codes on the DM screen for instant player joining.
- **Fog of War**: Hidden NPC stats and private DM notes.
- **Asset Management**: Integrated map viewing and token placement.
