from pathlib import Path
from collections import defaultdict
from rayway_ai.sim.parser import parse_log
from rayway_ai.sim.events import Event, DonPhase

events: list[Event] = parse_log(Path("data/sim_logs/2026-10-24T18.49.54.log"))
totals: dict[str, int] = defaultdict(int)
for event in events:
    if isinstance(event, DonPhase):
        totals[event.player] += event.count

for player, n in totals.items():
    print(player, n)