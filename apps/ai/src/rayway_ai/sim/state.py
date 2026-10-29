from dataclasses import dataclass, field


@dataclass
class ParserState:
    turn: int = 0
    active_player: str | None = None
    first_player: str | None = None
    leaders: dict[str, str]= field(default_factory=dict)
