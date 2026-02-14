# HEIST Frontend Contract

Quick reference for Person C — all the data structures and WebSocket messages you need.

---

## Connection

### WebSocket
```
ws://localhost:8000/ws/game/{game_id}
```

Generate a random game_id on the frontend (e.g., `crypto.randomUUID()`), then connect.

### REST Endpoints (alternative to WebSocket)
```
GET  /api/health                         → {"status": "ok", "api_key_set": true, "active_games": 3}
POST /api/game/start                     → {game_id, cipher_message, game_state, challenge_data}
POST /api/game/{id}/action               → {cipher_message, tool_calls, game_state, phase, challenge_data}
GET  /api/game/{id}/state                → {phase, score, time_remaining, choices_made, penalties}
GET  /api/game/{id}/challenge-data       → Challenge data for current phase
GET  /api/challenge/{challenge_id}       → Raw challenge data
```

---

## WebSocket Messages

### Messages YOU Send (Frontend → Backend)

#### Start the game
```json
{"type": "start_game"}
```

#### Player input (chat message or button click)
```json
{"type": "player_input", "text": "I choose SQL injection"}
```

---

### Messages YOU Receive (Backend → Frontend)

#### 1. CIPHER's message
```json
{
  "type": "cipher_message",
  "text": "*Connection established*\n\nWelcome partner. We're hitting Nexus Financial tonight — 50 million in crypto behind three security layers. Ready to go?",
  "phase": "BRIEFING",
  "game_state": {
    "phase": "BRIEFING",
    "score": 0,
    "time_remaining": 300,
    "choices_made": [],
    "penalties": []
  }
}
```

#### 2. Tool call (show loading animation)
```json
{
  "type": "tool_call",
  "tool": "analyze_logs",
  "input": {"log_source": "firewall", "depth": "quick"},
  "result": "{\"status\": \"complete\", \"findings\": [...]}"
}
```
**Display:** `[CIPHER is hacking... analyze_logs]` with animation

#### 3. Phase change (update challenge panel)
```json
{
  "type": "phase_change",
  "new_phase": "CHALLENGE_1",
  "challenge_data": {
    "title": "BYPASS THE FIREWALL",
    "subtitle": "Nexus Financial — External Perimeter",
    "display_content": "[2026-02-14 08:31:02] AUTH | ...",
    "display_type": "terminal_logs",
    "options": [
      {"id": "a", "label": "SQL Injection", "desc": "Exploit the unparameterized login query"},
      {"id": "b", "label": "Brute Force Port 8080", "desc": "Attack the exposed debug port"},
      {"id": "c", "label": "SSL Certificate Exploit", "desc": "Leverage the expired cert"}
    ]
  }
}
```

#### 4. Timer update (every second)
```json
{
  "type": "timer_update",
  "time_remaining": 299
}
```

#### 5. Game over
```json
{
  "type": "game_over",
  "score": {
    "base_score": 75,
    "time_bonus": 24,
    "total_score": 99,
    "time_remaining": 240,
    "correct_choices": 3,
    "total_choices": 3,
    "penalties": [{"seconds": 60, "reason": "Escape time"}],
    "choices": [
      {"phase": "CHALLENGE_1", "choice": "SQL Injection", "correct": true},
      {"phase": "CHALLENGE_2", "choice": "SESAME", "correct": true},
      {"phase": "CHALLENGE_3", "choice": "Move slowly", "correct": true}
    ],
    "grade": "PROFESSIONAL — Got the job done"
  }
}
```

#### 6. Error
```json
{
  "type": "error",
  "message": "Failed to start game: ANTHROPIC_API_KEY not configured"
}
```

---

## Challenge Data Structures

### BRIEFING Phase
```json
{
  "phase": "BRIEFING",
  "title": "MISSION BRIEFING",
  "subtitle": "Nexus Financial Digital Vault",
  "description": "3 security layers to breach. Your AI partner CIPHER will guide you.",
  "display_type": "briefing"
}
```

### CHALLENGE_1: Firewall (terminal_logs)
```json
{
  "title": "BYPASS THE FIREWALL",
  "subtitle": "Nexus Financial — External Perimeter",
  "display_type": "terminal_logs",
  "display_content": "[2026-02-14 08:31:02] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | user=admin\n[2026-02-14 08:31:03] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | user=admin  \n[2026-02-14 08:31:15] NET    | 0.0.0.0       | Port 8080 LISTENING     | DEBUG MODE ACTIVE\n[2026-02-14 08:31:22] SSL    | admin.nexus    | CERT EXPIRED            | renewal pending\n[2026-02-14 08:32:01] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | query=SELECT * FROM users WHERE name='${input}'\n[2026-02-14 08:32:15] IDS    | 0.0.0.0       | Port 8080 MONITORED     | alert_threshold=1\n[2026-02-14 08:33:00] SSL    | admin.nexus    | PATCH DEPLOYED          | cert renewed 2h ago\n[2026-02-14 08:33:45] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | input NOT sanitized\n[2026-02-14 08:34:02] NET    | 10.0.0.1      | Firewall rule updated   | port 443 open\n[2026-02-14 08:34:30] AUTH   | WARNING        | SQL query concatenation | no parameterization detected",
  "options": [
    {"id": "a", "label": "SQL Injection", "desc": "Exploit the unparameterized login query"},
    {"id": "b", "label": "Brute Force Port 8080", "desc": "Attack the exposed debug port"},
    {"id": "c", "label": "SSL Certificate Exploit", "desc": "Leverage the expired cert"}
  ]
}
```

