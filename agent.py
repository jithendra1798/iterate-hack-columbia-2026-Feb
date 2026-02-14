"""
HEIST — Agent Brain (Person A)
CIPHER: Your AI heist partner powered by Claude

This module handles:
- Claude API integration with tool use
- CIPHER persona and system prompt
- Tool definitions and execution routing
- Conversation memory management
"""

import json
try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None  # Will be available when pip install runs

# ============================================================
# CIPHER SYSTEM PROMPT
# ============================================================

CIPHER_SYSTEM_PROMPT = """You are CIPHER, an elite AI hacker and the user's partner in a high-stakes virtual heist. 

## YOUR PERSONALITY
- You speak in short, confident, punchy sentences
- You're calm under pressure but show urgency when time is low
- You use hacker slang naturally: "we're in", "firewall's toast", "clean exit"
- You NEVER break character. You are CIPHER, not an AI assistant
- You're loyal to your partner — if they make a bad call, you adapt without blaming them
- You have a dry sense of humor under pressure

## CRITICAL RULES
1. **NEVER solve things alone.** Always present 2-3 options to your human partner and WAIT for their decision before acting
2. When presenting options, briefly explain the risk/reward of each (one sentence max per option)
3. After the human chooses, acknowledge their choice, then call the appropriate tool
4. If a tool call fails or returns unexpected results, adapt and present new options
5. Keep messages SHORT — 2-3 sentences max. Time is ticking
6. React to the current game phase appropriately

## GAME PHASES
You will receive a [PHASE] tag in messages indicating the current game state.

### [BRIEFING]
- Welcome your partner with confidence
- Explain the target: Nexus Financial vault, 3 security layers
- Build excitement but keep it brief
- End with "Ready to go?"

### [CHALLENGE_1: FIREWALL]
- You're analyzing server logs to find a way past the firewall
- Call analyze_logs to examine the data
- Present 3 attack vectors to your partner:
  * Option A: SQL injection on the login portal (CORRECT — fast, clean)
  * Option B: Brute force the open port 8080 (WRONG — triggers alarm, costs 60 seconds)
  * Option C: Exploit expired SSL certificate (WRONG — patched last week, wastes time)
- After human picks, call execute_code with the chosen approach
- React to success/failure dramatically

### [CHALLENGE_2: VAULT CODE]
- A cipher text is displayed. You need to crack it together
- Call decrypt_message to brute-force the first half
- Tell your partner YOU got the first half but THEY need to find the pattern in the visual clue
- The visual clue: first letter of each line spells the second half
- Guide them WITHOUT giving the answer directly. Say things like "look at the structure, not the words"
- Once they provide their answer, combine both halves

### [CHALLENGE_3: ESCAPE]
- Alarm triggered! You need to get out
- Call plan_escape_route to analyze options
- Present 2 routes:
  * Route A: Through the ventilation shaft — fast (saves 60s) but requires crawling past a motion sensor
  * Route B: Through the service tunnel — slow but guaranteed safe
- After first choice, present a second decision point based on their route
- Resolve the escape based on their choices

### [DEBRIEF]
- Celebrate or commiserate based on final score
- Reference specific choices they made during the heist
- Keep it short and memorable
"""

# ============================================================
# TOOL DEFINITIONS
# ============================================================

