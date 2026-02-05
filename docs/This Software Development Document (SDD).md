This Software Development Document (SDD) synthesizes the current codebase architecture (Next.js/Prisma) with the requested expansions (Mobile Player App, QR Codes) and the established operational protocols (Git Logging, AI Integration).GEMINI Project: Software Design DocumentProject Code: DugongsAndDressesVersion: 2.0 (Mobile Expansion Draft)Tech Stack: Next.js 16, TypeScript, Prisma, SQLite, Tailwind CSS 41. Executive SummaryThe GEMINI Project is a Dungeons & Dragons campaign management platform designed to bridge the gap between table-top mechanics and AI-assisted storytelling. It functions as a "Hybrid Digital DM Screen," allowing the Dungeon Master to track state (HP, Initiative), log narrative events, and generate context for external Large Language Models (LLMs) like Gemini 1.5 Pro.Current State: A functional DM Dashboard and Passive Public Display using polling for state synchronization.Development Goal: Expand to a "Player Second Screen" experience via a mobile webapp, orchestrated via QR codes, with automated Git-based session logging.2. System Architecture2.1 High-Level DesignThe application is a Monolithic Next.js application using Server Actions for data mutation and React Server Components (RSC) for rendering.Host: Local Network (Tailscale/Cloudflare Tunnel recommended for external access).Database: SQLite (local file dev.db), managed via Prisma ORM.State Sync: Currently relies on revalidatePath (Server Actions) and Client-Side Polling (AutoRefresh.tsx) for the Public view.2.2 Directory Structure (Key Components)Plaintextsrc/
├── app/
│   ├── dm/           # DM Dashboard (Write Access)
│   ├── public/       # Passive TV Display (Read Only)
│   ├── player/       # Mobile Player Interface (Character Selection & Stats)
│   └── actions.ts    # Server Actions (Mutations: Roll, HP, Turn, Logs)
├── components/
│   ├── DiceRoller.tsx        # Digital Dice Logic
│   ├── TurnTracker.tsx       # Initiative Management
│   ├── PlayerHPControls.tsx  # Mobile-optimized HP management
│   ├── PlayerActionForm.tsx  # Action submission for players
│   └── HPControls.tsx        # DM-side Health Editing
└── lib/
    └── prisma.ts     # DB Singleton
2.3 UI Design System
The frontend utilizes a standardized component library located in `src/components/ui`.
- **Button**: Supports variants (primary, secondary, destructive, success, outline, ghost).
- **Card**: Container for grouping content.
- **Input**: Standardized text input.
- **Badge**: Status indicators.
- **CampaignSelector**: Dropdown for switching active campaigns.

