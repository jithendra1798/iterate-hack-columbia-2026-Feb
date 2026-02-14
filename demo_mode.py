#!/usr/bin/env python3
"""
HEIST — Demo Mode
Terminal-based demo with colored output. Backup for frontend failures.

Usage:
    python demo_mode.py              # Auto-play demo (for backup presentation)
    python demo_mode.py --interactive  # Interactive mode (for judges to play)
"""

import os
import sys
import time
import argparse

# Load environment from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ANSI color codes
class Colors:
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"
    MAGENTA = "\033[95m"


def print_header():
    """Print the game header with ASCII art."""
    print(f"""
{Colors.CYAN}{Colors.BOLD}
    ██╗  ██╗███████╗██╗███████╗████████╗
    ██║  ██║██╔════╝██║██╔════╝╚══██╔══╝
    ███████║█████╗  ██║███████╗   ██║
    ██╔══██║██╔══╝  ██║╚════██║   ██║
    ██║  ██║███████╗██║███████║   ██║
    ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝   ╚═╝
{Colors.RESET}
{Colors.DIM}    You and your AI partner. One vault. 5 minutes.{Colors.RESET}
""")


def print_cipher(text: str):
    """Print CIPHER's message in cyan with typewriter effect."""
    print(f"\n{Colors.CYAN}{Colors.BOLD}CIPHER:{Colors.RESET}")
    print(f"{Colors.CYAN}{'─' * 50}{Colors.RESET}")

    # Typewriter effect for demo
    for char in text:
        print(f"{Colors.CYAN}{char}{Colors.RESET}", end="", flush=True)
        time.sleep(0.008)  # Fast typewriter

    print(f"\n{Colors.CYAN}{'─' * 50}{Colors.RESET}")


def print_player(text: str):
    """Print player's choice in green."""
    print(f"\n{Colors.GREEN}{Colors.BOLD}YOU:{Colors.RESET} {Colors.GREEN}{text}{Colors.RESET}")


def print_tool_call(tool_name: str):
    """Print tool call indicator in yellow."""
    print(f"\n{Colors.YELLOW}[CIPHER is hacking... {tool_name}]{Colors.RESET}", end="", flush=True)
    for _ in range(3):
        time.sleep(0.3)
        print(f"{Colors.YELLOW}.{Colors.RESET}", end="", flush=True)
    print()


def print_timer(seconds: int):
    """Print timer in red."""
    minutes = seconds // 60
    secs = seconds % 60
    color = Colors.RED if seconds < 60 else Colors.DIM
    print(f"\n{color}⏱  TIME REMAINING: {minutes}:{secs:02d}{Colors.RESET}")


def print_phase(phase: str):
    """Print phase banner."""
    phase_names = {
        "BRIEFING": "MISSION BRIEFING",
        "CHALLENGE_1": "CHALLENGE 1: BYPASS THE FIREWALL",
        "CHALLENGE_2": "CHALLENGE 2: CRACK THE VAULT CODE",
        "CHALLENGE_3": "CHALLENGE 3: THE ESCAPE",
        "DEBRIEF": "MISSION COMPLETE"
    }
    name = phase_names.get(phase, phase)
    print(f"\n{Colors.MAGENTA}{'═' * 55}")
    print(f"  {Colors.BOLD}{name}{Colors.RESET}{Colors.MAGENTA}")
    print(f"{'═' * 55}{Colors.RESET}")