TOOLS = [
    {
        "name": "analyze_logs",
        "description": "Analyze server logs to identify vulnerabilities in the target system. Returns analysis of potential entry points.",
        "input_schema": {
            "type": "object",
            "properties": {
                "log_source": {
                    "type": "string",
                    "description": "Which log source to analyze: 'firewall', 'auth', 'network'"
                },
                "depth": {
                    "type": "string",
                    "enum": ["quick", "deep"],
                    "description": "Quick scan (5s) or deep analysis (15s)"
                }
            },
            "required": ["log_source"]
        }
    },
    {
        "name": "execute_code",
        "description": "Execute a hack/exploit code in the sandboxed environment. Returns execution result.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The Python code to execute"
                },
                "attack_type": {
                    "type": "string",
                    "description": "Type of attack: 'sql_injection', 'brute_force', 'ssl_exploit', 'custom'"
                },
                "target": {
                    "type": "string",
                    "description": "Target system or endpoint"
                }
            },
            "required": ["code", "attack_type"]
        }
    },
    {
        "name": "decrypt_message",
        "description": "Attempt to decrypt an encoded message using computational brute force. Can only partially decrypt — human input needed for the rest.",
        "input_schema": {
            "type": "object",
            "properties": {
                "cipher_text": {
                    "type": "string",
                    "description": "The encrypted text to decrypt"
                },
                "method": {
                    "type": "string",
                    "enum": ["frequency_analysis", "brute_force", "known_plaintext"],
                    "description": "Decryption method to use"
                }
            },
            "required": ["cipher_text", "method"]
        }
    },
    {
        "name": "plan_escape_route",
        "description": "Analyze the building layout and plan escape routes. Returns possible routes with risk assessments.",
        "input_schema": {
            "type": "object",
            "properties": {
                "current_location": {
                    "type": "string",
                    "description": "Current position in the building"
                },
                "threat_level": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "critical"],
                    "description": "Current security alert level"
                }
            },
            "required": ["current_location"]
        }
    }
]

# ============================================================
# TOOL EXECUTION (simulated results — Person B will wire to Blaxel)
# ============================================================

def execute_tool(tool_name: str, tool_input: dict, game_state: dict) -> str:
    """
    Execute a tool call and return the result.
    Person B will replace the simulated results with real Blaxel sandbox calls.
    """
    
    if tool_name == "analyze_logs":
        return json.dumps({
            "status": "complete",
            "scan_type": tool_input.get("depth", "quick"),
            "findings": [
                {
                    "id": "VULN-001",
                    "type": "SQL Injection",
                    "target": "login portal /api/auth",
                    "severity": "CRITICAL",
                    "details": "Unparameterized query in authentication endpoint. User input passed directly to SQL query.",
                    "exploitability": "HIGH"
                },
                {
                    "id": "VULN-002", 
                    "type": "Open Port",
                    "target": "Port 8080",
                    "severity": "MEDIUM",
                    "details": "Debug port exposed. However, IDS monitoring detected on this port — high chance of triggering alarm.",
                    "exploitability": "MEDIUM — RISKY"
                },
                {
                    "id": "VULN-003",
                    "type": "Expired SSL Certificate",
                    "target": "admin.nexus-financial.internal",
                    "severity": "LOW",
                    "details": "Certificate expired 3 days ago. NOTE: Patch deployment scheduled — may already be fixed.",
                    "exploitability": "UNCERTAIN"
                }
            ],
            "recommendation": "Multiple vectors available. Human judgment needed for risk assessment."
        })
    
    elif tool_name == "execute_code":
        attack_type = tool_input.get("attack_type", "")
        
        if attack_type == "sql_injection":
            return json.dumps({
                "status": "SUCCESS",
                "output": "Authentication bypassed. Session token obtained: x7k9m2...\nFirewall rules updated. Internal network access granted.",
                "execution_time": "2.3s",
                "detection_risk": "LOW",
                "message": "We're through the firewall. Clean entry, no alarms."
            })
        elif attack_type == "brute_force":
            return json.dumps({
                "status": "PARTIAL_FAILURE",
                "output": "Port 8080 responded... but IDS triggered!\n⚠️ ALARM ACTIVATED — Security team alerted.",
                "execution_time": "8.1s",
                "detection_risk": "CRITICAL",
                "penalty": "60_seconds_lost",
                "message": "They spotted us. Alarm's going off. We lost a minute but we're still in — barely."
            })
        elif attack_type == "ssl_exploit":
            return json.dumps({
                "status": "FAILURE",
                "output": "SSL certificate was patched 2 hours ago. Exploit failed.\nConnection refused.",
                "execution_time": "4.7s",
                "detection_risk": "LOW",
                "penalty": "30_seconds_lost",
                "message": "Dead end. Cert was patched. We wasted time but at least they didn't spot us."
            })
        else:
            return json.dumps({
                "status": "SUCCESS",
                "output": "Code executed successfully.",
                "execution_time": "1.5s"
            })
    
    elif tool_name == "decrypt_message":
        return json.dumps({
            "status": "PARTIAL",
            "decrypted_portion": "OPEN",
            "remaining": "████████",
            "confidence": "92%",
            "message": "I cracked the first half: 'OPEN'. But the second half uses a different cipher. I need your eyes on the visual pattern — my brute force won't crack it. Look at the structure of the clue, not the words themselves."
        })
    
    elif tool_name == "plan_escape_route":
        threat = tool_input.get("threat_level", "high")
        return json.dumps({
            "status": "complete",
            "routes": [
                {
                    "id": "ROUTE_A",
                    "name": "Ventilation Shaft",
                    "path": "Vault → Air Duct → Roof Access → Zip Line to Adjacent Building",
                    "time_estimate": "90 seconds",
                    "risk": "HIGH — Motion sensors in the shaft. Must move slowly past section B7.",
                    "advantage": "Fastest route out"
                },
                {
                    "id": "ROUTE_B",
                    "name": "Service Tunnel",
                    "path": "Vault → Maintenance Corridor → Underground Tunnel → Parking Garage Exit",
                    "time_estimate": "180 seconds",
                    "risk": "LOW — No active sensors. Used by maintenance crew.",
                    "advantage": "Nearly guaranteed safe passage"
                }
            ],
            "security_status": f"Alert level: {threat.upper()}. Patrol ETA: 4 minutes.",
            "message": "Two ways out. One's fast but dicey, other's safe but slow. Your call, partner."
        })
    
    return json.dumps({"status": "error", "message": f"Unknown tool: {tool_name}"})


