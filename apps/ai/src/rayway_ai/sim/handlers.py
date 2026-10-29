import re
from collections.abc import Callable

from rayway_ai.sim.events import (
    Event, DonPhase, DonGainEffect, DonMinus, LeaderIs, TurnOrderChosen, EndTurn, Draw, Deploy,
    AttackDeclared, BlockDeclared, CounterDiscarded, AttackClash, AttackFailed, LeaderDamaged, CardDestroyed,
    Concede, GameOver, LifeCount, ZoneSnapshot, LifeAdded, TriggerActivated, DonAttached, CardDrawnFromDeck,
    Mulligan, HandBeforeMulligan, RevealAndDraw, DonRested, DonActivated, CounterActivated, CombatPowerBuffed, CardTrashed,
    CardsTrashed, CardSetActive, CardRested, RefreshSkipped, LifeFlippedFaceUp, TopDeckLooked, CardRevealed,
    NoCardPicked, CardsAddedToHand, CardTakenFromTrash, CardReturnedToHand, CardSentToDeckBottom, CardsPlacedOnDeck,
    LifeTaken, LifeSentToHand, LifeLost, HandAfterMulligan, EffectApplied, EffectKind, DestroyEffect,
    AttackTargetChanged, CardActivated,
)

from rayway_ai.sim.patterns import (
    DON_PHASE, DON_GAIN_EFFECT, DON_MINUS, LEADER_IS, CHOSE_ORDER, END_TURN, DRAW, DEPLOY, ATTACK_DECLARED, BLOCK,
    COUNTER_DISCARD, ATTACK_CLASH, ATTACK_FAILS, LEADER_HIT, DESTROYED, CONCEDE, GAME_OVER, LIFE_COUNT, ZONE_SNAPSHOT,
    LIFE_ADD, TRIGGER, ATTACH_MANUAL, ATTACH_EFFECT, DREW, MULLIGAN, HAND_BEFORE_MULLIGAN, REVEAL_DRAW, REST_DON,
    ACTIVATE_DON, ACTIVATE_COUNTER, BUFF, TRASH_CARD, CARD_TO_TRASH, CARDS_TRASHED,
    SET_ACTIVE, CARD_RESTED, REFRESH_SKIPPED, LIFE_FLIPPED, TOP_DECK_LOOKED, CARD_REVEALED, NO_CARD_PICKED,
    CARDS_ADDED_TO_HAND, TAKEN_FROM_TRASH, RETURN_TO_HAND, SENT_TO_DECK_BOTTOM, CARDS_PLACED_ON_DECK, LIFE_ADD_CARD,
    LIFE_TAKEN, LIFE_TO_HAND, LIFE_LOST, HAND_AFTER_MULLIGAN,
    DESTROY_EFFECT, BUFF_POWER, GRANT_POWER, GRANT_KEYWORD, BASE_POWER, COST_MODIFIED, GIVE_KEYWORD, GAINS_KEYWORD,
    RESTRICTION, RESTRICTION_PLAYER, NULLIFY, RESTRICTION_LIFTED, TARGET_CHANGED, CARD_ACTIVATED, PREVENT_EFFECT,
)
from rayway_ai.sim.state import ParserState

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

def _codes(raw: str) -> tuple[str, ...]:
    return tuple(raw.split(",")) if raw else ()

