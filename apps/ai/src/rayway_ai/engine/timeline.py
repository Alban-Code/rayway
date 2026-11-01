from dataclasses import dataclass

from rayway_ai.engine.snapshots import Divergence
from rayway_ai.engine.state import GameState


@dataclass(frozen=True, kw_only=True)
class Timeline:
    states: tuple[GameState, ...]
    divergences: tuple[Divergence, ...]
