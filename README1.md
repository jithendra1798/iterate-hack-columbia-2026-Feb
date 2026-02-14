# HEIST — Human-AI Collaborative Heist Game

## Quick Start

```bash
cd heist
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key-here"

# Test agent standalone (terminal mode)
python agent.py

# Run full server
python server.py
# → Server at http://localhost:8000
```

## Team API Contract

### REST Endpoints (Person C → Person B)

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/game/start` | `{}` | `{game_id, cipher_message, game_state, challenge_data}` |
| POST | `/api/game/{id}/action` | `{input: "player text"}` | `{cipher_message, tool_calls, game_state, phase, challenge_data}` |
| GET | `/api/game/{id}/state` | — | `{phase, score, time_remaining, choices_made, penalties}` |
| GET | `/api/challenge/{id}` | — | Challenge display data |

### WebSocket Messages (Person C ↔ Person B)

**Connect:** `ws://localhost:8000/ws/game/{game_id}`

**Frontend → Backend:**
```json
{"type": "start_game"}
{"type": "player_input", "text": "I choose option A"}
```

**Backend → Frontend:**
```json
{"type": "cipher_message", "text": "...", "phase": "CHALLENGE_1", "game_state": {...}}
{"type": "tool_call", "tool": "execute_code", "input": {...}, "result": "..."}
{"type": "phase_change", "new_phase": "CHALLENGE_2", "challenge_data": {...}}
{"type": "timer_update", "time_remaining": 240}
{"type": "game_over", "score": {...}}
```

### Game Phases
`BRIEFING → CHALLENGE_1 → CHALLENGE_2 → CHALLENGE_3 → DEBRIEF`

### Challenge Data (Person C uses these for UI)

**Challenge 1** — Terminal showing server logs, 3 clickable option buttons
**Challenge 2** — Cipher text displayed artistically, text input field
**Challenge 3** — Two route cards to choose between, then a follow-up choice

Call `GET /api/challenge/challenge_1` etc. to get display data.

## File Structure
```
heist/
├── agent.py          # Person A — Claude agent + game logic (DONE)
├── server.py         # Person B — FastAPI + WebSocket + Blaxel
├── requirements.txt  # Python dependencies
├── frontend/         # Person C — React app
└── voice.py          # Person D — ElevenLabs + White Circle
```
