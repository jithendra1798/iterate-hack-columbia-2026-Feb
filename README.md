# HEIST
### The First AI Partner That Actually *Collaborates*

## The Challenge
**In high-stakes environments, seconds equal millions.**

Whether in cybersecurity incident response, emergency dispatch, or algorithmic trading, the single biggest bottleneck is the friction between human intent and machine execution. Current AI tools are passive; they sit idle, waiting for prompts, forcing the human expert to micromanage every step rather than focusing on high-level strategy. This latency creates a "competence gap" where threats escalate and opportunities vanish before the human-machine team can react.

The industry doesn't need another chatbot that politely waits for instructions. It needs an **active partner**—an intelligence that anticipates needs, executes autonomy with rigid safety, and collaborates as a peer under extreme pressure. We need agents that don't just talk, but *act*.

## The Solution
**HEIST** is a real-time infiltration simulation that proofs the future of Human-AI teaming. It places you in the driver's seat of a high-tech heist, paired with **CIPHER**—an autonomous AI agent with attitude, agency, and elite hacking skills.

Unlike traditional agents, CIPHER is proactive. It monitors data streams for you, identifies vulnerabilities without being asked, and writes sandboxed Python code to exploit them in real-time. It vocalizes critical updates instantly, creating a fluid "voice-first" tactical loop that keeps your eyes on the mission, not the chat window. 

**HEIST** answers a critical engineering question: *What happens when an AI partner has the same agency as a human operator?* The answer is a system that evolves from a tool into a force multiplier, capable of executing complex technical tasks (like SQL injections or deciphering cryptograms) while the human focuses on moral and strategic decisions.

## Key Features

### 🧠 Autonomous Engineering Partner
CIPHER isn't scripted. It leverages **context-aware reasoning** to analyze unique server logs and complex cryptograms. It doesn't just suggest solutions; it **writes and executes live Python code** in a secure sandbox to perform real attacks. Whether it's crafting a boolean-based SQL injection or brute-forcing a Caesar cipher, CIPHER handles the "dirty work" of syntax and execution, freeing you to make the command decisions.

### 🗣️ Sub-Second Voice Interaction
Text interfaces kill momentum. In a crisis, you can't stop to read a paragraph. HEIST implements a low-latency audio pipeline using **ElevenLabs**, allowing CIPHER to speak to you naturally. The system prioritizes audio packets to ensure warnings and intel are delivered faster than you can read them, mimicking the adrenaline of real-time ops. The result is a partnership that feels like speaking to a human expert over a comms channel.

### 🛡️ Enterprise-Grade Safety Rails
Trust is non-negotiable definition of agency. We integrated **White Circle AI** to monitor CIPHER's outputs in real-time. Every line of code generated and every sentence spoken is vetted against rigid safety protocols, ensuring the agent remains helpful, harmless, and strictly "in character." This proves that autonomous agents can be safe agents—we catch hallucinations and dangerous commands *before* they execute.

### ⚡ Dynamic Decision Trees
Your choices have consequences. HEIST features a non-linear narrative and state machine where your decisions—speed vs. stealth, aggression vs. prudence—fundamentally alter the system's state. CIPHER adapts its personality and tactics to match your leadership style, creating a unique partnership dynamic for every user. If you panic, CIPHER takes charge; if you lead, CIPHER follows.

## Technical Implementation

We engineered HEIST as a distributed, event-driven system designed to handle the complexity of real-time state synchronization.

*   **Real-Time Orchestration (FastAPI & WebSockets):**
    The backend serves as the central nervous system, managing varying latency requirements between the frontend, the AI brain, and the audio streams. We chose **FastAPI** for its high-performance async capabilities, allowing us to maintain a bidirectional **WebSocket** connection that pushes game state updates, audio chunks, and terminal logs to the client in milliseconds, without blocking the main event loop.

*   **Cognitive Architecture (Anthropic Claude):**
    We utilize **Anthropic's Claude** for the core agent logic. We selected Claude over competitors for its superior ability to maintain complex personas and follow multi-step reasoning chains without "forgetting" the mission parameters. The system prompt is engineered to enforce a strict "Observe-Orient-Decide-Act" loop, ensuring CIPHER remains proactive rather than reactive.

*   **Sandboxed Execution (Blaxel):**
    To safely enable the agent's coding capabilities, we integrated **Blaxel**. This allows CIPHER to spin up isolated, ephemeral environments to run generated exploit scripts. This safeguards the host infrastructure while simulating realistic cyber-effects, preventing the "agent" from accidentally (or intentionally) executing harmful commands like `rm -rf`.

*   **Latency Optimization (Async Pipeline):**
    The voice pipeline is engineered for speed. By overlapping textual generation with audio buffering and streaming, we reduced the "time-to-voice" latency to under 500ms. We use a custom chunking algorithm to send text to **ElevenLabs** the moment a sentence is complete, rather than waiting for the full paragraph, creating a conversational flow that feels instantaneous.

## Getting Started

### Prerequisites
*   Python 3.10+
*   Virtual Environment (recommended)
*   API Keys: Anthropic, ElevenLabs, White Circle (Optional)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/jithendra1798/iterate-hack-columbia-2026-Feb.git
    cd iterate-hack-columbia-2026-Feb
    ```

2.  **Set Up Virtual Environment**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```bash
    echo "ANTHROPIC_API_KEY=sk-..." >> .env
    echo "ELEVENLABS_API_KEY=xi-..." >> .env
    # Optional:
    # WHITE_CIRCLE_API_KEY=...
    # BLAXEL_API_KEY=...
    ```

5.  **Launch the Mission**
    ```bash
    python server.py
    ```
    The server will start at `http://localhost:8000`. Connect your frontend or use the API endpoints to begin the heist.

## Future Roadmap

The HEIST framework is just the beginning. The underlying architecture is industry-agnostic and ready to scale.

*   **Multiplayer Heist Crews:** We plan to scale the WebSocket architecture to support 3-4 synchronized human players working with specialized AI agents (Demolitions, Driver, Hacker) in a coordinated raid. This requires a conflict-resolution engine to manage overlapping agent intents.
*   **Procedural Level Generation:** Implementing an LLM-driven "Dungeon Master" to generate unique vault schematics, firewall logs, and security puzzles for every session. This ensures infinite replayability and prevents users from memorizing the "happy path."
*   **VR Tactical Interface:** Porting the frontend to **Three.js/WebXR** to immerse players physically in the digital vault. Imagine physically manipulating the tumblers of a lock while CIPHER whispers the combination in your ear—true spatial computing.
*   **Self-Improving Agents:** Implementing a reinforcement learning loop (RLHF) where CIPHER learns from successful heists. By analyzing aggregate user data, the agent can optimize its vulnerability detection algorithms and dialogue timing, becoming a more effective partner with every mission.