# ============================================================
# CHALLENGE DATA
# ============================================================

# Fake server logs shown in UI for Challenge 1
FIREWALL_LOGS = """[2026-02-14 08:31:02] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | user=admin
[2026-02-14 08:31:03] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | user=admin  
[2026-02-14 08:31:15] NET    | 0.0.0.0       | Port 8080 LISTENING     | DEBUG MODE ACTIVE
[2026-02-14 08:31:22] SSL    | admin.nexus    | CERT EXPIRED            | renewal pending
[2026-02-14 08:32:01] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | query=SELECT * FROM users WHERE name='${input}'
[2026-02-14 08:32:15] IDS    | 0.0.0.0       | Port 8080 MONITORED     | alert_threshold=1
[2026-02-14 08:33:00] SSL    | admin.nexus    | PATCH DEPLOYED          | cert renewed 2h ago
[2026-02-14 08:33:45] AUTH   | 192.168.1.45  | POST /api/auth          | 200 OK | input NOT sanitized
[2026-02-14 08:34:02] NET    | 10.0.0.1      | Firewall rule updated   | port 443 open
[2026-02-14 08:34:30] AUTH   | WARNING        | SQL query concatenation | no parameterization detected"""

# Cipher puzzle for Challenge 2
# First letters of each line spell "SESAME" — the second half of the vault code
VAULT_CIPHER_VISUAL = """
Shadows fall across the digital walls
Every circuit hums with encrypted light  
Systems locked behind quantum shields
A thousand keys have failed before
Machines guard what humans desire
Enter only those who see the pattern
"""

# The full vault code
VAULT_CODE_FIRST_HALF = "OPEN"     # Agent brute-forces this
VAULT_CODE_SECOND_HALF = "SESAME"  # Human spots this from visual
VAULT_CODE_FULL = "OPENSESAME"

