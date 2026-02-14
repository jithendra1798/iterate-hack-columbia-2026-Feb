"""
HEIST — Server (Person B fills this out)
FastAPI backend connecting Frontend ↔ Agent ↔ Blaxel

Person A has defined the API contract below.
Person B: implement the WebSocket and wire to Blaxel.
"""

import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Handle import errors gracefully
try:
    from agent import HeistAgent, get_challenge_data
except ImportError as e:
    print(f"Warning: Could not import agent module: {e}")
    HeistAgent = None
    get_challenge_data = None

app = FastAPI(title="HEIST")


class PlayerActionRequest(BaseModel):
    input: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active games (in production, use Redis)
active_games: dict[str, HeistAgent] = {}


# ============================================================
# REST ENDPOINTS
# ============================================================

@app.post("/api/game/start")
async def start_game():
    """Create a new game and return CIPHER's opening message."""
    game_id = os.urandom(8).hex()
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    try:
        agent = HeistAgent(api_key)
        active_games[game_id] = agent

        result = agent.start_game()

        return {
            "game_id": game_id,
            "cipher_message": result["full_text"],
            "game_state": result["game_state"],
            "challenge_data": get_challenge_data("challenge_1")  # Preload
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start game: {str(e)}")


@app.post("/api/game/{game_id}/action")
async def player_action(game_id: str, body: PlayerActionRequest):
    """Process a player action and return CIPHER's response."""
    agent = active_games.get(game_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Game not found")

    try:
        result = agent.player_action(body.input)

        # Include challenge data for the current/next phase
        challenge_data = None
        phase = result["phase"]
        if phase == "CHALLENGE_1":
            challenge_data = get_challenge_data("challenge_1")
        elif phase == "CHALLENGE_2":
            challenge_data = get_challenge_data("challenge_2")
        elif phase == "CHALLENGE_3":
            challenge_data = get_challenge_data("challenge_3")
        elif phase == "DEBRIEF":
            challenge_data = agent.game.calculate_final_score()

        return {
            "cipher_message": result["full_text"],
            "tool_calls": result["tool_calls"],
            "game_state": result["game_state"],
            "phase": phase,
            "challenge_data": challenge_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.get("/api/game/{game_id}/state")
async def get_state(game_id: str):
    """Get current game state."""
    agent = active_games.get(game_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Game not found")

    return agent.game.to_dict()


@app.get("/api/challenge/{challenge_id}")
async def get_challenge(challenge_id: str):
    """Get challenge display data for frontend."""
    return get_challenge_data(challenge_id)


# ============================================================
# WEBSOCKET (Person B — implement real-time comms)
# ============================================================

@app.websocket("/ws/game/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: str):
    """
    Real-time WebSocket for game communication.

    Messages FROM frontend:
    {"type": "player_input", "text": "..."}
    {"type": "start_game"}

    Messages TO frontend:
    {"type": "cipher_message", "text": "...", "phase": "..."}
    {"type": "tool_call", "tool": "...", "result": "..."}
    {"type": "phase_change", "new_phase": "...", "challenge_data": {...}}
    {"type": "timer_update", "time_remaining": 300}
    {"type": "game_over", "score": {...}}
    {"type": "error", "message": "..."}
    """
    await websocket.accept()

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        await websocket.send_json({
            "type": "error",
            "message": "ANTHROPIC_API_KEY not configured on server"
        })
        await websocket.close()
        return

    try:
        agent = HeistAgent(api_key)
        active_games[game_id] = agent
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"Failed to initialize agent: {str(e)}"
        })
        await websocket.close()
        return

    # Start timer task
    timer_task = asyncio.create_task(
        _timer_loop(websocket, agent)
    )

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "start_game":
                try:
                    result = agent.start_game()
                    await websocket.send_json({
                        "type": "cipher_message",
                        "text": result["full_text"],
                        "phase": result["phase"],
                        "game_state": result["game_state"]
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to start game: {str(e)}"
                    })

            elif data["type"] == "player_input":
                try:
                    result = agent.player_action(data["text"])

                    # Send tool calls first (for visual effect)
                    for tc in result["tool_calls"]:
                        await websocket.send_json({
                            "type": "tool_call",
                            "tool": tc["tool_name"],
                            "input": tc["tool_input"],
                            "result": tc["tool_result"]
                        })
                        await asyncio.sleep(0.5)  # Dramatic pause

                    # Send challenge data if phase changed
                    current_phase = result["phase"]
                    challenge_data = None
                    if current_phase == "CHALLENGE_1":
                        challenge_data = get_challenge_data("challenge_1")
                    elif current_phase == "CHALLENGE_2":
                        challenge_data = get_challenge_data("challenge_2")
                    elif current_phase == "CHALLENGE_3":
                        challenge_data = get_challenge_data("challenge_3")

                    if challenge_data:
                        await websocket.send_json({
                            "type": "phase_change",
                            "new_phase": current_phase,
                            "challenge_data": challenge_data
                        })

                    # Send CIPHER's message
                    await websocket.send_json({
                        "type": "cipher_message",
                        "text": result["full_text"],
                        "phase": result["phase"],
                        "game_state": result["game_state"]
                    })

                    # Check for game over
                    if result["phase"] == "DEBRIEF":
                        await websocket.send_json({
                            "type": "game_over",
                            "score": agent.game.calculate_final_score()
                        })
                        timer_task.cancel()
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Agent error: {str(e)}"
                    })

    except WebSocketDisconnect:
        timer_task.cancel()
        if game_id in active_games:
            del active_games[game_id]


async def _timer_loop(websocket: WebSocket, agent: HeistAgent):
    """Send timer updates every second."""
    while agent.game.time_remaining > 0 and agent.game.phase != "DEBRIEF":
        await asyncio.sleep(1)
        agent.game.time_remaining -= 1
        try:
            await websocket.send_json({
                "type": "timer_update",
                "time_remaining": agent.game.time_remaining
            })
        except:
            break
    
    if agent.game.time_remaining <= 0:
        try:
            await websocket.send_json({
                "type": "game_over",
                "score": agent.game.calculate_final_score(),
                "reason": "time_up"
            })
        except:
            pass


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
