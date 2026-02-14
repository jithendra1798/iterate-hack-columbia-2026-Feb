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



## 5-Hour Battle Plan (11:30 AM → 4:30 PM Code Freeze)

---

### Team Roles

**Person A — Agent Brain (Claude + Game Logic)**
**Person B — Backend + Blaxel Sandbox**
**Person C — Frontend + UI**
**Person D — Voice (ElevenLabs) + White Circle + Demo**

---

### PHASE 1: Foundation (11:30 - 12:30)

**Person A — Agent Brain**
Build the Claude agent with tool-use capabilities. This is the brain of the entire game.

What to do:
- Create a Python file `agent.py`
- Use the Anthropic Python SDK with tool use (function calling)
- Define the system prompt for CIPHER (the AI partner persona)
- Define 4 tools as JSON schemas: `execute_code`, `analyze_logs`, `decrypt_message`, `plan_escape_route`
- Write the game script — what CIPHER says at each phase, what choices it presents to the human
- Test that Claude responds in character and correctly calls tools when needed

Tech: Python, Anthropic SDK, JSON tool schemas

Key detail: The agent should NEVER solve things alone. Every tool call should be preceded by the agent presenting 2-3 options to the human and waiting for their choice. Hardcode this in the system prompt.

---

**Person B — Backend Server**
Build the FastAPI server that holds game state and connects everything.

What to do:
- Create `server.py` with FastAPI
- Set up WebSocket endpoint at `/ws/game` for real-time communication between frontend and agent
- Build a game state machine with these states: `BRIEFING → CHALLENGE_1 → CHALLENGE_2 → CHALLENGE_3 → DEBRIEF`
- Each state holds: current challenge data, timer value, score, conversation history
- Create REST endpoints: `POST /start` (new game), `GET /state` (current state), `POST /action` (player choice)
- Connect to Blaxel SDK — when the agent calls `execute_code`, actually run it in a Blaxel sandbox and return the result

Tech: Python, FastAPI, uvicorn, websockets, Blaxel SDK

Key detail: Keep a 5-minute global timer. Send timer updates to frontend every second via WebSocket. When timer hits 0, game over regardless of progress.

---

**Person C — Frontend**
Build the heist UI. Dark, neon, terminal aesthetic.

What to do:
- Use Lovable OR scaffold a React app with Vite
- Build 4 screens:
  - **Briefing Screen**: Shows the "vault blueprint" (a styled diagram), CIPHER's intro text appears typewriter-style
  - **Challenge Screen**: Split layout — left side is a terminal showing agent messages and player choices as clickable buttons, right side shows the puzzle visual (server logs for C1, cipher text for C2, map for C3)
  - **Score Screen**: Heist completion stats — time taken, choices made, partnership rating
  - **Timer Bar**: Always visible at top, red when under 60 seconds
- Connect to backend via WebSocket
- When agent sends a message, display it in the terminal. When agent presents choices, show them as buttons the player clicks

Tech: React, Vite, Tailwind CSS, WebSocket client

Key detail: Use a monospace font, dark background with green/cyan neon accents. Think "hacker movie terminal." Lovable can scaffold this fast, then customize.

---

**Person D — Voice + Monitoring**
Make CIPHER speak and add the White Circle safety layer.

What to do:
- Set up ElevenLabs text-to-speech — pick a deep, calm male voice for CIPHER
- Create `voice.py` — a function that takes agent text output, sends to ElevenLabs TTS API, returns audio
- Stream the audio to the frontend via WebSocket (send as base64 audio chunks)
- Set up ElevenLabs speech-to-text for the player's voice input (or use browser's built-in Web Speech API as fallback — this is simpler and doesn't need credits)
- Set up White Circle SDK — create a monitoring function that checks every agent response for hallucinations and validates tool call arguments before execution

Tech: ElevenLabs API, White Circle SDK, Python

Key detail: Voice is a NICE-TO-HAVE. If it's not working by 2:30 PM, drop it. The game works fine with typed input and text output. Don't let voice block the core experience.

---

### PHASE 2: Challenges Built (12:30 - 2:00, includes lunch)

Grab lunch at 12:30 when it's served. Eat while working.

**Person A — Write the 3 Challenges**

*Challenge 1: "Bypass the Firewall"*
- Generate fake server logs (pre-written, stored as a string)
- Agent analyzes the logs using `analyze_logs` tool
- Agent finds 3 possible vulnerabilities and presents them to human: SQL injection, open port, expired SSL cert
- Only one is correct (SQL injection). If human picks wrong, lose 60 seconds
- If human picks right, agent calls `execute_code` with a Python exploit script that runs in Blaxel and returns "ACCESS GRANTED"

*Challenge 2: "Crack the Vault Code"*
- A substitution cipher is displayed on screen (Person C builds the visual)
- Agent can brute-force the first half using `decrypt_message` tool
- Second half requires the human to spot a pattern in a visual clue (e.g., the first letter of each line spells a word)
- Human types the answer, agent combines both halves, vault opens