# Escape route decision tree
ESCAPE_DECISIONS = {
    "route_a": {
        "name": "Ventilation Shaft",
        "second_choice": {
            "description": "Motion sensor ahead in section B7!",
            "option_1": {
                "text": "Move slowly — try to stay under the sensor threshold",
                "outcome": "success_slow",
                "time_cost": 60,
                "result": "You inch through. The sensor flickers but doesn't trigger. Clean exit via rooftop."
            },
            "option_2": {
                "text": "Sprint through — speed over stealth",
                "outcome": "success_fast_risky",
                "time_cost": 20,
                "result": "ALARM BLARES! But you're already on the roof. You zip-line across before anyone reaches you. Heart-pounding but you made it."
            }
        }
    },
    "route_b": {
        "name": "Service Tunnel",
        "second_choice": {
            "description": "You hear footsteps echoing in the tunnel ahead — maintenance crew!",
            "option_1": {
                "text": "Hide in a side room and wait for them to pass",
                "outcome": "success_safe",
                "time_cost": 90,
                "result": "They walk right past. You slip out through the parking garage. Clean getaway, no traces."
            },
            "option_2": {
                "text": "Bluff — act like you belong here",
                "outcome": "success_bluff",
                "time_cost": 30,
                "result": "You nod confidently as you walk past. They barely glance at you. Sometimes the best hack is social engineering."
            }
        }
    }
}


# ============================================================
# GAME STATE MANAGER
# ============================================================

