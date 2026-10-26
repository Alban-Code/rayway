import re
from pathlib import Path

from rayway_ai.sim.events import Event, DonPhase, DonGainEffect

# The SIM writes card links in two different ways depending on the log:
#   <mark><link="OP15-058">OP15-058</link></mark>   (most logs)
#   "OP05-060">OP05-060                             (a few logs)
# normalize_line() rewrites both to a plain `[OP15-058]` so the regexes below only
# have to deal with ONE format.
_MARK_LINK = re.compile(r'<mark><link="[^"]*">([^<]*)</link></mark>')
_OLD_LINK = re.compile(r'\["[^"]*">([^\]]*)\]')

# Player tags contain an invisible zero-width space before the "#".
_ZERO_WIDTH = "​"


def normalize_line(raw: str) -> str:
    line = raw.rstrip("\r\n").replace(_ZERO_WIDTH, "")
    line = _MARK_LINK.sub(r"\1", line)
    line = _OLD_LINK.sub(r"[\1]", line)
    return line.replace("<b>", "").replace("</b>", "")


# TODO 1: compile one regex per line shape you handle. Start with these three:
#   DON_GAIN_EFFECT "Enel [OP15-058]: Draw 1 Rested Don"   (rested is optional)
#   DON_MINUS       "Kaido [OP17-058]: Minus 2 Don"
# Use named groups. A card reference is `<name> [<code>]` once normalized.
DON_PHASE = re.compile(r"^\[(?P<player>[^\]]+)\] Draw (?P<count>\d+) Don$")
DON_GAIN_EFFECT = re.compile(r"^(?!\[)(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Draw (?P<count>\d+) (?P<rested>Rested )?Don$")
DON_MINUS = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Minus (?P<count>\d+) Don$")


# TODO 2: write `parse_line(line, state) -> Event | None`.
#   - `line` is already normalized.
#   - `state` holds what the parser must remember between lines (current turn,
#     active player, line number, the first player...). Start with a small
#     dataclass (not frozen: this one changes).
#   - Return None for lines you do not handle yet. That is expected.

def _don_phase(m, line_number, state) -> Event:
    return DonPhase(line=line_number, turn=0, player=m["player"], count=int(m["count"]))

def _don_gain_effect(m, line_number, state) -> Event:
    return DonGainEffect(line=line_number, player="get from state", turn=0, card_code=m["code"], count=int(m["count"]), rested=m["rested"] is not None)

HANDLERS = [
    (DON_PHASE, _don_phase),
    (DON_GAIN_EFFECT, _don_gain_effect),
    (DON_MINUS, _don_minus)
]

# TODO 3: write `parse_log(path: Path) -> list[Event]`.
#   Read the file line by line, normalize, call parse_line, collect the events.
#   Turn logic (see our discussion):
#     - the first player is the one in "Chose to go First" (or the opponent of
#       the one in "Chose to go Second");
#     - "End Turn" ends the turn: the other player becomes active, turn += 1;
#     - the log can stop in the middle of a turn: that is fine.
def parse_log(path: Path) -> list[Event]:
    events: list[Event] = []
    with path.open(encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            normalized_line = normalize_line(line)
            for pattern, build in HANDLERS:
                m = pattern.match(normalized_line)
                if m:
                    events.append(build(m, line_number, state))
    return events
