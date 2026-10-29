from pathlib import Path

from rayway_ai.sim.events import Event
from rayway_ai.sim.handlers import HANDLERS
from rayway_ai.sim.normalize import normalize_line
from rayway_ai.sim.state import ParserState


def parse_log(path: Path) -> list[Event]:
    events: list[Event] = []
    state: ParserState = ParserState()
    with path.open(encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            normalized_line = normalize_line(line)
            for pattern, build in HANDLERS:
                m = pattern.match(normalized_line)
                if m:
                    events.append(build(m, line_number, state))
                    break
    return events
