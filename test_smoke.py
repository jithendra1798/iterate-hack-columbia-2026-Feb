"""
Quick smoke test — run this to verify all game logic works.
No API key needed.
"""

import json
from agent import GameState, get_challenge_data, execute_tool, ESCAPE_DECISIONS

print("=" * 60)
print("HEIST — Smoke Test")
print("=" * 60)

# Test 1: Game State Machine
print("\n[TEST 1] Game State Machine")
game = GameState()
assert game.phase == "BRIEFING"
game.advance_phase()
assert game.phase == "CHALLENGE_1"
game.advance_phase()
assert game.phase == "CHALLENGE_2"
game.advance_phase()
assert game.phase == "CHALLENGE_3"
game.advance_phase()
assert game.phase == "DEBRIEF"
print("  ✓ All phase transitions work")

# Test 2: Scoring
print("\n[TEST 2] Scoring System")
game2 = GameState()
game2.record_choice("C1", "SQL Injection", True)
assert game2.score == 25
game2.record_choice("C2", "Wrong", False)
assert game2.score == 25  # No change for wrong
game2.apply_penalty(60, "test penalty")
assert game2.time_remaining == 240
score = game2.calculate_final_score()
assert score["base_score"] == 25
assert score["correct_choices"] == 1
assert score["total_choices"] == 2
print(f"  ✓ Score: {score['total_score']} | Grade: {score['grade']}")

# Test 3: Challenge Data
print("\n[TEST 3] Challenge Data")
c1 = get_challenge_data("challenge_1")
assert len(c1["options"]) == 3
assert c1["display_type"] == "terminal_logs"
print(f"  ✓ Challenge 1: {c1['title']} — {len(c1['options'])} options")

c2 = get_challenge_data("challenge_2")
assert c2["agent_decoded"] == "OPEN"
assert c2["display_type"] == "cipher_text"
print(f"  ✓ Challenge 2: {c2['title']} — decoded portion: {c2['agent_decoded']}")

c3 = get_challenge_data("challenge_3")
assert len(c3["routes"]) == 2
print(f"  ✓ Challenge 3: {c3['title']} — {len(c3['routes'])} routes")

# Test 4: Tool Execution
print("\n[TEST 4] Tool Execution")
result = json.loads(execute_tool("analyze_logs", {"log_source": "firewall"}, {}))
assert result["status"] == "complete"
assert len(result["findings"]) == 3
print(f"  ✓ analyze_logs: {len(result['findings'])} vulnerabilities found")

result = json.loads(execute_tool("execute_code", {"code": "test", "attack_type": "sql_injection"}, {}))
assert result["status"] == "SUCCESS"
print(f"  ✓ SQL injection: {result['status']}")

result = json.loads(execute_tool("execute_code", {"code": "test", "attack_type": "brute_force"}, {}))
assert result["status"] == "PARTIAL_FAILURE"
print(f"  ✓ Brute force: {result['status']} (correct — should fail)")

result = json.loads(execute_tool("decrypt_message", {"cipher_text": "test", "method": "brute_force"}, {}))
assert result["decrypted_portion"] == "OPEN"
print(f"  ✓ Decrypt: partial decode = '{result['decrypted_portion']}'")

result = json.loads(execute_tool("plan_escape_route", {"current_location": "vault", "threat_level": "high"}, {}))
assert len(result["routes"]) == 2
print(f"  ✓ Escape routes: {len(result['routes'])} options")

# Test 5: Cipher Puzzle Validation
print("\n[TEST 5] Cipher Puzzle")
from agent import VAULT_CIPHER_VISUAL
lines = [l.strip() for l in VAULT_CIPHER_VISUAL.strip().split("\n") if l.strip()]
first_letters = "".join(line[0] for line in lines)
assert first_letters == "SESAME", f"Expected SESAME, got {first_letters}"
print(f"  ✓ First letters spell: {first_letters}")
print(f"  ✓ Full vault code: OPEN + SESAME = OPENSESAME")

# Test 6: Escape Decision Tree
print("\n[TEST 6] Escape Decision Tree")
for route_id, route in ESCAPE_DECISIONS.items():
    print(f"  Route: {route['name']}")
    for opt_key in ["option_1", "option_2"]:
        opt = route["second_choice"][opt_key]
        print(f"    {opt_key}: {opt['outcome']} (cost: {opt['time_cost']}s)")
print("  ✓ All escape paths valid")

print("\n" + "=" * 60)
print("ALL TESTS PASSED ✓")
print("=" * 60)
print("\nNext steps:")
print("  1. Set ANTHROPIC_API_KEY and run: python agent.py")
print("  2. Play through the heist in terminal mode")
print("  3. Run: python server.py  (for Person B/C integration)")
