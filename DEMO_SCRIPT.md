# HEIST Demo Script

## Pre-Demo Checklist
1. Close unnecessary browser tabs and apps (conserve CPU/RAM)
2. Set browser to full screen (F11)
3. Test microphone is working
4. Verify backend is running: `curl http://localhost:8000/health`
5. Verify frontend is running: `curl http://localhost:8080/`
6. Have `demo_mode.py` ready as backup

---

## Quick Start
```bash
# One command to start everything:
./start.sh
```

---

## Demo Flow (5 minutes)

### Opening (30 seconds)
"HEIST is a real-time collaborative game where you partner with CIPHER, an AI agent, to pull off a digital heist. You have 5 minutes. Every decision matters."

### Show the Briefing Screen (15 seconds)
- Point out the mission briefing text
- Click "PROCEED TO MISSION"

### Challenge 1: Firewall Bypass (~1:30)
**Goal:** Show human-AI collaboration on security analysis

1. CIPHER introduces the challenge
2. **SAY:** "CIPHER, analyze these server logs"
3. Wait for CIPHER to respond (shows tool calls, analysis)
4. Choose: "SQL injection" or speak "Let's use SQL injection"
5. CIPHER executes the bypass with narration

**Key points to highlight:**
- CIPHER thinks out loud (transparency)
- Tool calls visible in terminal
- Voice input works seamlessly

### Challenge 2: Vault Code (~1:00)
**Goal:** Show the player contributing critical information

1. CIPHER presents the cipher puzzle
2. Observe the HEX codes on screen
3. **SAY:** "Try SESAME" (the correct answer)
4. Watch CIPHER crack the code with dramatic reveal

**Key point:**
- Player's knowledge is essential - AI doesn't just solve everything

### Challenge 3: Extraction (~1:30)
**Goal:** Show real-time decision-making under pressure

1. Three routes appear
2. **SAY:** "Take the ventilation shaft"
3. CIPHER navigates, describing obstacles
4. If prompted about speed: "Let's move carefully"

**Timer pressure:**
- Note the countdown bar at top
- Under 60 seconds = warning buzz

### Debrief (30 seconds)
- Show score breakdown
- Partnership rating based on collaboration
- "Mission successful!" or "We'll get them next time"

---

## Talking Points

### What makes this unique?
1. **True collaboration** - Not AI doing everything, not human alone
2. **Real-time voice** - Natural conversation, no typing required
3. **Shared stakes** - Both succeed or fail together
4. **Explainable AI** - CIPHER shows its reasoning

### Technical highlights
- Claude API with tool use for CIPHER's actions
- ElevenLabs TTS for voice output
- Browser Web Speech API for voice input
- WebSocket for real-time updates
- React + FastAPI architecture

---

## Fallback: Terminal Demo

If browser fails, use terminal demo:
```bash
python demo_mode.py --auto
```

Or interactive mode:
```bash
python demo_mode.py --interactive
```

---

## Troubleshooting

### Mic not working
- Check browser permissions
- Type responses instead - text input always available
- Say "Let me type this one" and use keyboard

### CIPHER not responding
- Check terminal for errors
- Refresh page and click PROCEED again
- Fall back to demo_mode.py

### Audio not playing
- Browser might be blocking autoplay
- Click anywhere on page first
- Mention "CIPHER would speak this response"

### Timer ran out
- Click "TRY AGAIN" to restart
- Or show score screen as "one possible outcome"

---

## Key Quotes for Judges

"HEIST reimagines human-AI collaboration as a high-stakes partnership where both players bring unique strengths."

"The AI doesn't replace the human - it amplifies their capabilities while requiring their insight."

"Every run is different thanks to Claude's adaptive reasoning."

---

## Tech Stack Summary
- **Frontend:** React + TypeScript + Vite + Tailwind
- **Backend:** FastAPI + WebSocket
- **AI:** Claude (Anthropic) with tool use
- **Voice:** ElevenLabs TTS + Browser Speech API
- **Monitoring:** White Circle integration
