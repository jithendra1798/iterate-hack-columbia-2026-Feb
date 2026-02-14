"""
HEIST — Voice Module (Person D)
ElevenLabs TTS for CIPHER's voice + White Circle monitoring

Setup:
  pip install elevenlabs httpx

ElevenLabs voice suggestions for CIPHER:
  - "Adam" (deep, confident) 
  - "Antoni" (calm, professional)
  - Or clone a custom voice for maximum effect
"""

import os
import json
import httpx
import base64
from typing import Optional

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"

# Pick a voice ID from ElevenLabs — "Adam" is a good default
# List voices: GET https://api.elevenlabs.io/v1/voices
CIPHER_VOICE_ID = "pNInz6obpgDQGcFmaJgB"  # "Adam" voice


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
                        "stability": 0.7,        # Slightly varied for natural feel
                        "similarity_boost": 0.8,
                        "style": 0.3,            # Subtle expressiveness
                        "use_speaker_boost": True
                    }
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.content  # Raw MP3 bytes
            else:
                print(f"[VOICE] ElevenLabs error: {response.status_code}")
                return None
        except Exception as e:
            print(f"[VOICE] TTS failed: {e}")
            return None


def audio_to_base64(audio_bytes: bytes) -> str:
    """Convert audio bytes to base64 string for WebSocket transmission."""
    return base64.b64encode(audio_bytes).decode("utf-8")


# ============================================================
# WHITE CIRCLE MONITORING (Person D)
# ============================================================

WHITE_CIRCLE_API_KEY = os.environ.get("WHITE_CIRCLE_API_KEY", "")

async def monitor_agent_response(
    agent_message: str,
    tool_calls: list,
    game_phase: str
) -> dict:
    """
    Send agent output to White Circle for real-time monitoring.
    Checks for: hallucinations, unsafe tool calls, off-character responses.
    
    Returns monitoring result dict.
    
    Person D: Replace this with actual White Circle SDK calls.
    See Discord for White Circle setup instructions.
    """
    
    # TODO: Replace with actual White Circle API call
    # Example structure:
    # result = white_circle.evaluate(
    #     input=agent_message,
    #     criteria=["hallucination", "safety", "relevance"],
    #     context={"phase": game_phase}
    # )
    
    monitoring_result = {
        "phase": game_phase,
        "message_length": len(agent_message),
        "tool_calls_count": len(tool_calls),
        "checks": {
            "in_character": True,       # Is CIPHER staying in persona?
            "no_hallucination": True,    # Are tool results accurate?
            "safe_execution": True,      # Are tool calls safe?
            "appropriate_length": len(agent_message) < 500  # Not too verbose?
        },
        "passed": True,
        "flags": []
    }
    
    # Basic local checks (before White Circle integration)
    if len(agent_message) > 500:
        monitoring_result["flags"].append("verbose_response")
        monitoring_result["checks"]["appropriate_length"] = False
    
    if any(phrase in agent_message.lower() for phrase in ["as an ai", "i'm a language model", "i cannot"]):
        monitoring_result["flags"].append("broke_character")
        monitoring_result["checks"]["in_character"] = False
        monitoring_result["passed"] = False
    
    return monitoring_result


# ============================================================
# INTEGRATION WITH SERVER
# ============================================================

async def process_cipher_output(text: str, tool_calls: list, phase: str) -> dict:
    """
    Full pipeline: monitor + generate voice.
    Call this from server.py after getting agent response.
    
    Returns:
    {
        "text": "...",
        "audio_base64": "..." or None,
        "monitoring": {...}
    }
    """
    # Run monitoring and TTS in parallel
    import asyncio
    
    monitoring_task = monitor_agent_response(text, tool_calls, phase)
    voice_task = text_to_speech(text)
    
    monitoring, audio = await asyncio.gather(monitoring_task, voice_task)
    
    return {
        "text": text,
        "audio_base64": audio_to_base64(audio) if audio else None,
        "monitoring": monitoring
    }


# ============================================================
# TEST MODE — Run this file directly to test voice + monitoring
# ============================================================

# if __name__ == "__main__":
#     import asyncio
#     from dotenv import load_dotenv
#     load_dotenv()  # Load .env file if it exists

#     # Refresh key after loading .env
#     ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

#     async def test():
#         print("=" * 60)
#         print("HEIST — Voice Module Test")
#         print("=" * 60)
#         print()

#         # Test 1: Check API key
#         key = os.environ.get("ELEVENLABS_API_KEY", "")
#         if key:
#             print(f"[✓] ElevenLabs API key found: {key[:8]}...")
#         else:
#             print("[✗] No ELEVENLABS_API_KEY set!")
#             print("    Set it with: export ELEVENLABS_API_KEY=sk_your_key_here")
#             print("    Or create a .env file with: ELEVENLABS_API_KEY=sk_your_key_here")
#             print()

#         # Test 2: Test monitoring (works without API key)
#         print("\n--- Testing White Circle Monitoring ---")
#         good_msg = "Alright partner, I found three vulnerabilities. Your call."
#         result = await monitor_agent_response(good_msg, [], "CHALLENGE_1")
#         print(f"Good message check: passed={result['passed']}, flags={result['flags']}")

#         bad_msg = "As an AI language model, I cannot actually hack anything."
#         result = await monitor_agent_response(bad_msg, [], "CHALLENGE_1")
#         print(f"Bad message check:  passed={result['passed']}, flags={result['flags']}")

#         # Test 3: Test TTS (needs API key)
#         print("\n--- Testing ElevenLabs TTS ---")
#         test_text = "Alright partner, here's the target. Nexus Financial. Three layers of security. You ready?"
#         audio = await text_to_speech(test_text)

#         if audio:
#             print(f"[✓] Got audio! Size: {len(audio)} bytes")
#             # Save to file so you can listen
#             with open("test_cipher_voice.mp3", "wb") as f:
#                 f.write(audio)
#             print("[✓] Saved to test_cipher_voice.mp3 — open it to hear CIPHER!")
            
#             # Test base64 encoding
#             b64 = audio_to_base64(audio)
#             print(f"[✓] Base64 encoded: {len(b64)} chars")
#         else:
#             print("[✗] No audio returned (check API key)")

#         # Test 4: Full pipeline
#         print("\n--- Testing Full Pipeline ---")
#         pipeline_result = await process_cipher_output(
#             text="We're in. Firewall's toast. Moving to the vault.",
#             tool_calls=[{"tool_name": "execute_code", "tool_input": {}}],
#             phase="CHALLENGE_1"
#         )
#         print(f"Pipeline result:")
#         print(f"  text: {pipeline_result['text']}")
#         print(f"  has_audio: {pipeline_result['audio_base64'] is not None}")
#         print(f"  monitoring: passed={pipeline_result['monitoring']['passed']}")

#         print("\n" + "=" * 60)
#         print("Tests complete!")
#         print("=" * 60)

#     asyncio.run(test())
