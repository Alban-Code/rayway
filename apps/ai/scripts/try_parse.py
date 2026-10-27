import sys
from collections import Counter
from pathlib import Path

from rayway_ai.sim.events import Event
from rayway_ai.sim.parser import parse_log

# Usage: python scripts/try_parse.py [path-to-log]
# The default log has all three kinds of DON!! events (Enel deck).
# Resolved from this file, not from the current directory, so it works wherever
# the script is launched from (terminal, VS Code "Run" button...).
AI_DIR = Path(__file__).resolve().parent.parent
DEFAULT_LOG = AI_DIR / "data/sim_logs/2026-10-25T10.31.22.log"

path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_LOG
events: list[Event] = parse_log(path)

# Generic display: works for every event type, present and future. The fields
# shared by all events (line, turn) are printed in columns, the rest as key=value.
for event in events:
    fields = {k: v for k, v in vars(event).items() if k not in ("line", "turn")}
    details = "  ".join(f"{k}={v}" for k, v in fields.items())
    print(f"L{event.line:<5} T{event.turn:<3} {type(event).__name__:<16} {details}")

print(f"\n{path.name}: {len(events)} events")
for name, count in sorted(Counter(type(e).__name__ for e in events).items()):
    print(f"  {name:<16} {count}")

# Sanity check: the max turn should match the number of End Turn lines
# (+1 if the log stops in the middle of a turn).
end_turns = sum(type(e).__name__ == "EndTurn" for e in events)
max_turn = max((e.turn for e in events), default=0)
print(f"\nEndTurn={end_turns}  max turn={max_turn}  (expected max turn = EndTurn or EndTurn+1)")