def print_score(score_data: dict):
    """Print the final score screen."""
    print(f"""
{Colors.BOLD}{'═' * 55}
               HEIST RESULTS
{'═' * 55}{Colors.RESET}

{Colors.CYAN}Base Score:{Colors.RESET}      {score_data['base_score']}
{Colors.CYAN}Time Bonus:{Colors.RESET}      +{score_data['time_bonus']}
{Colors.BOLD}Total Score:{Colors.RESET}     {Colors.BOLD}{score_data['total_score']}{Colors.RESET}

{Colors.CYAN}Time Remaining:{Colors.RESET}  {score_data['time_remaining']} seconds
{Colors.CYAN}Correct Choices:{Colors.RESET} {score_data['correct_choices']}/{score_data['total_choices']}

{Colors.BOLD}Grade: {score_data['grade']}{Colors.RESET}
""")

    if score_data['penalties']:
        print(f"{Colors.RED}Penalties:{Colors.RESET}")
        for p in score_data['penalties']:
            print(f"  - {p['reason']}: -{p['seconds']}s")

    print(f"\n{Colors.BOLD}{'═' * 55}{Colors.RESET}")


def run_demo(interactive: bool = False):
    """Run the heist demo."""
    # Check API key
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print(f"{Colors.RED}ERROR: ANTHROPIC_API_KEY not set{Colors.RESET}")
        print("Run: export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    from agent import HeistAgent

    # Pre-scripted choices for auto-play demo
    auto_choices = [
        "Let's do this!",                          # Briefing -> Challenge 1
        "SQL injection - let's go clean.",         # Challenge 1 (correct)
        "SESAME",                                  # Challenge 2 (correct)
        "Ventilation shaft - we need speed.",      # Challenge 3 route
        "Move slowly past the sensor.",            # Challenge 3 final choice
    ]
    choice_index = 0

    print_header()

    if interactive:
        print(f"{Colors.GREEN}INTERACTIVE MODE — Type your choices{Colors.RESET}")
    else:
        print(f"{Colors.YELLOW}AUTO-PLAY MODE — Sit back and watch{Colors.RESET}")

    time.sleep(1)

    # Initialize agent
    agent = HeistAgent(api_key)

    # Start the game
    print_phase("BRIEFING")
    print_timer(agent.game.time_remaining)

    result = agent.start_game()

    # Show any tool calls
    for tc in result.get("tool_calls", []):
        print_tool_call(tc["tool_name"])

    print_cipher(result["full_text"])

    # Game loop
    while agent.game.phase != "DEBRIEF":
        # Get player input
        if interactive:
            player_input = input(f"\n{Colors.GREEN}{Colors.BOLD}YOUR CHOICE > {Colors.RESET}")
        else:
            if choice_index < len(auto_choices):
                player_input = auto_choices[choice_index]
                choice_index += 1
                time.sleep(2)  # Pause for dramatic effect
            else:
                player_input = "continue"

        print_player(player_input)

        # Get previous phase to detect transitions
        prev_phase = agent.game.phase

        # Process input
        result = agent.player_action(player_input)

        # Phase transition?
        if result["phase"] != prev_phase:
            print_phase(result["phase"])

        print_timer(result["game_state"]["time_remaining"])

        # Show tool calls with dramatic effect
        for tc in result.get("tool_calls", []):
            print_tool_call(tc["tool_name"])

        print_cipher(result["full_text"])

    # Game over - show score
    print_phase("DEBRIEF")
    final_score = agent.game.calculate_final_score()
    print_score(final_score)

    # Final message based on grade
    if "LEGENDARY" in final_score["grade"] or "ELITE" in final_score["grade"]:
        print(f"\n{Colors.CYAN}{Colors.BOLD}Perfect heist. CIPHER approves.{Colors.RESET}\n")
    elif "PROFESSIONAL" in final_score["grade"]:
        print(f"\n{Colors.CYAN}Solid work, partner. Until next time.{Colors.RESET}\n")
    elif "AMATEUR" in final_score["grade"]:
        print(f"\n{Colors.YELLOW}Messy, but you made it out. Practice more.{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}Better luck on the next job...{Colors.RESET}\n")


def main():
    parser = argparse.ArgumentParser(description="HEIST Demo Mode")
    parser.add_argument(
        "--interactive", "-i",
        action="store_true",
        help="Interactive mode - type your own choices"
    )
    args = parser.parse_args()

    try:
        run_demo(interactive=args.interactive)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.RED}Demo interrupted.{Colors.RESET}")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Colors.RED}ERROR: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
