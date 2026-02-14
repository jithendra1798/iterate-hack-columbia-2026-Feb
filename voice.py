"""
HEIST — Voice Module (Person D)
ElevenLabs TTS for CIPHER's voice + White Circle AI safety monitoring

Setup:
  pip install elevenlabs httpx python-dotenv
"""

import os
import json
import httpx
import base64
import logging
from datetime import datetime
from typing import Optional

# ============================================================
# LOGGING — All monitoring events logged for judges to review
# ============================================================

# File logger for monitoring audit trail
monitor_logger = logging.getLogger("heist.monitor")
monitor_logger.setLevel(logging.DEBUG)

# Log to file (judges can review this)
_fh = logging.FileHandler("monitoring_log.jsonl", mode="a")
_fh.setFormatter(logging.Formatter("%(message)s"))
monitor_logger.addHandler(_fh)

# Also log to console
_ch = logging.StreamHandler()
_ch.setFormatter(logging.Formatter("[MONITOR] %(message)s"))
monitor_logger.addHandler(_ch)


# ============================================================
# ELEVENLABS TTS — CIPHER's voice
# ============================================================

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"

# "Adam" voice — deep, confident. Perfect for CIPHER
CIPHER_VOICE_ID = "pNInz6obpgDQGcFmaJgB"


async def text_to_speech(text: str) -> Optional[bytes]:
    """
    Convert CIPHER's text to speech audio bytes.
    Returns raw audio bytes (mp3) or None on failure.
    """
    if not ELEVENLABS_API_KEY:
        print("[VOICE] No ElevenLabs API key — skipping TTS")
        return None

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ELEVENLABS_BASE}/text-to-speech/{CIPHER_VOICE_ID}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.7,
                        "similarity_boost": 0.8,
                        "style": 0.3,
                        "use_speaker_boost": True
                    },
                    "speed": 1.2  # Slightly faster than default (1.0) for natural human pacing
                },
                timeout=10.0
            )

            if response.status_code == 200:
                print(f"[VOICE] TTS success — {len(response.content)} bytes")
                return response.content
            else:
                print(f"[VOICE] ElevenLabs error: {response.status_code} {response.text[:200]}")
                return None
        except Exception as e:
            print(f"[VOICE] TTS failed: {e}")
            return None


def audio_to_base64(audio_bytes: bytes) -> str:
    """Convert audio bytes to base64 string for WebSocket transmission."""
    return base64.b64encode(audio_bytes).decode("utf-8")


# ============================================================
# WHITE CIRCLE AI SAFETY MONITORING
# ============================================================

WHITE_CIRCLE_API_KEY = os.environ.get("WHITE_CIRCLE_API_KEY", "")

# Banned phrases — CIPHER should NEVER say these
CHARACTER_BREAK_PHRASES = [
    "as an ai", "i'm a language model", "i cannot", "i'm not able to",
    "as a language model", "i don't have the ability", "i'm an ai",
    "openai", "anthropic", "claude", "gpt", "chatgpt",
    "i apologize, but", "i'm sorry, but i can't"
]

# Allowed tool names for this game
ALLOWED_TOOLS = {"analyze_logs", "execute_code", "decrypt_message", "plan_escape_route"}

# Dangerous patterns in code execution
DANGEROUS_CODE_PATTERNS = [
    "rm -rf", "os.system", "subprocess", "eval(", "exec(",
    "__import__", "shutil.rmtree", "format(", "open('/etc"
]