*Challenge 3: "The Escape"*
- Agent calls `plan_escape_route` which returns 2 possible routes with tradeoffs
- Route A: Fast but goes past security (risky)
- Route B: Slow but safe (costs time)
- Human picks, then a second decision point appears based on their choice
- This is a branching decision tree — 2 decisions, 4 possible outcomes

Write all of this as structured Python — each challenge is a function that takes player input and returns the next game state.

---

**Person B — Wire Agent to Sandbox**

- Connect Person A's tool calls to real Blaxel execution
- When `execute_code` is called, send the code to Blaxel sandbox, capture stdout/stderr, return to agent
- When `analyze_logs` is called, feed the fake logs and return the analysis
- Handle timeouts — if Blaxel takes >5 seconds, return a failure and let the agent adapt
- Test each challenge end-to-end: player choice → agent tool call → Blaxel execution → result back to agent → agent responds

---

**Person C — Challenge UIs**

- **Challenge 1 UI**: Terminal window that shows scrolling server logs on the right. Left side shows CIPHER's messages. Three buttons appear for the player's choice
- **Challenge 2 UI**: Cipher text displayed in a styled "vault door" visual. Input field for the player's answer
- **Challenge 3 UI**: Simple map graphic (can be an SVG or even ASCII art). Two route options highlighted. Buttons to choose

Keep it simple. Styled divs with Tailwind. Don't over-engineer the visuals — the terminal aesthetic is forgiving.

---

**Person D — Integration + Voice Polish**

- Wire voice output: agent text → ElevenLabs TTS → audio plays in browser
- Wire voice input: browser mic → text → sent to backend as player's choice
- Add sound effects: alarm sound when wrong choice, "access granted" beep on success, ticking clock ambient sound (find free .mp3 files online)
- Set up White Circle: before each agent tool call executes, send the tool call to White Circle for validation. Log the results. This gives you the Track 2 story for judges

---

### PHASE 3: Integration + Testing (2:00 - 3:00)

**ALL FOUR PEOPLE: Stop building new features. Wire everything together.**

Integration checklist:
1. Frontend connects to backend WebSocket — confirmed
2. Player clicks "Start Heist" → briefing loads → CIPHER speaks/types intro
3. Challenge 1 flows: logs appear → agent presents choices → player clicks → agent executes code → result shown
4. Challenge 2 flows: cipher appears → agent decrypts half → player inputs answer → vault opens
5. Challenge 3 flows: map appears → routes shown → player picks → outcome resolves
6. Score screen appears with stats
7. Timer works and ends game at 0
8. Voice works (or fall back to text)

**Do 3 full playthroughs.** Fix every bug you find. If something is flaky, simplify it rather than debugging for 30 minutes.

---

### PHASE 4: Demo Prep (3:00 - 3:30)

**Person A**: Write the 2-minute pitch script (see below)

**Person B**: Make sure the backend runs reliably, deploy if possible, have a backup plan (run locally)

**Person C**: Add any final visual polish — make the score screen look good, this is the last thing judges see

**Person D**: Record a backup video of a successful playthrough. If live demo breaks, play the video

---

### PHASE 5: Buffer (3:30 - 4:30)

Fix last bugs. Practice the pitch 3 times. Commit everything. Breathe.

---

### Demo Script (2 minutes)

Person A presents:

*"Every agent at this hackathon works FOR you. Ours works WITH you.*

*We built a framework for real-time human-AI collaboration — the agent has skills you don't, you have judgment it doesn't, and neither can succeed alone.*

*To prove it works, we turned it into a game. You have 5 minutes to rob a virtual bank with an AI partner named CIPHER. Let me show you."*

→ Start the heist. CIPHER's voice: *"Alright partner, here's the target..."*
→ Play through Challenge 1 quickly, show the voice interaction, show the code executing in the sandbox
→ Skip to the score screen

*"Under the game, this is a real collaboration framework — the agent reasons, uses tools, adapts when you make mistakes, and defers to human judgment on hard calls. We used Blaxel for sandboxed code execution and White Circle to monitor every agent decision for safety.*

*The heist is the demo. The framework works for incident response, medical procedures, or any high-stakes scenario where humans and AI must work together under pressure.*

*Want to try it? You've got 5 minutes."*

Hand the controller to the judge.

---

### Emergency Fallbacks

| If this breaks... | Do this instead |
|---|---|
| Voice not working | Text input/output. Still works perfectly |
| Blaxel down | Mock the code execution with pre-written responses |
| White Circle issues | Log agent decisions to a file, show the log as "monitoring" |
| Challenge 2 puzzle too hard | Simplify to a basic riddle |
| No time for Challenge 3 | Ship with 2 challenges. Two solid challenges > three broken ones |

---

**Golden rule: A working 2-challenge demo beats a broken 3-challenge demo every time. Cut scope ruthlessly if you're behind at 2:00 PM.**

Want me to write the actual starter code for any of the four roles?
