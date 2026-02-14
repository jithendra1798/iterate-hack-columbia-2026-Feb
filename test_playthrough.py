"""
HEIST — End-to-End Playthrough Tests
Tests the full game flow with real Claude API calls.

Usage:
    python test_playthrough.py
    (Loads API key from .env file or environment)
"""

import os
import sys

# Load environment from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, rely on environment variables

# Check for API key first
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
if not API_KEY:
    print("ERROR: ANTHROPIC_API_KEY environment variable not set")
    print("Run: export ANTHROPIC_API_KEY='your-key-here'")
    sys.exit(1)

from agent import HeistAgent


def print_separator(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_cipher(text: str, phase: str, score: int, time: int):
    print(f"\n[Phase: {phase} | Score: {score} | Time: {time}s]")
    print("-" * 40)
    print(f"CIPHER: {text}")
    print("-" * 40)


def test_happy_path():
    """Test the optimal playthrough — all correct choices."""
    print_separator("TEST: HAPPY PATH (All Correct Choices)")

    agent = HeistAgent(API_KEY)
    phases_hit = []

    # Step 1: Start the game
    print("\n>>> Starting game...")
    result = agent.start_game()
    phases_hit.append(result["phase"])
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    assert result["phase"] == "BRIEFING", f"Expected BRIEFING, got {result['phase']}"

    # Step 2: Say we're ready
    print("\n>>> Player: 'Let's go'")
    result = agent.player_action("Let's go")
    phases_hit.append(result["phase"])
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    assert result["phase"] == "CHALLENGE_1", f"Expected CHALLENGE_1, got {result['phase']}"

    # Step 3: Choose SQL injection (correct)
    print("\n>>> Player: 'I'll go with SQL injection'")
    result = agent.player_action("I'll go with SQL injection")
    phases_hit.append(result["phase"])
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    # Should transition to Challenge 2 after success
    assert result["phase"] == "CHALLENGE_2", f"Expected CHALLENGE_2, got {result['phase']}"
    assert result["game_state"]["score"] == 25, f"Expected score 25, got {result['game_state']['score']}"

    # Step 4: Crack the vault code
    print("\n>>> Player: 'SESAME'")
    result = agent.player_action("SESAME")
    phases_hit.append(result["phase"])
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    assert result["phase"] == "CHALLENGE_3", f"Expected CHALLENGE_3, got {result['phase']}"
    assert result["game_state"]["score"] == 50, f"Expected score 50, got {result['game_state']['score']}"

    # Step 5: Choose ventilation shaft
    print("\n>>> Player: 'Let's take the ventilation shaft'")
    result = agent.player_action("Let's take the ventilation shaft")
    phases_hit.append(result["phase"])
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    # Still in Challenge 3, waiting for second choice
    assert result["phase"] == "CHALLENGE_3", f"Expected CHALLENGE_3 (second choice), got {result['phase']}"

    # Step 6: Move slowly past sensor
    print("\n>>> Player: 'Move slowly past the sensor'")
    result = agent.player_action("Move slowly past the sensor")
    phases_hit.append(result["phase"])
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    assert result["phase"] == "DEBRIEF", f"Expected DEBRIEF, got {result['phase']}"

    # Final score
    final_score = agent.game.calculate_final_score()
    print_separator("FINAL SCORE — HAPPY PATH")
    print(f"  Base Score: {final_score['base_score']}")
    print(f"  Time Bonus: {final_score['time_bonus']}")
    print(f"  Total: {final_score['total_score']}")
    print(f"  Grade: {final_score['grade']}")
    print(f"  Correct Choices: {final_score['correct_choices']}/{final_score['total_choices']}")
    print(f"  Phases Hit: {phases_hit}")

    # Assertions
    assert final_score["total_score"] > 0, "Score should be > 0"
    assert "BRIEFING" in phases_hit, "Should have hit BRIEFING"
    assert "CHALLENGE_1" in phases_hit, "Should have hit CHALLENGE_1"
    assert "CHALLENGE_2" in phases_hit, "Should have hit CHALLENGE_2"
    assert "CHALLENGE_3" in phases_hit, "Should have hit CHALLENGE_3"
    assert "DEBRIEF" in phases_hit, "Should have hit DEBRIEF"

    print("\n[HAPPY PATH TEST PASSED]")
    return final_score["total_score"]


def test_unhappy_path():
    """Test with wrong choices — verify penalties and hints."""
    print_separator("TEST: UNHAPPY PATH (Wrong Choices)")

    agent = HeistAgent(API_KEY)

    # Step 1: Start the game
    print("\n>>> Starting game...")
    result = agent.start_game()
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])

    # Step 2: Say ready
    print("\n>>> Player: 'ready'")
    result = agent.player_action("ready")
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    initial_time = result["game_state"]["time_remaining"]

    # Step 3: Choose brute force (WRONG) — should get 60 second penalty
    print("\n>>> Player: 'brute force the port' (WRONG CHOICE)")
    result = agent.player_action("brute force the port")
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])

    # Verify penalty was applied
    penalties = result["game_state"]["penalties"]
    print(f"\nPenalties applied: {penalties}")
    assert len(penalties) > 0, "Should have at least one penalty"
    assert any(p["seconds"] == 60 for p in penalties), "Should have 60 second penalty for brute force"

    # Should still transition to Challenge 2 (game continues despite wrong choice)
    assert result["phase"] == "CHALLENGE_2", f"Expected CHALLENGE_2, got {result['phase']}"

    # Step 4: Guess wrong code
    print("\n>>> Player: 'DIAMOND' (WRONG GUESS)")
    result = agent.player_action("DIAMOND")
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])

    # Should still be in Challenge 2, should get a hint NOT the answer
    assert result["phase"] == "CHALLENGE_2", "Should still be in Challenge 2 after wrong guess"
    assert "SESAME" not in result["full_text"].upper(), "CIPHER should NOT reveal the answer!"
    print("\n[Verified: CIPHER gave hint, did not reveal answer]")

    # Step 5: Now guess correctly
    print("\n>>> Player: 'SESAME' (CORRECT)")
    result = agent.player_action("SESAME")
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    assert result["phase"] == "CHALLENGE_3", f"Expected CHALLENGE_3, got {result['phase']}"

    # Step 6: Choose service tunnel (Route B)
    print("\n>>> Player: 'service tunnel'")
    result = agent.player_action("service tunnel")
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])

    # Step 7: Bluff the guard
    print("\n>>> Player: 'bluff the guard'")
    result = agent.player_action("bluff the guard")
    print_cipher(result["full_text"], result["phase"],
                 result["game_state"]["score"], result["game_state"]["time_remaining"])
    assert result["phase"] == "DEBRIEF", f"Expected DEBRIEF, got {result['phase']}"

    # Final score
    final_score = agent.game.calculate_final_score()
    print_separator("FINAL SCORE — UNHAPPY PATH")
    print(f"  Base Score: {final_score['base_score']}")
    print(f"  Time Bonus: {final_score['time_bonus']}")
    print(f"  Total: {final_score['total_score']}")
    print(f"  Grade: {final_score['grade']}")
    print(f"  Correct Choices: {final_score['correct_choices']}/{final_score['total_choices']}")
    print(f"  Penalties: {final_score['penalties']}")

    print("\n[UNHAPPY PATH TEST PASSED]")
    return final_score["total_score"]


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  HEIST — End-to-End Playthrough Tests")
    print("  Using real Claude API calls")
    print("=" * 60)

    try:
        happy_score = test_happy_path()
        print("\n" + "~" * 60 + "\n")
        unhappy_score = test_unhappy_path()

        print_separator("COMPARISON")
        print(f"  Happy Path Score:   {happy_score}")
        print(f"  Unhappy Path Score: {unhappy_score}")
        print(f"  Difference:         {happy_score - unhappy_score}")

        assert happy_score > unhappy_score, "Happy path should score higher than unhappy path"

        print("\n" + "=" * 60)
        print("  ALL TESTS PASSED!")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n[TEST FAILED] {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
