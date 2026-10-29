from dataclasses import dataclass
from enum import Enum


# kw_only=True: without it, a subclass field with no default cannot follow a
# base field that has one. Here no field has a default, but keeping it
# keyword-only also forces explicit names at every call site: Draw(line=3, ...).
@dataclass(frozen=True, kw_only=True)
class Event:
    line: int  # 1-based line number in the log file
    turn: int  # 0 = setup (before the first turn), then 1, 2, 3...


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


@dataclass(frozen=True, kw_only=True)
class LifeCount(Event):
    player: str
    count: int # snapshot of the player's Life

@dataclass(frozen=True, kw_only=True)
class ZoneSnapshot(Event):
    player: str
    zone: str # "Hand" | "Board" | "Trash"
    cards: tuple[str, ...] # card codes, in log order

@dataclass(frozen=True, kw_only=True)
class LifeAdded(Event):
    player: str
    source_code: str
    to_top: bool
    from_zone: str | None # e.g. "Deck"; None when the line names the card instead
    card_code: str | None = None # only when the line names the added card

@dataclass(frozen=True, kw_only=True)
class TriggerActivated(Event):
    player: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class DonAttached(Event):
    player: str
    target_code: str
    count: int
    source_code: str | None # None = manual attach, else the card whose effect attaches
    rested: bool # effect form only: the DON!! comes from the rested pile
    total: int | None # manual form only: DON!! now attached to the target

@dataclass(frozen=True, kw_only=True)
class CardDrawnFromDeck(Event):
    # Identity of a card drawn; follows a `Draw N Card` line (which only has the count).
    player: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class Mulligan(Event):
    player: str

@dataclass(frozen=True, kw_only=True)
class HandBeforeMulligan(Event):
    player: str
    cards: tuple[str, ...]

@dataclass(frozen=True, kw_only=True)
class RevealAndDraw(Event):
    player: str
    source_code: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class DonRested(Event):
    player: str
    source_code: str
    count: int

@dataclass(frozen=True, kw_only=True)
class DonActivated(Event):
    player: str
    source_code: str
    count: int

@dataclass(frozen=True, kw_only=True)
class CounterActivated(Event):
    # Counter Event played from hand (the value is not on the line).
    player: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class CombatPowerBuffed(Event):
    # Only the "... for the Combat" lines; other buffs are EffectApplied(kind=POWER).
    player: str
    source_code: str
    target_code: str
    amount: int # for the combat

@dataclass(frozen=True, kw_only=True)
class CardTrashed(Event):
    player: str
    card_code: str
    source_code: str | None
    from_zone: str | None

@dataclass(frozen=True, kw_only=True)
class CardsTrashed(Event):
    player: str
    source_code: str
    count: int
    from_zone: str | None

# Family B: card state (active/rested)
@dataclass(frozen=True, kw_only=True)
class CardSetActive(Event):
    player: str
    source_code: str
    target_code: str # "Don" when the target is a DON!! card

@dataclass(frozen=True, kw_only=True)
class CardRested(Event):
    player: str
    source_code: str
    target_code: str # "Don" when the target is a DON!! card

@dataclass(frozen=True, kw_only=True)
class RefreshSkipped(Event):
    # Target stays rested at the next Refresh phase.
    player: str
    source_code: str
    target_code: str # "Don" when the target is a DON!! card

@dataclass(frozen=True, kw_only=True)
class LifeFlippedFaceUp(Event):
    player: str
    source_code: str
    count: int

# Family D: information revealed
@dataclass(frozen=True, kw_only=True)
class TopDeckLooked(Event):
    # The looked-at card is not on the line. finished=True is the closing line.
    player: str
    source_code: str
    finished: bool

@dataclass(frozen=True, kw_only=True)
class CardRevealed(Event):
    player: str
    source_code: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class NoCardPicked(Event):
    """'Picked no cards to Draw' after a look/search effect."""
    player: str

# Zones and Life
@dataclass(frozen=True, kw_only=True)
class CardsAddedToHand(Event):
    player: str
    source_code: str
    count: int

@dataclass(frozen=True, kw_only=True)
class CardTakenFromTrash(Event):
    # "Draw X from Trash": the card goes to hand.
    player: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class CardReturnedToHand(Event):
    player: str
    source_code: str
    card_code: str

@dataclass(frozen=True, kw_only=True)
class CardSentToDeckBottom(Event):
    player: str
    source_code: str | None # None on the bare "Sent a Card to Deck Bottom" line
    card_code: str | None # None on the bare "Sent a Card to Deck Bottom" line
    from_zone: str | None

@dataclass(frozen=True, kw_only=True)
class CardsPlacedOnDeck(Event):
    # End of a look/search effect: the remaining cards go back, order unknown.
    player: str
    bottom: bool

@dataclass(frozen=True, kw_only=True)
class LifeTaken(Event):
    # "Takes Top/Bottom Life"
    player: str
    source_code: str
    top: bool

@dataclass(frozen=True, kw_only=True)
class LifeSentToHand(Event):
    player: str
    source_code: str
    count: int

@dataclass(frozen=True, kw_only=True)
class LifeLost(Event):
    # Banished: the card line `Trash X from Life` comes just before (see CardTrashed).
    player: str
    count: int
    banished: bool # False = "Loses N Life"

@dataclass(frozen=True, kw_only=True)
class HandAfterMulligan(Event):
    player: str
    cards: tuple[str, ...]


# Family C: temporary modifiers
class EffectKind(Enum):
    POWER = "power"  # Buff / Grant. No duration on the line = until the end of the turn (checked on the buff cards in the logs)
    BASE_POWER = "base_power"
    COST = "cost"
    KEYWORD = "keyword"  # Rush, Blocker, Double Attack, Unblockable...
    RESTRICTION = "restriction"  # can't attack, can't be rested, nullified...
    RESTRICTION_LIFTED = "restriction_lifted"

@dataclass(frozen=True, kw_only=True)
class EffectApplied(Event):
    player: str | None # None on the bare "cost restored" line
    source_code: str | None # None when the line has no "SOURCE:" prefix
    target_code: str | None # None for "Buff Self" and for player-wide restrictions
    kind: EffectKind
    amount: int | None = None # POWER / BASE_POWER / COST
    duration: str | None = None # raw text when the line states one, else None
    detail: str | None = None # keyword / restriction text, "Self" for "Buff Self"

@dataclass(frozen=True, kw_only=True)
class DestroyEffect(Event):
    # The effect that destroys a card ("SRC: Destroy X"); the "X Destroyed" line is CardDestroyed.
    player: str
    source_code: str
    target_code: str

@dataclass(frozen=True, kw_only=True)
class AttackTargetChanged(Event):
    # The redirected attack's attacker is not on the line; it is the one of the last AttackDeclared.
    player: str
    source_code: str
    new_target_code: str

@dataclass(frozen=True, kw_only=True)
class CardActivated(Event):
    # "SRC: Activates X": an effect plays another card (e.g. an Event) as part of its resolution.
    player: str
    source_code: str
    card_code: str