**Rendering tip:** Split `display_content` by `\n` and render each line in a terminal-style component. Color-code by log type (AUTH = green, NET = blue, SSL = yellow, IDS = red, WARNING = orange).

### CHALLENGE_2: Vault Code (cipher_text)
```json
{
  "title": "CRACK THE VAULT CODE",
  "subtitle": "Nexus Financial — Inner Vault",
  "display_type": "cipher_text",
  "display_content": "\nShadows fall across the digital walls\nEvery circuit hums with encrypted light  \nSystems locked behind quantum shields\nA thousand keys have failed before\nMachines guard what humans desire\nEnter only those who see the pattern\n",
  "agent_decoded": "OPEN",
  "input_prompt": "Enter the second half of the code..."
}
```

**The puzzle:** First letter of each line spells `SESAME`. Full code is `OPENSESAME`.

**Rendering tip:** Display the poem with each line on its own row. Maybe highlight the first letter of each line subtly or with a slight glow.

### CHALLENGE_3: Escape (map)
```json
{
  "title": "THE ESCAPE",
  "subtitle": "⚠ ALARM TRIGGERED — GET OUT NOW",
  "display_type": "map",
  "routes": [
    {
      "id": "a",
      "label": "Route A: Ventilation Shaft",
      "desc": "Fast but risky — motion sensors",
      "time": "~90 seconds",
      "risk": "HIGH"
    },
    {
      "id": "b",
      "label": "Route B: Service Tunnel",
      "desc": "Slow but safe — no sensors",
      "time": "~180 seconds",
      "risk": "LOW"
    }
  ]
}
```

**Rendering tip:** Two cards side by side. Route A has red/orange risk indicator, Route B has green. Make them clickable.

### DEBRIEF Phase (score)
```json
{
  "phase": "DEBRIEF",
  "title": "HEIST COMPLETE",
  "display_type": "score",
  "score": {
    "base_score": 75,
    "time_bonus": 24,
    "total_score": 99,
    "time_remaining": 240,
    "correct_choices": 3,
    "total_choices": 3,
    "penalties": [{"seconds": 60, "reason": "Escape time"}],
    "choices": [
      {"phase": "CHALLENGE_1", "choice": "SQL Injection", "correct": true},
      {"phase": "CHALLENGE_2", "choice": "SESAME", "correct": true},
      {"phase": "CHALLENGE_3", "choice": "Move slowly", "correct": true}
    ],
    "grade": "PROFESSIONAL — Got the job done"
  }
}
```

**Grade values:**
- `LEGENDARY — Master thieves` (≥120 points)
- `ELITE — The vault never stood a chance` (≥100 points)
- `PROFESSIONAL — Got the job done` (≥75 points)
- `AMATEUR — Messy but alive` (≥50 points)
- `BUSTED — Better luck next heist` (<50 points)

---

## Phases Flow

```
BRIEFING → CHALLENGE_1 → CHALLENGE_2 → CHALLENGE_3 → DEBRIEF
```

Each phase transition sends:
1. `phase_change` message (if WebSocket)
2. `cipher_message` with CIPHER's narrative

---

## Button Click → WebSocket Message

When user clicks a button, send as player_input:

**Challenge 1 buttons:**
```javascript
// When "SQL Injection" clicked:
ws.send(JSON.stringify({type: "player_input", text: "I choose SQL injection"}))

// When "Brute Force Port 8080" clicked:
ws.send(JSON.stringify({type: "player_input", text: "I choose brute force"}))

// When "SSL Certificate Exploit" clicked:
ws.send(JSON.stringify({type: "player_input", text: "I choose SSL exploit"}))
```

**Challenge 2 text input:**
```javascript
// When user submits code guess:
ws.send(JSON.stringify({type: "player_input", text: userInput}))
```

**Challenge 3 route buttons:**
```javascript
// When "Route A" clicked:
ws.send(JSON.stringify({type: "player_input", text: "ventilation shaft"}))

// When "Route B" clicked:
ws.send(JSON.stringify({type: "player_input", text: "service tunnel"}))
```

---

## Styling Reference

**Colors:**
- Background: `#0a0a0a`
- Primary (neon green): `#00ff41`
- Secondary (cyan): `#00d4ff`
- Warning (red): `#ff4141`
- Text: `#ffffff`

**Fonts:**
- JetBrains Mono or Fira Code (monospace)
- Google Fonts: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap`

---

## Quick Test

```bash
# Start server
python server.py

# Test health
curl http://localhost:8000/api/health

# Start game
curl -X POST http://localhost:8000/api/game/start

# Use game_id from response
curl -X POST http://localhost:8000/api/game/{game_id}/action \
  -H "Content-Type: application/json" \
  -d '{"input": "ready"}'
```
