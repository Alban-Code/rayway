import re
import sys
from collections import Counter
from pathlib import Path

from rayway_ai.sim.handlers import HANDLERS
from rayway_ai.sim.normalize import normalize_line

# Usage: python scripts/try_unmatched.py [path-to-log]   (default: all logs in data/sim_logs)
# Lists the readable lines no handler decodes, grouped by shape (codes -> [C], numbers -> N).
# Resolved from this file, not from the current directory, so it works wherever
# the script is launched from (terminal, VS Code "Run" button...).
AI_DIR = Path(__file__).resolve().parent.parent

CARD_CODE = re.compile(r"\[[A-Z0-9]+-\d+(?:_[a-z0-9]+)?\]")
PLAYER_TAG = re.compile(r"^\[[^\]]*#\d+\]")
NUMBER = re.compile(r"\d+")
CARD_NAME = re.compile(r"(?:(?<=\] )|(?<=: )|(?<=to )|(?<=Buff )|(?<=Give )|(?<=Trash )|(?<=Rest )|(?<=Set )|^)[^\[:]*?(?: \([^)]*\))? ?\[C\]")


def shape_of(line: str) -> str:
    line = PLAYER_TAG.sub("[P]", line)
    line = CARD_CODE.sub("[C]", line)
    line = CARD_NAME.sub("NAME [C]", line)  # a card name is whatever precedes a code
    return NUMBER.sub("N", line)


paths = [Path(sys.argv[1])] if len(sys.argv) > 1 else sorted((AI_DIR / "data/sim_logs").glob("*.log"))
counts: Counter[str] = Counter()
examples: dict[str, str] = {}

for path in paths:
    with path.open(encoding="utf-8") as file:
        for raw in file:
            line = normalize_line(raw)
            if line.startswith("RZ1") or any(pattern.match(line) for pattern, _ in HANDLERS):
                continue
            shape = shape_of(line)
            counts[shape] += 1
            examples.setdefault(shape, line)

print(f"{len(paths)} log(s), {sum(counts.values())} undecoded lines, {len(counts)} shapes\n")
for shape, n in counts.most_common(70):
    print(f"{n:5}  {shape}\n       e.g. {examples[shape][:110]}")
