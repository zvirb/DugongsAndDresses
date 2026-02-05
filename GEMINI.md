# GEMINI Project Protocols

## Campaign Management
### Turn-by-Turn Logging
- The application tracks gameplay turn-by-turn.
- **Protocol**: After each turn is completed and logged in the application, specific state or log files should be committed to git and synced. 
  - *Note: Ensure we are defining WHAT is being committed (likely a markdown log export, not the binary DB).*

## AI Integration
- **Copy-Paste Workflow**: The DM Dashboard allows copying "Next Actions" for pasting into external LLM interfaces (e.g., Gemini 1.5 Pro).