def _life_count(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeCount(line=line_number, turn=state.turn, player=m["player"], count=int(m["count"]))

def _zone_snapshot(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return ZoneSnapshot(line=line_number, turn=state.turn, player=m["player"], zone=m["zone"], cards=_codes(m["codes"]))

def _life_add(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeAdded(line=line_number, turn=state.turn, player=m["player"], source_code=m["code"], to_top=(m["pos"] == "top"), from_zone=m["zone"])

def _trigger(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return TriggerActivated(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"])

def _attach_manual(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonAttached(line=line_number, turn=state.turn, player=m["player"], target_code=m["code"], count=int(m["count"]), source_code=None, rested=False, total=int(m["total"]))

def _attach_effect(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonAttached(line=line_number, turn=state.turn, player=m["player"], target_code=m["code"], count=int(m["count"]), source_code=m["src_code"], rested=m["rested"] is not None, total=None)

def _drew(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardDrawnFromDeck(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"])

def _mulligan(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return Mulligan(line=line_number, turn=state.turn, player=m["player"])

def _hand_before_mulligan(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return HandBeforeMulligan(line=line_number, turn=state.turn, player=m["player"], cards=_codes(m["codes"]))

def _reveal_draw(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return RevealAndDraw(line=line_number, turn=state.turn, player=m["player"], source_code=m["src_code"], card_code=m["code"])

def _rest_don(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonRested(line=line_number, turn=state.turn, player=m["player"], source_code=m["code"], count=int(m["count"]))

def _activate_don(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DonActivated(line=line_number, turn=state.turn, player=m["player"], source_code=m["code"], count=int(m["count"]))

def _activate_counter(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CounterActivated(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"])

def _combat_buff(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CombatPowerBuffed(line=line_number, turn=state.turn, player=m["player"], source_code=m["src_code"], target_code=m["code"], amount=int(m["amount"]))

def _card_trashed(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardTrashed(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"], source_code=m["source_code"], from_zone=m["zone"])

def _cards_trashed(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardsTrashed(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], count=int(m["count"]), from_zone=m["zone"])

def _set_active(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardSetActive(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"])

def _card_rested(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardRested(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"])

def _refresh_skipped(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return RefreshSkipped(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"])

def _life_flipped(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeFlippedFaceUp(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], count=int(m["count"]))

def _top_deck_looked(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return TopDeckLooked(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], finished=m["finished"] is not None)

def _card_revealed(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardRevealed(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], card_code=m["code"])

def _no_card_picked(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return NoCardPicked(line=line_number, turn=state.turn, player=m["player"])

def _life_add_card(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeAdded(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], to_top=(m["pos"] == "top"), from_zone=None, card_code=m["code"])

def _cards_added_to_hand(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardsAddedToHand(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], count=int(m["count"]))

def _taken_from_trash(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardTakenFromTrash(line=line_number, turn=state.turn, player=m["player"], card_code=m["code"])

def _return_to_hand(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardReturnedToHand(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], card_code=m["code"])

def _sent_to_deck_bottom(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardSentToDeckBottom(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], card_code=m["code"], from_zone=m["zone"])

def _cards_placed_on_deck(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardsPlacedOnDeck(line=line_number, turn=state.turn, player=m["player"], bottom=(m["where"] == "Bottom"))

def _life_taken(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeTaken(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], top=(m["pos"] == "Top"))

def _life_to_hand(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeSentToHand(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], count=int(m["count"]))

def _life_lost(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return LifeLost(line=line_number, turn=state.turn, player=m["player"], count=int(m["count"]), banished=(m["how"] == "Banished"))

def _hand_after_mulligan(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return HandAfterMulligan(line=line_number, turn=state.turn, player=m["player"], cards=_codes(m["codes"]))

def _destroy_effect(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return DestroyEffect(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"])

def _buff_power(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    is_self = m["self"] is not None
    return EffectApplied(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"], kind=EffectKind.POWER, amount=int(m["amount"]), detail="Self" if is_self else None)

def _grant_power(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return EffectApplied(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"], kind=EffectKind.POWER, amount=int(m["amount"]), duration=m["duration"])

def _base_power(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return EffectApplied(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"], kind=EffectKind.BASE_POWER, amount=int(m["amount"]))

def _cost_modified(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return EffectApplied(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"], kind=EffectKind.COST, amount=int(m["amount"]), duration=m["duration"])

# Shared by every pattern whose effect is a keyword or a restriction on a target card ("detail" = the text).
def _detail_effect(kind: EffectKind) -> "Handler":
    def build(m: re.Match[str], line_number: int, state: ParserState) -> Event:
        groups = m.groupdict()
        return EffectApplied(line=line_number, turn=state.turn, player=m["player"], source_code=groups.get("source_code"), target_code=groups.get("code"), kind=kind, detail=m["detail"], duration=groups.get("duration"))
    return build

def _nullify(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return EffectApplied(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], target_code=m["code"], kind=EffectKind.RESTRICTION, detail="Nullify effects", duration=m["duration"])

def _target_changed(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return AttackTargetChanged(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], new_target_code=m["code"])

def _card_activated(m: re.Match[str], line_number: int, state: ParserState) -> Event:
    return CardActivated(line=line_number, turn=state.turn, player=m["player"], source_code=m["source_code"], card_code=m["code"])

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
    (LIFE_COUNT, _life_count),
    (ZONE_SNAPSHOT, _zone_snapshot),
    (LIFE_ADD, _life_add),
    (TRIGGER, _trigger),
    (ATTACH_MANUAL, _attach_manual),
    (ATTACH_EFFECT, _attach_effect),
    (DREW, _drew),
    (MULLIGAN, _mulligan),
    (HAND_BEFORE_MULLIGAN, _hand_before_mulligan),
    (REVEAL_DRAW, _reveal_draw),
    (REST_DON, _rest_don),
    (ACTIVATE_DON, _activate_don),
    (ACTIVATE_COUNTER, _activate_counter),
    (BUFF, _combat_buff),
    (TRASH_CARD, _card_trashed),
    (CARD_TO_TRASH, _card_trashed),
    (CARDS_TRASHED, _cards_trashed),
    (SET_ACTIVE, _set_active),
    (CARD_RESTED, _card_rested),
    (REFRESH_SKIPPED, _refresh_skipped),
    (LIFE_FLIPPED, _life_flipped),
    (TOP_DECK_LOOKED, _top_deck_looked),
    (CARD_REVEALED, _card_revealed),
    (NO_CARD_PICKED, _no_card_picked),
    (LIFE_ADD_CARD, _life_add_card),
    (CARDS_ADDED_TO_HAND, _cards_added_to_hand),
    (TAKEN_FROM_TRASH, _taken_from_trash),
    (RETURN_TO_HAND, _return_to_hand),
    (SENT_TO_DECK_BOTTOM, _sent_to_deck_bottom),
    (CARDS_PLACED_ON_DECK, _cards_placed_on_deck),
    (LIFE_TAKEN, _life_taken),
    (LIFE_TO_HAND, _life_to_hand),
    (LIFE_LOST, _life_lost),
    (HAND_AFTER_MULLIGAN, _hand_after_mulligan),
    (DESTROY_EFFECT, _destroy_effect),
    (BUFF_POWER, _buff_power),
    (GRANT_POWER, _grant_power),
    (GRANT_KEYWORD, _detail_effect(EffectKind.KEYWORD)),
    (BASE_POWER, _base_power),
    (COST_MODIFIED, _cost_modified),
    (GIVE_KEYWORD, _detail_effect(EffectKind.KEYWORD)),
    (GAINS_KEYWORD, _detail_effect(EffectKind.KEYWORD)),
    (RESTRICTION, _detail_effect(EffectKind.RESTRICTION)),
    (RESTRICTION_PLAYER, _detail_effect(EffectKind.RESTRICTION)),
    (NULLIFY, _nullify),
    (RESTRICTION_LIFTED, _detail_effect(EffectKind.RESTRICTION_LIFTED)),
    (TARGET_CHANGED, _target_changed),
    (CARD_ACTIVATED, _card_activated),
    (PREVENT_EFFECT, _detail_effect(EffectKind.RESTRICTION)),
]
