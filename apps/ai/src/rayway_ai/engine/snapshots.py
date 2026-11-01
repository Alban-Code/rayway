from dataclasses import dataclass
from enum import StrEnum

from rayway_ai.engine.state import GameState, PlayerState
from rayway_ai.engine.utils import get_player_by_name, setup_life
from rayway_ai.sim.events import Event, LifeCount


class Zone(StrEnum):
    LIFE = "Life"
    TRASH = "Trash"
    HAND = "Hand"
    BOARD = "Board"


@dataclass(frozen=True, kw_only=True)
class Divergence:
    player: str
    zone: Zone
    turn: int
    correct: int
    actual: int


def consume_snapshot(
    state: GameState, event: Event
) -> tuple[GameState, Divergence | None]:
    if isinstance(event, LifeCount):
        actual_player: PlayerState = get_player_by_name(state, event.player)
        if actual_player.life is None:
            return (setup_life(state, event.player, event.count), None)
        if event.count != actual_player.life:
            divergence = Divergence(
                player=event.player,
                zone=Zone.LIFE,
                turn=state.turn,
                correct=event.count,
                actual=actual_player.life,
            )
            return (
                setup_life(state, player_name=event.player, amount=event.count),
                divergence,
            )
    return (state, None)
