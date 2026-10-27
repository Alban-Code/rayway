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
class Draw(Event):
    player: str
    count: int
    source_code: str | None # None = start of turn draw


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

@dataclass(frozen=True, kw_only=True)
class DonMinus(Event):
    player: str
    card_code: str
    count: int

@dataclass(frozen=True, kw_only=True)
class LeaderIs(Event):
    player: str
    leader_name: str
    leader_code: str

@dataclass(frozen=True, kw_only=True)   
class TurnOrderChosen(Event):
    player: str
    goes_first: bool

@dataclass(frozen=True, kw_only=True)   
class EndTurn(Event):
    player: str

@dataclass(frozen=True, kw_only=True)
class Deploy(Event):
    player: str
    source_code: str | None# None = played from hand, else the card whose effect deploys
    card_code: str  # card code of the deployed card
    from_trash: bool

@dataclass(frozen=True, kw_only=True)
class AttackDeclared(Event):
    player: str # player declaring attack
    attacker_code: str # card code of the attacking card
    target_code: str # card code of the attacked card

@dataclass(frozen=True, kw_only=True)
class BlockDeclared(Event):
    player: str # defending player
    blocker_code: str # card code of the blocking card

@dataclass(frozen=True, kw_only=True)
class CounterDiscarded(Event):
    player: str # defending player
    card_code: str # card code of the discarded card
    value: int # counter value added to the defender

@dataclass(frozen=True, kw_only=True)
class AttackClash(Event):
    # No player: the log line has none.
    attacker_code: str
    attacker_power: int # can be negative
    target_code: str # the blocker if the attack was blocked
    target_power: int # can be negative

@dataclass(frozen=True, kw_only=True)
class AttackFailed(Event):
    """The 'Attack Fails' line carries no payload."""

@dataclass(frozen=True, kw_only=True)
class LeaderDamaged(Event):
    # No player: the log line has none.
    leader_code: str # the Leader that takes the damage (the defender, not the attacker)
    damage: int

@dataclass(frozen=True, kw_only=True)
class CardDestroyed(Event):
    # Also used outside combat (effects), so it is not tied to an attack.
    player: str # owner of the destroyed card
    card_code: str

@dataclass(frozen=True, kw_only=True)
class Concede(Event):
    player: str # the player who concedes (and so loses)

@dataclass(frozen=True, kw_only=True)
class GameOver(Event):
    """The 'GameOver' line carries no payload (last line after a lethal hit or a concession)."""
