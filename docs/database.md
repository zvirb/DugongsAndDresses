# Database Schema

The Dugongs & Dresses database uses SQLite managed via Prisma.

## Standardized Features

### Timestamps
Every model includes `createdAt` and `updatedAt` fields for auditing and sync tracking.

### Cascade Deletes
All entities related to a `Campaign` (Characters, Logs, Encounters) are configured with `onDelete: Cascade`. Deleting a campaign will automatically clean up all associated data.

### Performance
Indexes are explicitly defined on foreign keys (like `campaignId`) to ensure fast lookups as the data grows.

### Data Types
- **Attributes/Conditions**: Stored as JSON strings in SQLite for flexibility.
- **Encounter Participants**: Stored as a JSON string for now, supporting `{ characterId, initiative, currentHp }`.

## Models

### Campaign
The root container for a game world.

### Character
Players and NPCs. Includes session state like `activeTurn` and `initiativeRoll`.

### LogEntry
Narrative events, combat logs, and dice rolls.

### Encounter
Groupings for specific combat scenarios.
