from dataclasses import dataclass


# kw_only=True: without it, a subclass field with no default cannot follow a
# base field that has one. Here no field has a default, but keeping it
# keyword-only also forces explicit names at every call site: Draw(line=3, ...).
@dataclass(frozen=True, kw_only=True)
class Event:
    line: int  # 1-based line number in the log file
    turn: int  # 0 = setup (before the first turn), then 1, 2, 3...


@dataclass(frozen=True, kw_only=True)
class GameStart(Event):
    players: tuple[str, str]  # "Name#1234" tags
    first_player: str
    # TODO: add the Leaders (card codes). Think about the type: a dict
    # {player: code} is mutable, which clashes with frozen=True. Options: a tuple
    # of codes in the same order as `players`, or two named fields.


@dataclass(frozen=True, kw_only=True)
class TurnStart(Event):
    player: str


@dataclass(frozen=True, kw_only=True)
class Draw(Event):
    player: str
    # "Draw 1 Card" at the start of a turn. How many cards? (it is always 1 today,
    # but an effect could draw more: decide if you need a `count` field.)


# TODO: DonPhase(player, count)
#   The "[Player] Draw N Don" line, no card name. May be ABSENT for a turn
#   (empty DON!! deck), so never rely on it to count turns.
@dataclass(frozen=True, kw_only=True)
class DonPhase(Event):
    player: str
    count: int

@dataclass(frozen=True, kw_only=True)
class DonGainEffect(Event):
    player: str
    card_code: str
    count: int
    rested: bool


# TODO: DonMinus(player, card_code, count)
#   "<Card>: Minus N Don" (DON!! -X cost: DON!! go back to the DON!! deck).

# TODO: PlayCharacter(player, card_code)
#   "[Player] Deploy <Card>". Note: Stages use the same "Deploy" line.
#   Decide: one event with a `category`, or look the card up later (cards/).

# TODO: Attack(player, attacker_code, target_code, attacker_power, target_power)
#   "<A> attacking <B>" then the next line "<A>[7000] vs <B>[4000]".
#   Two lines -> one event: the parser needs a little memory between lines.
