from dataclasses import dataclass


@dataclass(frozen=True, kw_only=True)
class PlayerState:
    name: str
    life: int | None = None


@dataclass(frozen=True, kw_only=True)
class GameState:
    turn: int = 0
    active_player: str | None = None
    players: tuple[PlayerState, ...] = ()