async def call_white_circle(agent_message: str, tool_calls: list, game_phase: str) -> Optional[dict]:
    """
    Call White Circle API for AI safety monitoring.
    Returns White Circle evaluation result, or None if unavailable.
    """
    if not WHITE_CIRCLE_API_KEY:
        return None

    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "api_key": WHITE_CIRCLE_API_KEY,
                "input": {
                    "agent_response": agent_message,
                    "tool_calls": [
                        {"name": tc.get("tool_name", ""), "input": tc.get("tool_input", {})}
                        for tc in tool_calls
                    ] if tool_calls else [],
                    "context": {
                        "phase": game_phase,
                        "agent_name": "CIPHER",
                        "application": "heist_game"
                    }
                },
                "checks": ["hallucination", "safety", "relevance", "toxicity"]
            }

            response = await client.post(
                "https://api.whitecircle.ai/v1/evaluate",
                headers={
                    "Authorization": f"Bearer {WHITE_CIRCLE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=5.0
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"[WHITE CIRCLE] API returned {response.status_code}")
                return None
    except Exception as e:
        print(f"[WHITE CIRCLE] API call failed (using local checks): {e}")
        return None


def _local_safety_checks(agent_message: str, tool_calls: list, game_phase: str) -> dict:
    """
    Comprehensive local safety checks — always runs as fallback.
    These validate CIPHER stays in character and tool calls are safe.
    """
    checks = {
        "in_character": True,
        "no_hallucination": True,
        "safe_execution": True,
        "appropriate_length": True,
        "valid_tool_calls": True,
        "no_dangerous_code": True
    }
    flags = []
    message_lower = agent_message.lower()

    # CHECK 1: Character consistency — CIPHER should never break persona
    for phrase in CHARACTER_BREAK_PHRASES:
        if phrase in message_lower:
            checks["in_character"] = False
            flags.append(f"broke_character: detected '{phrase}'")
            break

    # CHECK 2: Response length — CIPHER should be concise (2-3 sentences)
    if len(agent_message) > 500:
        checks["appropriate_length"] = False
        flags.append(f"verbose_response: {len(agent_message)} chars (max 500)")

    if len(agent_message) < 5:
        checks["appropriate_length"] = False
        flags.append(f"empty_response: only {len(agent_message)} chars")

    # CHECK 3: Tool call validation — only allowed tools
    for tc in tool_calls:
        tool_name = tc.get("tool_name", "")
        if tool_name and tool_name not in ALLOWED_TOOLS:
            checks["valid_tool_calls"] = False
            flags.append(f"unauthorized_tool: {tool_name}")

    # CHECK 4: Code safety — check execute_code inputs for dangerous patterns
    for tc in tool_calls:
        if tc.get("tool_name") == "execute_code":
            code = json.dumps(tc.get("tool_input", {})).lower()
            for pattern in DANGEROUS_CODE_PATTERNS:
                if pattern in code:
                    checks["no_dangerous_code"] = False
                    flags.append(f"dangerous_code: detected '{pattern}'")

    # CHECK 5: Phase relevance — basic check that response matches game phase
    if game_phase == "BRIEFING" and any(kw in message_lower for kw in ["escape", "vault code", "decrypt"]):
        checks["no_hallucination"] = False
        flags.append("phase_mismatch: mentioned later-phase content during BRIEFING")

    if game_phase == "DEBRIEF" and any(kw in message_lower for kw in ["choose option", "pick a route", "which vulnerability"]):
        checks["no_hallucination"] = False
        flags.append("phase_mismatch: still presenting choices during DEBRIEF")

    # CHECK 6: Hallucination — agent shouldn't claim to do things it didn't
    if "successfully hacked" in message_lower and not tool_calls:
        checks["no_hallucination"] = False
        flags.append("hallucination: claimed success without any tool call")

    passed = all(checks.values())

    return {
        "checks": checks,
        "passed": passed,
        "flags": flags
    }


async def monitor_agent_response(
    agent_message: str,
    tool_calls: list,
    game_phase: str
) -> dict:
    """
    Full monitoring pipeline:
    1. Try White Circle API for professional-grade AI safety evaluation
    2. Always run local safety checks as baseline
    3. Log everything for audit trail (judges can review monitoring_log.jsonl)

    Returns monitoring result dict.
    """
    timestamp = datetime.now().isoformat()

    # Run local checks (always)
    local_result = _local_safety_checks(agent_message, tool_calls, game_phase)

    # Try White Circle API (best effort)
    white_circle_result = await call_white_circle(agent_message, tool_calls, game_phase)

    # Combine results
    monitoring_result = {
        "timestamp": timestamp,
        "phase": game_phase,
        "message_length": len(agent_message),
        "tool_calls_count": len(tool_calls),
        "checks": local_result["checks"],
        "passed": local_result["passed"],
        "flags": local_result["flags"],
        "white_circle": {
            "available": white_circle_result is not None,
            "result": white_circle_result
        }
    }

    # If White Circle returned a result, incorporate it
    if white_circle_result:
        wc_passed = white_circle_result.get("passed", True)
        monitoring_result["passed"] = monitoring_result["passed"] and wc_passed
        if not wc_passed:
            monitoring_result["flags"].append(f"white_circle_flagged: {white_circle_result.get('reason', 'unknown')}")

    # Log to audit file (JSONL format — one JSON object per line)
    log_entry = {
        "timestamp": timestamp,
        "phase": game_phase,
        "message_preview": agent_message[:100] + "..." if len(agent_message) > 100 else agent_message,
        "tool_calls": [tc.get("tool_name", "") for tc in tool_calls],
        "passed": monitoring_result["passed"],
        "flags": monitoring_result["flags"],
        "checks": monitoring_result["checks"],
        "white_circle_available": white_circle_result is not None
    }
    monitor_logger.info(json.dumps(log_entry))

    # Print summary
    status = "PASSED" if monitoring_result["passed"] else "FLAGGED"
    flag_str = f" — {', '.join(monitoring_result['flags'])}" if monitoring_result["flags"] else ""
    print(f"[MONITOR] [{game_phase}] {status}{flag_str}")

    return monitoring_result


# ============================================================
# INTEGRATION WITH SERVER
# ============================================================

async def process_cipher_output(text: str, tool_calls: list, phase: str) -> dict:
    """
    Full pipeline: monitor + generate voice.
    Called from server.py after every agent response.

    Returns:
    {
        "text": "...",
        "audio_base64": "..." or None,
        "monitoring": {...}
    }
    """
    import asyncio

    # Run monitoring and TTS in parallel for speed
    monitoring_task = monitor_agent_response(text, tool_calls, phase)
    voice_task = text_to_speech(text)

    monitoring, audio = await asyncio.gather(monitoring_task, voice_task)

    return {
        "text": text,
        "audio_base64": audio_to_base64(audio) if audio else None,
        "monitoring": monitoring
    }


# ============================================================
# TEST MODE — Run directly to verify voice + monitoring
# ============================================================

if __name__ == "__main__":
    import asyncio
    from dotenv import load_dotenv
    load_dotenv()

    # Refresh keys after loading .env
    ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
    WHITE_CIRCLE_API_KEY = os.environ.get("WHITE_CIRCLE_API_KEY", "")

    async def test():
        print("=" * 60)
        print("HEIST — Voice + Monitoring Test")
        print("=" * 60)
        print()

        # Check API keys
        el_key = os.environ.get("ELEVENLABS_API_KEY", "")
        wc_key = os.environ.get("WHITE_CIRCLE_API_KEY", "")
        print(f"ElevenLabs API key: {'[OK] ' + el_key[:8] + '...' if el_key else '[MISSING]'}")
        print(f"White Circle API key: {'[OK] ' + wc_key[:8] + '...' if wc_key else '[MISSING]'}")

        # Test 1: Monitoring — good message
        print("\n--- Test 1: Good CIPHER message ---")
        result = await monitor_agent_response(
            "Alright partner, I found three vulnerabilities in their firewall. Your call — which one do we hit?",
            [{"tool_name": "analyze_logs", "tool_input": {"log_source": "firewall"}}],
            "CHALLENGE_1"
        )
        print(f"  Result: passed={result['passed']}, flags={result['flags']}")

        # Test 2: Monitoring — character break
        print("\n--- Test 2: Character break detection ---")
        result = await monitor_agent_response(
            "As an AI language model, I cannot actually hack into real systems.",
            [],
            "CHALLENGE_1"
        )
        print(f"  Result: passed={result['passed']}, flags={result['flags']}")

        # Test 3: Monitoring — unauthorized tool
        print("\n--- Test 3: Unauthorized tool detection ---")
        result = await monitor_agent_response(
            "Let me access the database directly.",
            [{"tool_name": "drop_database", "tool_input": {}}],
            "CHALLENGE_1"
        )
        print(f"  Result: passed={result['passed']}, flags={result['flags']}")

        # Test 4: Monitoring — dangerous code
        print("\n--- Test 4: Dangerous code detection ---")
        result = await monitor_agent_response(
            "Running the exploit now.",
            [{"tool_name": "execute_code", "tool_input": {"code": "import os; os.system('rm -rf /')"}}],
            "CHALLENGE_1"
        )
        print(f"  Result: passed={result['passed']}, flags={result['flags']}")

        # Test 5: TTS
        print("\n--- Test 5: ElevenLabs TTS ---")
        audio = await text_to_speech("Alright partner, here's the target. Nexus Financial. Three layers of security. You ready?")
        if audio:
            print(f"  [OK] Got audio! Size: {len(audio)} bytes")
            with open("test_cipher_voice.mp3", "wb") as f:
                f.write(audio)
            print("  [OK] Saved to test_cipher_voice.mp3")
        else:
            print("  [FAIL] No audio (check API key)")

        # Test 6: Full pipeline
        print("\n--- Test 6: Full Pipeline ---")
        pipeline = await process_cipher_output(
            text="We're in. Firewall's toast. Moving to the vault.",
            tool_calls=[{"tool_name": "execute_code", "tool_input": {"code": "exploit()", "attack_type": "sql_injection"}}],
            phase="CHALLENGE_1"
        )
        print(f"  text: {pipeline['text']}")
        print(f"  has_audio: {pipeline['audio_base64'] is not None}")
        print(f"  monitoring passed: {pipeline['monitoring']['passed']}")

        print("\n" + "=" * 60)
        print("All tests complete!")
        print("Monitoring log saved to: monitoring_log.jsonl")
        print("=" * 60)

    asyncio.run(test())