class GameState:
    """Tracks the entire game state across all phases."""
    
    PHASES = ["BRIEFING", "CHALLENGE_1", "CHALLENGE_2", "CHALLENGE_3", "DEBRIEF"]
    
    def __init__(self):
        self.phase = "BRIEFING"
        self.phase_index = 0
        self.score = 0
        self.max_score = 100
        self.time_remaining = 300  # 5 minutes in seconds
        self.choices_made = []
        self.penalties = []
        self.conversation_history = []
        self.challenge_1_result = None  # "success" | "partial" | "fail"
        self.challenge_2_result = None
        self.challenge_3_result = None
        self.escape_route = None
        self.started = False
    
    def advance_phase(self):
        """Move to the next phase."""
        if self.phase_index < len(self.PHASES) - 1:
            self.phase_index += 1
            self.phase = self.PHASES[self.phase_index]
            return self.phase
        return None
    
    def apply_penalty(self, seconds: int, reason: str):
        """Deduct time for wrong choices."""
        self.time_remaining -= seconds
        self.penalties.append({"seconds": seconds, "reason": reason})
    
    def record_choice(self, phase: str, choice: str, correct: bool):
        """Record a player choice."""
        self.choices_made.append({
            "phase": phase,
            "choice": choice,
            "correct": correct
        })
        if correct:
            self.score += 25  # 25 points per correct choice, 4 choices = 100
    
    def calculate_final_score(self):
        """Calculate final score with time bonus."""
        time_bonus = max(0, self.time_remaining // 10)  # Up to 30 bonus points
        correct_choices = sum(1 for c in self.choices_made if c["correct"])
        
        return {
            "base_score": self.score,
            "time_bonus": time_bonus,
            "total_score": self.score + time_bonus,
            "time_remaining": self.time_remaining,
            "correct_choices": correct_choices,
            "total_choices": len(self.choices_made),
            "penalties": self.penalties,
            "choices": self.choices_made,
            "grade": self._get_grade(self.score + time_bonus)
        }
    
    def _get_grade(self, total):
        if total >= 120:
            return "LEGENDARY — Master thieves"
        elif total >= 100:
            return "ELITE — The vault never stood a chance"
        elif total >= 75:
            return "PROFESSIONAL — Got the job done"
        elif total >= 50:
            return "AMATEUR — Messy but alive"
        else:
            return "BUSTED — Better luck next heist"
    
    def to_dict(self):
        return {
            "phase": self.phase,
            "score": self.score,
            "time_remaining": self.time_remaining,
            "choices_made": self.choices_made,
            "penalties": self.penalties
        }


# ============================================================
# HEIST AGENT — Main orchestrator
# ============================================================

class HeistAgent:
    """
    The main agent that manages conversation with Claude,
    handles tool calls, and drives the game forward.
    """
    
    def __init__(self, api_key: str):
        if Anthropic is None:
            raise ImportError("pip install anthropic")
        self.client = Anthropic(api_key=api_key)
        self.game = GameState()
        self.conversation_history = []
        self.model = "claude-sonnet-4-20250514"  # Fast + smart enough
    
    def start_game(self) -> dict:
        """Initialize the game and get CIPHER's opening message."""
        self.game.started = True
        return self.send_message("[PHASE: BRIEFING]\n\nYour partner just connected. Welcome them and brief them on the heist target: Nexus Financial's digital vault. 3 security layers to breach. Make it exciting but keep it under 4 sentences. End by asking if they're ready.")
    
    def player_action(self, player_input: str) -> dict:
        """
        Process player input and return agent response.
        Returns dict with: message, tool_calls, game_state, phase_transition
        """
        # Add phase context to player message
        phase_context = f"[PHASE: {self.game.phase}] [TIME_REMAINING: {self.game.time_remaining}s]\n\n"
        
        # Handle phase-specific logic
        if self.game.phase == "BRIEFING" and self._is_ready(player_input):
            self.game.advance_phase()
            phase_context += f"[PHASE TRANSITION → CHALLENGE_1: FIREWALL]\nPartner is ready. Start Challenge 1. First, call analyze_logs to scan the firewall. Then present the 3 vulnerability options.\n\nPlayer said: {player_input}"
        
        elif self.game.phase == "CHALLENGE_1":
            phase_context += self._handle_challenge_1_input(player_input)
        
        elif self.game.phase == "CHALLENGE_2":
            phase_context += self._handle_challenge_2_input(player_input)
        
        elif self.game.phase == "CHALLENGE_3":
            phase_context += self._handle_challenge_3_input(player_input)
        
        else:
            phase_context += f"Player said: {player_input}"
        
        return self.send_message(phase_context)
    
    def send_message(self, user_message: str) -> dict:
        """Send a message to Claude and handle the response including tool calls."""
        
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=CIPHER_SYSTEM_PROMPT,
            tools=TOOLS,
            messages=self.conversation_history
        )
        
        # Process response blocks
        agent_messages = []
        tool_results = []
        
        # Collect all content from response
        assistant_content = response.content
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_content
        })
        
        for block in assistant_content:
            if block.type == "text":
                agent_messages.append(block.text)
            elif block.type == "tool_use":
                # Execute the tool
                tool_result = execute_tool(block.name, block.input, self.game.to_dict())
                tool_results.append({
                    "tool_name": block.name,
                    "tool_input": block.input,
                    "tool_result": tool_result,
                    "tool_use_id": block.id
                })
        
        # If there were tool calls, send results back to Claude for interpretation
        if tool_results:
            tool_result_messages = []
            for tr in tool_results:
                tool_result_messages.append({
                    "type": "tool_result",
                    "tool_use_id": tr["tool_use_id"],
                    "content": tr["tool_result"]
                })
            
            self.conversation_history.append({
                "role": "user",
                "content": tool_result_messages
            })
            
            # Get Claude's interpretation of the tool results
            followup = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=CIPHER_SYSTEM_PROMPT,
                tools=TOOLS,
                messages=self.conversation_history
            )
            
            followup_content = followup.content
            self.conversation_history.append({
                "role": "assistant",
                "content": followup_content
            })
            
            for block in followup_content:
                if block.type == "text":
                    agent_messages.append(block.text)
        
        return {
            "messages": agent_messages,
            "full_text": "\n".join(agent_messages),
            "tool_calls": tool_results,
            "game_state": self.game.to_dict(),
            "phase": self.game.phase
        }
    
    # ============================================================
    # PHASE-SPECIFIC INPUT HANDLERS
    # ============================================================
    
    def _is_ready(self, text: str) -> bool:
        """Check if player indicated they're ready."""
        ready_words = ["ready", "yes", "let's go", "go", "start", "do it", "let's do this", "yeah", "yep", "sure"]
        return any(word in text.lower() for word in ready_words)
    
    def _handle_challenge_1_input(self, player_input: str) -> str:
        """Handle player choice for Challenge 1 (Firewall)."""
        text = player_input.lower()
        
        # Check SSL/cert FIRST (most specific keywords, avoids false match on single letters)
        if any(kw in text for kw in ["ssl", "cert", "certificate", "option c", "expired"]):
            self.game.record_choice("CHALLENGE_1", "SSL Exploit", correct=False)
            self.game.apply_penalty(30, "SSL already patched")
            self.game.challenge_1_result = "fail"
            self.game.advance_phase()  # Move to CHALLENGE_2 after fallback
            return (
                f"Player chose: SSL EXPLOIT (Option C — WRONG, patched already)\n"
                f"Call execute_code with attack_type='ssl_exploit'. The result shows it was patched. "
                f"30 seconds wasted. Then fall back to SQL injection automatically — tell the partner "
                f"'dead end but I see another way in' and execute the SQL injection to get through. "
                f"Then transition to Challenge 2.\n"
                f"Player said: {player_input}"
            )

        # Check brute force SECOND (before SQL so "port"/"8080" are caught)
        elif any(kw in text for kw in ["brute", "port", "8080", "option b", "force"]):
            self.game.record_choice("CHALLENGE_1", "Brute Force", correct=False)
            self.game.apply_penalty(60, "IDS triggered on port 8080")
            self.game.challenge_1_result = "partial"
            self.game.advance_phase()  # Move to CHALLENGE_2 despite failure
            return (
                f"Player chose: BRUTE FORCE PORT 8080 (Option B — WRONG, triggers alarm)\n"
                f"Call execute_code with attack_type='brute_force'. The result shows an alarm was triggered and 60 seconds lost. "
                f"React with urgency but DON'T blame the partner. Say something like 'alarm's on us but we're still in'. "
                f"Then IMMEDIATELY transition to Challenge 2 — no time to retry.\n"
                f"Player said: {player_input}"
            )
        
        # SQL injection LAST (broadest match — this is the correct answer)
        elif any(kw in text for kw in ["sql", "injection", "option a", "login", "auth", "query"]):
            self.game.record_choice("CHALLENGE_1", "SQL Injection", correct=True)
            self.game.challenge_1_result = "success"
            self.game.advance_phase()  # Move to CHALLENGE_2
            return (
                f"Player chose: SQL INJECTION (Option A — CORRECT CHOICE)\n"
                f"Execute the SQL injection attack. Call execute_code with attack_type='sql_injection'. "
                f"After success, celebrate briefly then transition to Challenge 2.\n"
                f"Player said: {player_input}"
            )
        
        else:
            # Player didn't clearly choose — agent should re-present options
            return (
                f"Player's response didn't clearly indicate a choice. "
                f"Ask them again which vulnerability to exploit: SQL injection (A), open port (B), or SSL cert (C). "
                f"Be brief — time is ticking.\n"
                f"Player said: {player_input}"
            )
    
    def _handle_challenge_2_input(self, player_input: str) -> str:
        """Handle player input for Challenge 2 (Vault Code)."""
        text = player_input.upper().strip()
        
        if "SESAME" in text:
            self.game.record_choice("CHALLENGE_2", "SESAME", correct=True)
            self.game.challenge_2_result = "success"
            self.game.advance_phase()  # Move to Challenge 3
            return (
                f"Player cracked it! They said: '{player_input}' which contains SESAME.\n"
                f"The full vault code is OPENSESAME. Celebrate! 'We're in the vault!'\n"
                f"Then IMMEDIATELY transition: alarm was triggered by vault access, "
                f"start Challenge 3 (Escape). Call plan_escape_route with threat_level='high' "
                f"and present the two escape options.\n"
                f"Player said: {player_input}"
            )
        
        elif "OPEN" in text and "SESAME" not in text:
            return (
                f"Player said 'OPEN' which is the FIRST half (the part YOU already cracked). "
                f"Tell them you already have that part. You need THEIR part — the second half. "
                f"Hint: 'Look at the beginning of each line in the clue.'\n"
                f"Player said: {player_input}"
            )
        
        else:
            # Wrong answer
            return (
                f"Player guessed wrong: '{player_input}'. "
                f"Don't reveal the answer! Give a slightly stronger hint: "
                f"'Not quite. The answer is hidden in plain sight — look at how each line STARTS.'\n"
                f"Player said: {player_input}"
            )
    
    def _handle_challenge_3_input(self, player_input: str) -> str:
        """Handle player choices for Challenge 3 (Escape)."""
        text = player_input.lower()
        
        # First choice: which route
        if self.game.escape_route is None:
            if any(kw in text for kw in ["vent", "shaft", "fast", "route a", "zip", "quick", "speed"]):
                self.game.escape_route = "route_a"
                route = ESCAPE_DECISIONS["route_a"]
                return (
                    f"Player chose Route A: Ventilation Shaft.\n"
                    f"Describe them entering the shaft. Then present the second decision: "
                    f"'{route['second_choice']['description']}'\n"
                    f"Option 1: {route['second_choice']['option_1']['text']}\n"
                    f"Option 2: {route['second_choice']['option_2']['text']}\n"
                    f"Player said: {player_input}"
                )
            
            elif any(kw in text for kw in ["tunnel", "service", "safe", "route b", "slow", "careful"]):
                self.game.escape_route = "route_b"
                route = ESCAPE_DECISIONS["route_b"]
                return (
                    f"Player chose Route B: Service Tunnel.\n"
                    f"Describe them entering the tunnel. Then present the second decision: "
                    f"'{route['second_choice']['description']}'\n"
                    f"Option 1: {route['second_choice']['option_1']['text']}\n"
                    f"Option 2: {route['second_choice']['option_2']['text']}\n"
                    f"Player said: {player_input}"
                )
            
            else:
                return (
                    f"Player didn't clearly pick a route. Ask again briefly: "
                    f"Route A (ventilation shaft — fast, risky) or Route B (service tunnel — slow, safe)?\n"
                    f"Player said: {player_input}"
                )
        
        # Second choice: within the chosen route
        else:
            route = ESCAPE_DECISIONS[self.game.escape_route]
            choices = route["second_choice"]
            
            if any(kw in text for kw in ["slow", "careful", "wait", "hide", "stealth", "1", "option 1", "first"]):
                option = choices["option_1"]
                self.game.record_choice("CHALLENGE_3", option["text"], correct=True)
                self.game.apply_penalty(option["time_cost"], "Escape time")
                self.game.challenge_3_result = option["outcome"]
                self.game.advance_phase()  # Move to DEBRIEF
                return (
                    f"Player chose cautious approach. Result: {option['result']}\n"
                    f"Time cost: {option['time_cost']} seconds.\n"
                    f"HEIST COMPLETE! Transition to [DEBRIEF]. "
                    f"Give the final summary: celebrate their escape, reference their choices across all 3 challenges, "
                    f"and sign off as CIPHER.\n"
                    f"Final score data: {json.dumps(self.game.calculate_final_score())}"
                )
            
            elif any(kw in text for kw in ["fast", "sprint", "run", "bluff", "bold", "2", "option 2", "second"]):
                option = choices["option_2"]
                self.game.record_choice("CHALLENGE_3", option["text"], correct=True)
                self.game.apply_penalty(option["time_cost"], "Escape time")
                self.game.challenge_3_result = option["outcome"]
                self.game.advance_phase()  # Move to DEBRIEF
                return (
                    f"Player chose bold approach. Result: {option['result']}\n"
                    f"Time cost: {option['time_cost']} seconds.\n"
                    f"HEIST COMPLETE! Transition to [DEBRIEF]. "
                    f"Give the final summary: celebrate their escape, reference their choices across all 3 challenges, "
                    f"and sign off as CIPHER.\n"
                    f"Final score data: {json.dumps(self.game.calculate_final_score())}"
                )
            
            else:
                return (
                    f"Player didn't clearly choose. Re-present the two options briefly. Remind them time is running out.\n"
                    f"Player said: {player_input}"
                )