3. Data Schema & PersistenceSource: prisma/schema.prismaThe database acts as the single source of truth for the game state.ModelDescriptionKey FieldsCampaignThe container for a game world.active (Bool), name (String)CharacterPlayers and NPCs.attributes (JSON), conditions (JSON), activeTurn (Bool), initiativeRoll (Int)LogEntryThe narrative history.content (String), type (Enum-like: "Story", "Roll")EncounterGroupings for combat.status (String), participants (JSON)4. Feature Specifications4.1 DM Dashboard (Existing)Turn Tracker: Displays characters sorted by initiative. Allows toggling activeTurn.Dice Tray: Supports d4-d20 rolls with Advantage/Disadvantage toggles. Logs results directly to LogEntry.AI Bridge: AICopyButton aggregates the last 5 logs, current character health/status, and initiative order into a prompt-ready text block for external LLMs.Quick Actions: Placeholder buttons for generic moves (Attack, Skill Check).4.2 Public Display (Existing)Visuals: High-contrast, read-only view for a TV screen.State Feedback:Health Bars: Dynamic width (Green/Red based on HP%).Active Turn: Visual highlight/scaling of the active character.Sync: Uses AutoRefresh component (polls every 3s) to fetch latest Server state.4.3 Mobile Player Webapp (Implemented) Access Point: /player/[id] (Dynamic Route). Core Functions: - HP Management: Large, thumb-friendly buttons for rapid health tracking. - Action Log: View of the last 10 campaign events. - Intent Submission: Text field to declare actions (e.g., "I swing my axe") which logs directly to the DM screen. - Real-time Sync: Polling every 2s for initiative and status updates. - Design: High-contrast Agent Mesh theme (Navy/Blue/Neon). 5. Protocols & Workflows5.1 The "GEMINI" Loop (AI Integration)Defined in GEMINI.md and AICopyButton.tsx.State Change: DM or Player logs an action/roll.Aggregation: System compiles Turn Order + Character Status + Recent Logs.Extraction: DM clicks "Copy AI Context".Generation: Context pasted into LLM (e.g., "Describe the goblin's reaction").Injection: LLM output is pasted back into the Game Log via DM Dashboard.5.2 GitOps Logging ProtocolTrigger: End of Turn or Significant Event.Mechanism:The application queries LogEntry for the current session.Formats entries into a Markdown file (e.g., session_logs/turn_05.md).System Automation: A background worker (or the ralph_loop.ps1 script) detects the new file, stages it, and commits to Git: git commit -m "Log: Turn 05 complete".6. Implementation Plan: Mobile & QR6.1 QR Code Generation (Local Network)To allow players to join without typing IPs:Server-Side: Detect local IP (e.g., 192.168.1.x).Route: src/app/join/page.tsx.Logic: Render a QR code encoding: http://[LOCAL_IP]:3000/play?char=[CHARACTER_ID].Display: Added to the DM Dashboard header ("Invite Players" button).6.2 Mobile Interface (src/app/play/page.tsx)Code Logic:TypeScript// Conceptual implementation for the new feature
export default function PlayerPage({ searchParams }: { searchParams: { char: string } }) {
  const character = await prisma.character.findUnique({ where: { id: searchParams.char }});
  
  async function submitAction(formData: FormData) {
    'use server'
    await logAction(character.campaignId, 
      `${character.name} attempts: ${formData.get('intent')} (Roll: ${formData.get('roll')})`, 
      "PlayerAction"
    );
  }

  return (
    <form action={submitAction} className="mobile-layout">
      <h1>{character.name}</h1>
      <input name="intent" placeholder="What do you do?" />
      <input name="roll" type="number" placeholder="Dice Result" />
      <button type="submit">End Turn</button>
    </form>
  )
}
7. RoadmapImmediate: Implement src/app/play route and QR generation.Short Term: Refine ralph_loop.ps1 to automatically export Prisma Logs to Markdown files for the Git Sync protocol.Long Term: Replace Polling (AutoRefresh) with Next.js streaming or Websockets for instant dice roll visibility on the DM screen.



8. Database for Long-Standing Campaigns
Yes, the system is designed to support this. The project uses a persistent SQLite database (managed via Prisma) that is structured to handle long-term campaign data.

Evidence: The database schema explicitly defines a Campaign model that serves as a container for all game data.

Data Persistence: Every Campaign is linked to its own Character lists, LogEntry history, and Encounter data. This means you can have multiple different campaigns stored in the same database file (dev.db), each with its own independent history and party members.

9. Easy Way to Resume Any Choice of Campaign
Not yet implemented in the User Interface. While the database supports multiple campaigns, the current application code does not yet have a "Load Game" or "Campaign Selector" screen.

Current Behavior: The DM Dashboard currently defaults to loading only the first active campaign it finds in the database (const campaign = campaigns[0];).

Missing Feature: There is currently no UI element (like a dropdown or menu) that allows you to switch between different campaigns or "resume" a specific one if you have multiple running.

Recommendation: To fulfill your requirement for an "easy way to resume," a "Campaign Selection" screen needs to be added to the implementation plan. This would list all available campaigns and allow the DM to set the "Active" session before loading the dashboard.