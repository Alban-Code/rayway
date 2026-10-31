import sys
from collections import Counter
from pathlib import Path

from rayway_ai.engine import replay
from rayway_ai.sim.events import LifeCount
from rayway_ai.sim.parser import parse_log

# Usage: python scripts/measure_engine.py [path-to-log]   (default: all logs in data/sim_logs)
# Replays each log and compares the engine to the Snapshots: how often does the
# replayed Life differ from the Life the log states? delta = engine - log, so a
# positive delta means the engine missed a Life loss.
AI_DIR = Path(__file__).resolve().parent.parent

paths = [Path(sys.argv[1])] if len(sys.argv) > 1 else sorted((AI_DIR / "data/sim_logs").glob("*.log"))
compared = 0
diverged = 0
crashes: list[tuple[str, str]] = []
deltas: Counter[int] = Counter()
games_with_divergence = 0
games_replayed = 0

for path in paths:
    events = parse_log(path)
    try:
        timeline = replay(events)
    except Exception as error:  # the engine should never crash: list every crash
        crashes.append((path.name, f"{type(error).__name__}: {error}"))
        continue
    games_replayed += 1
    life_counts = [e for e in events if isinstance(e, LifeCount)]
    # The first LifeCount of each player sets the starting Life: nothing to compare.
    compared += len(life_counts) - len({e.player for e in life_counts})
    life_divergences = [d for d in timeline.divergences if d.zone == "Life"]
    diverged += len(life_divergences)
    games_with_divergence += bool(life_divergences)
    deltas.update(d.actual - d.correct for d in life_divergences)

print(f"logs replayed: {games_replayed}/{len(paths)}, crashes: {len(crashes)}")
for name, message in crashes[:5]:
    print(f"  CRASH {name}: {message}")
rate = 100 * diverged / compared if compared else 0
print(f"Life snapshots compared: {compared}, diverged: {diverged} ({rate:.1f}%)")
print(f"games with at least one Life divergence: {games_with_divergence}/{games_replayed}")
print("delta (engine - log) -> count:", dict(sorted(deltas.items())))
