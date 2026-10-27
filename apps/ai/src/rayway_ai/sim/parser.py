import re
from pathlib import Path
from dataclasses import dataclass, field
from collections.abc import Callable

from rayway_ai.sim.events import (
    Event, DonPhase, DonGainEffect, DonMinus, LeaderIs, TurnOrderChosen, EndTurn, Draw, Deploy,
    AttackDeclared, BlockDeclared, CounterDiscarded, AttackClash, AttackFailed, LeaderDamaged, CardDestroyed,
    Concede, GameOver,
)

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

@dataclass
class ParserState:
    turn: int = 0
    active_player: str | None = None
    first_player: str | None = None
    leaders: dict[str, str]= field(default_factory=dict)

DON_PHASE = re.compile(r"^\[(?P<player>[^\]]+)\] Draw (?P<count>\d+) Don$")
DON_GAIN_EFFECT = re.compile(r"^(?!\[)(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Draw (?P<count>\d+) (?P<rested>Rested )?Don$")
DON_MINUS = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Minus (?P<count>\d+) Don$")
LEADER_IS = re.compile(r"^\[(?P<player>[^\]]+)\] Leader is (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]$")
CHOSE_ORDER = re.compile(r"^\[(?P<player>[^\]]+)\] Chose to go (?P<order>First|Second)$")
END_TURN = re.compile(r"^\[(?P<player>[^\]]+)\] End Turn$")
DRAW = re.compile(r"^\[(?P<player>[^\]]+)\] (?:(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: )?Draw (?P<count>\d+) Card$")
DEPLOY = re.compile(
    r"^\[(?P<player>[^\]]+)\] "
    r"(?:(?P<source>.+?) \[(?P<source_code>[A-Z0-9-]+)\]: )?"
    r"Deploy(?:ed)? (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]"
    r"(?P<from_trash> from Trash)?$"
)
ATTACK_DECLARED = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<attacker_name>.+?) \[(?P<attacker_code>[A-Z0-9-]+)\] attacking (?P<target_name>.+?) \[(?P<target_code>[A-Z0-9-]+)\]$")
BLOCK = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] Blocks$")
COUNTER_DISCARD = re.compile(r"^\[(?P<player>[^\]]+)\] Discard (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] for Counter (?P<value>\d+)$")
ATTACK_CLASH = re.compile(r"^(?P<attacker_name>.+?) \[(?P<attacker_code>[A-Z0-9-]+)\]\[(?P<attacker_power>-?\d+)\] vs (?P<target_name>.+?) \[(?P<target_code>[A-Z0-9-]+)\]\[(?P<target_power>-?\d+)\]$")
ATTACK_FAILS = re.compile(r"^Attack Fails$")
LEADER_HIT = re.compile(r"^(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] hit for (?P<damage>\d+) damage$")
DESTROYED = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] Destroyed$")
CONCEDE = re.compile(r"^\[(?P<player>[^\]]+)\] Concedes!$")
GAME_OVER = re.compile(r"^GameOver$")

def _don_phase(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonPhase(line=line_number, turn=state.turn, player=m["player"], count=int(m["count"]))

def _don_gain_effect(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonGainEffect(line=line_number, player=state.active_player, turn=state.turn, card_code=m["code"], count=int(m["count"]), rested=m["rested"] is not None)

def _don_minus(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonMinus(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"], count=int(m["count"]))

def _leader_is(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    state.leaders[m["player"]] = m["code"]
    return LeaderIs(line=line_number, turn=state.turn, player=m["player"], leader_name=m["name"], leader_code=m["code"])

def _turn_order_chosen(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    turn_order_event = TurnOrderChosen(line=line_number, turn=state.turn, player=m["player"], goes_first=(m["order"] == "First"))
    if turn_order_event.goes_first:
        state.active_player = m["player"]
    else:
        state.active_player = next(player for player in state.leaders if player != m["player"])
    state.first_player = state.active_player
    state.turn = 1
    return turn_order_event

def _end_turn(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    end_turn_event = EndTurn(line=line_number, turn=state.turn, player=m["player"])
    state.turn += 1
    state.active_player = next(player for player in state.leaders if player != m["player"])
    return end_turn_event

def _draw(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return Draw(line=line_number, turn=state.turn, player=m["player"], count=int(m["count"]), source_code=m["code"])

def _deploy(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return Deploy(line=line_number, player=m["player"], turn=state.turn, card_code=m["code"], source_code=m["source_code"], from_trash=(m["from_trash"] is not None))

def _attack_declared(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return AttackDeclared(line=line_number, turn=state.turn, player=m["player"], attacker_code=m["attacker_code"], target_code=m["target_code"])

def _block(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return BlockDeclared(line=line_number, turn=state.turn, player=m["player"], blocker_code=m["code"])

def _counter_discard(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CounterDiscarded(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"], value=int(m["value"]))

def _attack_clash(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return AttackClash(line=line_number, turn=state.turn, attacker_code=m["attacker_code"], attacker_power=int(m["attacker_power"]), target_code=m["target_code"], target_power=int(m["target_power"]))

def _attack_fails(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return AttackFailed(line=line_number, turn=state.turn)

def _leader_hit(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LeaderDamaged(line=line_number, turn=state.turn, leader_code=m["code"], damage=int(m["damage"]))

def _destroyed(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardDestroyed(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"])

def _concede(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return Concede(line=line_number, turn=state.turn, player=m["player"])

def _game_over(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return GameOver(line=line_number, turn=state.turn)

Handler = Callable[[re.Match[str], int, ParserState], Event | None]
HANDLERS: list[tuple[re.Pattern[str], Handler]] = [
    (DON_PHASE, _don_phase),
    (DON_GAIN_EFFECT, _don_gain_effect),
    (DON_MINUS, _don_minus),
    (LEADER_IS, _leader_is),
    (CHOSE_ORDER, _turn_order_chosen),
    (END_TURN, _end_turn),
    (DRAW, _draw),
    (DEPLOY, _deploy),
    (ATTACK_DECLARED, _attack_declared),
    (BLOCK, _block),
    (COUNTER_DISCARD, _counter_discard),
    (ATTACK_CLASH, _attack_clash),
    (ATTACK_FAILS, _attack_fails),
    (LEADER_HIT, _leader_hit),
    (DESTROYED, _destroyed),
    (CONCEDE, _concede),
    (GAME_OVER, _game_over),
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