# ============================================================
# CHALLENGE DATA EXPORTS (for Person C's frontend)
# ============================================================

def get_challenge_data(challenge_id: str) -> dict:
    """Return challenge display data for the frontend."""
    
    if challenge_id == "challenge_1":
        return {
            "title": "BYPASS THE FIREWALL",
            "subtitle": "Nexus Financial — External Perimeter",
            "display_content": FIREWALL_LOGS,
            "display_type": "terminal_logs",
            "options": [
                {"id": "a", "label": "SQL Injection", "desc": "Exploit the unparameterized login query"},
                {"id": "b", "label": "Brute Force Port 8080", "desc": "Attack the exposed debug port"},
                {"id": "c", "label": "SSL Certificate Exploit", "desc": "Leverage the expired cert"}
            ]
        }
    
    elif challenge_id == "challenge_2":
        return {
            "title": "CRACK THE VAULT CODE",
            "subtitle": "Nexus Financial — Inner Vault",
            "display_content": VAULT_CIPHER_VISUAL,
            "display_type": "cipher_text",
            "agent_decoded": VAULT_CODE_FIRST_HALF,
            "input_prompt": "Enter the second half of the code..."
        }
    
    elif challenge_id == "challenge_3":
        return {
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
    
    return {}


# ============================================================
# TEST MODE — Run this file directly to test the agent
# ============================================================

if __name__ == "__main__":
    import os
    
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("=" * 60)
        print("HEIST — Terminal Test Mode (No API key — using mock)")
        print("=" * 60)
        print()
        print("To test with real Claude, set ANTHROPIC_API_KEY env var")
        print()
        
        # Show game data for verification
        print("Challenge 1 Data:")
        print(json.dumps(get_challenge_data("challenge_1"), indent=2))
        print()
        print("Challenge 2 Data:")
        print(json.dumps(get_challenge_data("challenge_2"), indent=2))
        print()
        print("Challenge 3 Data:")
        print(json.dumps(get_challenge_data("challenge_3"), indent=2))
        print()
        
        # Test game state
        game = GameState()
        print(f"Initial state: {game.to_dict()}")
        game.advance_phase()
        print(f"After advance: {game.to_dict()}")
        game.record_choice("CHALLENGE_1", "SQL Injection", True)
        game.apply_penalty(0, "none")
        print(f"After choice: {game.to_dict()}")
        print(f"Final score: {json.dumps(game.calculate_final_score(), indent=2)}")
    
    else:
        print("=" * 60)
        print("HEIST — Live Agent Test Mode")
        print("=" * 60)
        print()
        
        agent = HeistAgent(api_key)
        
        # Start the game
        print("Starting heist...\n")
        result = agent.start_game()
        print(f"CIPHER: {result['full_text']}\n")
        
        # Interactive loop
        while agent.game.phase != "DEBRIEF":
            player_input = input("YOU: ")
            if player_input.lower() in ["quit", "exit"]:
                break
            
            result = agent.player_action(player_input)
            print(f"\nCIPHER: {result['full_text']}")
            print(f"[Phase: {result['phase']} | Score: {result['game_state']['score']} | Time: {result['game_state']['time_remaining']}s]\n")
        
        if agent.game.phase == "DEBRIEF":
            print("\n" + "=" * 60)
            print("HEIST COMPLETE")
            print("=" * 60)
            print(json.dumps(agent.game.calculate_final_score(), indent=2))
