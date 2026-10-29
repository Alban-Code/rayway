from rayway_ai.sim.events import (
    AttackClash, AttackDeclared, AttackFailed, BlockDeclared, CardDestroyed, Concede,
    CounterDiscarded, Deploy, DonGainEffect, DonMinus, DonPhase, Draw, EndTurn, GameOver,
    LeaderDamaged, LeaderIs, TurnOrderChosen,
)
from rayway_ai.sim.parser import parse_log

def parse_text(tmp_path, text: str):
    log = tmp_path/"game_log"
    log.write_text(text, encoding="utf-8")
    return parse_log(log)


# --- One line -> one event -------------------------------------------------

def test_don_phase(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Draw 2 Don\n")
    assert events == [DonPhase(line=1, turn=0, player="Alice#1", count=2)]

def test_don_minus(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Kaido [OP17-058]: Minus 2 Don\n")
    assert events == [DonMinus(line=1, turn=0, player="Alice#1", card_code="OP17-058", count=2)]

def test_leader_is(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Leader is Enel [OP15-058]\n")
    assert events == [LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058")]

def test_draw_at_start_of_turn_has_no_source(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Draw 1 Card\n")
    assert events == [Draw(line=1, turn=0, player="Alice#1", count=1, source_code=None)]

def test_draw_by_effect_can_draw_several_cards(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Mr. 3 (Galdino) [OP16-056]: Draw 2 Card\n")
    assert events == [Draw(line=1, turn=0, player="Alice#1", count=2, source_code="OP16-056")]

def test_deploy_from_hand(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Deploy Vista [OP16-011]\n")
    assert events == [Deploy(line=1, turn=0, player="Alice#1", source_code=None, card_code="OP16-011", from_trash=False)]

def test_deploy_by_effect(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Gin [OP15-007]: Deploy Morgan [OP15-017]\n")
    assert events == [Deploy(line=1, turn=0, player="Alice#1", source_code="OP15-007", card_code="OP15-017", from_trash=False)]

def test_deploy_from_trash(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Pirate Docking 6 [OP15-088]: Deployed Usopp [OP17-080] from Trash\n")
    assert events == [Deploy(line=1, turn=0, player="Alice#1", source_code="OP15-088", card_code="OP17-080", from_trash=True)]

def test_attack_declared(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Jinbe [OP11-031] attacking Monkey D. Luffy [ST30-012]\n")
    assert events == [AttackDeclared(line=1, turn=0, player="Alice#1", attacker_code="OP11-031", target_code="ST30-012")]

def test_block_declared(tmp_path):
    events = parse_text(tmp_path, "[Bob#2] Cabaji [ST25-002] Blocks\n")
    assert events == [BlockDeclared(line=1, turn=0, player="Bob#2", blocker_code="ST25-002")]

def test_counter_discarded(tmp_path):
    events = parse_text(tmp_path, "[Bob#2] Discard Hiking Bear [OP08-010] for Counter 2000\n")
    assert events == [CounterDiscarded(line=1, turn=0, player="Bob#2", card_code="OP08-010", value=2000)]

def test_attack_clash(tmp_path):
    events = parse_text(tmp_path, "Jinbe [OP11-031][8000] vs Monkey D. Luffy [ST30-012][9000]\n")
    assert events == [AttackClash(line=1, turn=0, attacker_code="OP11-031", attacker_power=8000, target_code="ST30-012", target_power=9000)]

def test_attack_clash_accepts_negative_power(tmp_path):
    events = parse_text(tmp_path, "Charlotte Brulee [ST34-003][-1000] vs Shiki [OP17-048][0]\n")
    assert events == [AttackClash(line=1, turn=0, attacker_code="ST34-003", attacker_power=-1000, target_code="OP17-048", target_power=0)]

def test_attack_failed(tmp_path):
    events = parse_text(tmp_path, "Attack Fails\n")
    assert events == [AttackFailed(line=1, turn=0)]

def test_leader_damaged_names_the_defending_leader(tmp_path):
    events = parse_text(tmp_path, "Jinbe [OP11-021] hit for 1 damage\n")
    assert events == [LeaderDamaged(line=1, turn=0, leader_code="OP11-021", damage=1)]

def test_card_destroyed(tmp_path):
    events = parse_text(tmp_path, "[Bob#2] Monkey D. Luffy [ST30-012] Destroyed\n")
    assert events == [CardDestroyed(line=1, turn=0, player="Bob#2", card_code="ST30-012")]

def test_concede(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Concedes!\n")
    assert events == [Concede(line=1, turn=0, player="Alice#1")]

def test_game_over(tmp_path):
    events = parse_text(tmp_path, "GameOver\n")
    assert events == [GameOver(line=1, turn=0)]


# --- Log format traps ------------------------------------------------------

def test_both_card_link_formats_give_the_same_event(tmp_path):
    new_format = '[Alice#1] Deploy Luffy [<mark><link="OP01-001">OP01-001</link></mark>]\n'
    old_format = '[Alice#1] Deploy Luffy ["OP01-001">OP01-001]\n'
    assert parse_text(tmp_path, new_format) == parse_text(tmp_path, old_format)
    assert parse_text(tmp_path, new_format)[0].card_code == "OP01-001"

def test_zero_width_space_is_removed_from_player_tag(tmp_path):
    events = parse_text(tmp_path, "[Alice​#1] Draw 2 Don\n")
    assert events[0].player == "Alice#1"

def test_guest_player_without_hash(tmp_path):
    events = parse_text(tmp_path, "[Guest 860fef] Draw 2 Don\n")
    assert events[0].player == "Guest 860fef"

def test_bold_tags_are_removed(tmp_path):
    events = parse_text(tmp_path, "[Alice#1] Draw 2 Don\n".replace("Draw", "<b>Draw</b>"))
    assert events == [DonPhase(line=1, turn=0, player="Alice#1", count=2)]

def test_unknown_lines_are_ignored(tmp_path):
    text = "Attempting to connect to ABC123\n[Alice#1] Looked at the top card\nRZ1|1|1|OP09-046|0|28|0|0|0|0|0|0|0\n"
    assert parse_text(tmp_path, text) == []

def test_line_number_counts_ignored_lines_too(tmp_path):
    events = parse_text(tmp_path, "Version is 1.44a.24\nRZ1|HDR|1.44a|2|RZ1\n[Alice#1] Draw 2 Don\n")
    assert events[0].line == 3


# --- State across lines ----------------------------------------------------
# The parser state is private to parse_log: we check it through its effect on the
# lines that come AFTER the one that changes it.

# Setup shared by the sequence tests. These two lines take lines 1 and 2 of the log.
TWO_LEADERS = (
    "[Alice#1] Leader is Jinbe [OP11-021]\n"
    "[Bob#2] Leader is Enel [OP15-058]\n"
)

def test_chose_to_go_first_starts_turn_1_with_that_player(tmp_path):
    events = parse_text(
        tmp_path,
        TWO_LEADERS
        + "[Bob#2] Chose to go First\n"
        + "[Bob#2] Draw 1 Don\n"
        + "Enel [OP15-058]: Draw 1 Don\n",  # no player in this line: it comes from the state
    )
    assert len(events) == 5
    assert events[2] == TurnOrderChosen(line=3, turn=0, player="Bob#2", goes_first=True)
    assert events[3:] == [
        DonPhase(line=4, turn=1, player="Bob#2", count=1),
        DonGainEffect(line=5, turn=1, player="Bob#2", card_code="OP15-058", count=1, rested=False),
    ]

def test_chose_to_go_second_starts_turn_1_with_other_player(tmp_path):
    events = parse_text(
        tmp_path,
        TWO_LEADERS
        + "[Bob#2] Chose to go Second\n"
        + "[Alice#1] Draw 1 Don\n"
        + "Jinbe [OP11-021]: Draw 1 Rested Don\n",  # no player in this line: it comes from the state
    )
    assert len(events) == 5
    assert events[2] == TurnOrderChosen(line=3, turn=0, player="Bob#2", goes_first=False)
    assert events[3:] == [
        DonPhase(line=4, turn=1, player="Alice#1", count=1),
        DonGainEffect(line=5, turn=1, player="Alice#1", card_code="OP11-021", count=1, rested=True),
    ]

def test_end_turn_closes_the_current_turn_and_passes_to_the_other_player(tmp_path):
    events = parse_text(
        tmp_path,
        TWO_LEADERS
        + "[Bob#2] Chose to go First\n"
        + "[Bob#2] End Turn\n"
        + "Jinbe [OP11-021]: Draw 1 Don\n",  # no player in this line: it comes from the state
    )
    # The EndTurn belongs to the turn it ends (1), the next line is in turn 2.
    assert events[3] == EndTurn(line=4, turn=1, player="Bob#2")
    assert events[4] == DonGainEffect(line=5, turn=2, player="Alice#1", card_code="OP11-021", count=1, rested=False)

def test_turns_alternate_between_players(tmp_path):
    events = parse_text(
        tmp_path,
        TWO_LEADERS
        + "[Bob#2] Chose to go First\n"
        + "[Bob#2] End Turn\n"
        + "[Alice#1] End Turn\n"
        + "[Bob#2] End Turn\n"
        + "Jinbe [OP11-021]: Draw 1 Don\n",
    )
    assert [e.turn for e in events if isinstance(e, EndTurn)] == [1, 2, 3]
    # Bob plays turns 1 and 3, so turn 4 belongs to Alice.
    assert events[-1] == DonGainEffect(line=7, turn=4, player="Alice#1", card_code="OP11-021", count=1, rested=False)


# --- A whole (short) game --------------------------------------------------

MINI_GAME = (
    TWO_LEADERS
    + "[Bob#2] Chose to go First\n"
    # Turn 1 (Bob)
    + "[Bob#2] Draw 1 Don\n"
    + "[Bob#2] Deploy Vista [OP16-011]\n"
    + "[Bob#2] End Turn\n"
    # Turn 2 (Alice)
    + "[Alice#1] Draw 1 Card\n"
    + "[Alice#1] Draw 2 Don\n"
    + "[Alice#1] Deploy Cabaji [ST25-002]\n"
    + "[Alice#1] End Turn\n"
    # Turn 3 (Bob): attacks Alice's Leader, she counters and the attack fails
    + "[Bob#2] Draw 1 Card\n"
    + "[Bob#2] Draw 2 Don\n"
    + "[Bob#2] Vista [OP16-011] attacking Jinbe [OP11-021]\n"
    + "[Alice#1] Discard Hiking Bear [OP08-010] for Counter 2000\n"
    + "Vista [OP16-011][5000] vs Jinbe [OP11-021][7000]\n"
    + "Attack Fails\n"
    + "[Bob#2] End Turn\n"
    # Turn 4 (Alice)
    + "[Alice#1] Concedes!\n"
    + "GameOver\n"
)

def test_a_whole_game_is_decoded_in_order(tmp_path):
    events = parse_text(tmp_path, MINI_GAME)
    assert [type(e).__name__ for e in events] == [
        "LeaderIs", "LeaderIs", "TurnOrderChosen",
        "DonPhase", "Deploy", "EndTurn",
        "Draw", "DonPhase", "Deploy", "EndTurn",
        "Draw", "DonPhase", "AttackDeclared", "CounterDiscarded", "AttackClash", "AttackFailed", "EndTurn",
        "Concede", "GameOver",
    ]

def test_a_whole_game_has_the_right_turns(tmp_path):
    events = parse_text(tmp_path, MINI_GAME)
    # Setup is turn 0, then each End Turn moves to the next turn.
    assert [e.turn for e in events] == [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4]
    assert [e.turn for e in events if isinstance(e, EndTurn)] == [1, 2, 3]
    assert events[-2] == Concede(line=18, turn=4, player="Alice#1")
    assert isinstance(events[-1], GameOver)


# --- V1 additions: snapshots, Life, Attach, mulligan, misc -------------------

import pytest
from rayway_ai.sim import events as ev

CASES = [
    ("[Alice#1] Life: 4", ev.LifeCount(line=1, turn=0, player="Alice#1", count=4)),
    ("[Alice#1] Hand: [OP15-061,ST10-010]", ev.ZoneSnapshot(line=1, turn=0, player="Alice#1", zone="Hand", cards=("OP15-061", "ST10-010"))),
    ("[Alice#1] Board: []", ev.ZoneSnapshot(line=1, turn=0, player="Alice#1", zone="Board", cards=())),
    ("[Alice#1] Zoro [OP15-113]: Add card to top of Life from Deck", ev.LifeAdded(line=1, turn=0, player="Alice#1", source_code="OP15-113", to_top=True, from_zone="Deck")),
    ("[Alice#1] Pudding [OP17-109]: Activate Trigger", ev.TriggerActivated(line=1, turn=0, player="Alice#1", card_code="OP17-109")),
    ("[Alice#1] Attach 2 Don to Kaido [OP17-058] (2 Total)", ev.DonAttached(line=1, turn=0, player="Alice#1", target_code="OP17-058", count=2, source_code=None, rested=False, total=2)),
    ("[Alice#1] Enel [OP15-058]: Attach 1 Rested Don to Ohm [OP15-061]", ev.DonAttached(line=1, turn=0, player="Alice#1", target_code="OP15-061", count=1, source_code="OP15-058", rested=True, total=None)),
    ("[Alice#1] Drew card from deck: Vista [OP16-011]", ev.CardDrawnFromDeck(line=1, turn=0, player="Alice#1", card_code="OP16-011")),
    ("[Alice#1] Mulligan", ev.Mulligan(line=1, turn=0, player="Alice#1")),
    ("[Alice#1] Hand before Mulligan: [A-1,B-2]", ev.HandBeforeMulligan(line=1, turn=0, player="Alice#1", cards=("A-1", "B-2"))),
    ("[Alice#1] Brulee [ST34-003]: Reveal and Draw Katakuri [OP11-067]", ev.RevealAndDraw(line=1, turn=0, player="Alice#1", source_code="ST34-003", card_code="OP11-067")),
    ("[Alice#1] Gamma Knife [OP13-075]: Rest 1 Don", ev.DonRested(line=1, turn=0, player="Alice#1", source_code="OP13-075", count=1)),
    ("[Alice#1] Luffy [OP16-022]: Activate 1 Don", ev.DonActivated(line=1, turn=0, player="Alice#1", source_code="OP16-022", count=1)),
    ("[Alice#1] Mamaragan [OP15-078]: Activate Counter", ev.CounterActivated(line=1, turn=0, player="Alice#1", card_code="OP15-078")),
    ("[Alice#1] Trash Nami [OP01-016]", ev.CardTrashed(line=1, turn=0, player="Alice#1", card_code="OP01-016", source_code=None, from_zone=None)),
    ("[Alice#1] Pudding [OP17-109]: Trash Atlas [EB05-050]", ev.CardTrashed(line=1, turn=0, player="Alice#1", card_code="EB05-050", source_code="OP17-109", from_zone=None)),
    ("[Alice#1] Trash Sanji [OP17-082] from Life", ev.CardTrashed(line=1, turn=0, player="Alice#1", card_code="OP17-082", source_code=None, from_zone="Life")),
    ("[Alice#1] Teach [OP09-081]: Doc Q [OP09-090] to Trash from Hand", ev.CardTrashed(line=1, turn=0, player="Alice#1", card_code="OP09-090", source_code="OP09-081", from_zone="Hand")),
    ("[Alice#1] Saul [OP17-089]: Trash 2 Remaining Cards", ev.CardsTrashed(line=1, turn=0, player="Alice#1", source_code="OP17-089", count=2, from_zone=None)),
    ("[Alice#1] Brook [OP15-022]: Trash 4 Cards from Deck", ev.CardsTrashed(line=1, turn=0, player="Alice#1", source_code="OP15-022", count=4, from_zone="Deck")),
    ("[Alice#1] Katakuri [OP11-067]: Set Pudding [PRB02-010] to Active", ev.CardSetActive(line=1, turn=0, player="Alice#1", source_code="OP11-067", target_code="PRB02-010")),
    ("[Alice#1] Tashigi [OP12-031]: Rest Katakuri [ST34-001]", ev.CardRested(line=1, turn=0, player="Alice#1", source_code="OP12-031", target_code="ST34-001")),
    ("[Alice#1] Shanks [OP17-020]: Rest Don [Don]", ev.CardRested(line=1, turn=0, player="Alice#1", source_code="OP17-020", target_code="Don")),
    ("[Alice#1] Dragon [OP15-077]: King [EB04-040] will not Activate during next Refresh", ev.RefreshSkipped(line=1, turn=0, player="Alice#1", source_code="OP15-077", target_code="EB04-040")),
    ("[Alice#1] Pudding [OP08-058]: Flip 2 Life Face Up", ev.LifeFlippedFaceUp(line=1, turn=0, player="Alice#1", source_code="OP08-058", count=2)),
    ("[Alice#1] Katakuri [OP11-062]: Looked at opponent's top deck", ev.TopDeckLooked(line=1, turn=0, player="Alice#1", source_code="OP11-062", finished=False)),
    ("[Alice#1] Katakuri [OP11-062]: Finished looking at opponent's top deck", ev.TopDeckLooked(line=1, turn=0, player="Alice#1", source_code="OP11-062", finished=True)),
    ("[Alice#1] Vista [OP16-011] revealed: Thatch [OP16-005]", ev.CardRevealed(line=1, turn=0, player="Alice#1", source_code="OP16-011", card_code="OP16-005")),
    ("[Alice#1] Picked no cards to Draw", ev.NoCardPicked(line=1, turn=0, player="Alice#1")),
    ("[Alice#1] Teach [OP09-081]: Added card to top of Life from Hand", ev.LifeAdded(line=1, turn=0, player="Alice#1", source_code="OP09-081", to_top=True, from_zone="Hand")),
    ("[Alice#1] Shiryu [OP17-020]: Add Catarina [OP12-001] to top of Life", ev.LifeAdded(line=1, turn=0, player="Alice#1", source_code="OP17-020", to_top=True, from_zone=None, card_code="OP12-001")),
    ("[Alice#1] Enel [OP15-118]: Added 1 Cards to Hand", ev.CardsAddedToHand(line=1, turn=0, player="Alice#1", source_code="OP15-118", count=1)),
    ("[Alice#1] Draw El Thor [OP15-075] from Trash", ev.CardTakenFromTrash(line=1, turn=0, player="Alice#1", card_code="OP15-075")),
    ("[Alice#1] Law [OP15-001]: Return Perona [OP13-010] to Hand", ev.CardReturnedToHand(line=1, turn=0, player="Alice#1", source_code="OP15-001", card_code="OP13-010")),
    ("[Alice#1] Gloriosa [OP11-001]: Send Law [ST10-010] to Deck Bottom", ev.CardSentToDeckBottom(line=1, turn=0, player="Alice#1", source_code="OP11-001", card_code="ST10-010", from_zone=None)),
    ("[Alice#1] Zoro [OP16-001]: Sent Saul [OP17-089] to Deck Bottom from Trash", ev.CardSentToDeckBottom(line=1, turn=0, player="Alice#1", source_code="OP16-001", card_code="OP17-089", from_zone="Trash")),
    ("[Alice#1] Sent a Card to Deck Bottom", ev.CardSentToDeckBottom(line=1, turn=0, player="Alice#1", source_code=None, card_code=None, from_zone=None)),
    ("[Alice#1] Placing Cards on Bottom of Deck", ev.CardsPlacedOnDeck(line=1, turn=0, player="Alice#1", bottom=True)),
    ("[Alice#1] Placing Cards on Top of Deck", ev.CardsPlacedOnDeck(line=1, turn=0, player="Alice#1", bottom=False)),
    ("[Alice#1] Zeus [OP03-001]: Takes Bottom Life", ev.LifeTaken(line=1, turn=0, player="Alice#1", source_code="OP03-001", top=False)),
    ("[Alice#1] Linlin [OP17-112]: Send 1 Life to Hand", ev.LifeSentToHand(line=1, turn=0, player="Alice#1", source_code="OP17-112", count=1)),
    ("[Alice#1] Banished 1 Life", ev.LifeLost(line=1, turn=0, player="Alice#1", count=1, banished=True)),
    ("[Alice#1] Loses 2 Life", ev.LifeLost(line=1, turn=0, player="Alice#1", count=2, banished=False)),
    ("[Alice#1] Hand after Mulligan: [A-1,B-2]", ev.HandAfterMulligan(line=1, turn=0, player="Alice#1", cards=("A-1", "B-2"))),
    ('[Alice#1] Rakuyo [OP17-016]: Destroy Jango [OP15-026]', ev.DestroyEffect(line=1, turn=0, player="Alice#1", source_code="OP17-016", target_code="OP15-026")),
    ('[Alice#1] Newgate [S-1]: Buff Bullet [T-2] -6000', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.POWER, amount=-6000)),
    ('[Alice#1] Bon Clay [S-1]: Buff Self 4000', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code=None, kind=ev.EffectKind.POWER, amount=4000, detail="Self")),
    ("[Alice#1] Zoro [S-1]: Grant Roger [T-2] 2000 until opponent's next turn end", ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.POWER, amount=2000, duration="opponent's next turn end")),
    ('[Alice#1] Law [S-1]: Grant Unblockable to Xebec [T-2]', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.KEYWORD, detail="Unblockable")),
    ('[Alice#1] Linlin [S-1]: Set Tashigi [T-2] Base Power to -7000', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.BASE_POWER, amount=-7000)),
    ("[Alice#1] Varie [S-1]: Holly [T-2] Cost 2 until Opponent's Turn End", ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.COST, amount=2, duration="Opponent's Turn End")),
    ('[Alice#1] Ace [S-1]: Give Newgate [T-2] Rush', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.KEYWORD, detail="Rush")),
    ('[Alice#1] Buggy [S-1]: Prisoner [T-2] Gains Blocker', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.KEYWORD, detail="Blocker")),
    ('[Alice#1] Luffy [T-2] Gains Double Attack', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code=None, target_code="T-2", kind=ev.EffectKind.KEYWORD, detail="Double Attack")),
    ("[Alice#1] Galdino [S-1]: Shiryu [T-2] can't attack next turn", ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.RESTRICTION, detail="can't attack next turn")),
    ("[Alice#1] Teach [S-1]: Opponent can't activate On Play abilities next turn!", ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code=None, kind=ev.EffectKind.RESTRICTION, detail="Opponent can't activate On Play abilities next turn!")),
    ('[Alice#1] Teach [S-1]: Nullify effects of Luffy [T-2]', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="S-1", target_code="T-2", kind=ev.EffectKind.RESTRICTION, detail="Nullify effects")),
    ('[Alice#1] Shiryu [T-2] is no longer blocked from attacking', ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code=None, target_code="T-2", kind=ev.EffectKind.RESTRICTION_LIFTED, detail="is no longer blocked from attacking")),
    ('Luffy [T-2] cost restored', ev.EffectApplied(line=1, turn=0, player=None, source_code=None, target_code="T-2", kind=ev.EffectKind.RESTRICTION_LIFTED, detail="cost restored")),
    ("[Alice#1] Doflamingo [OP14-060]: Target of Attack changed to Dellinger [OP14-067]", ev.AttackTargetChanged(line=1, turn=0, player="Alice#1", source_code="OP14-060", new_target_code="OP14-067")),
    ("[Alice#1] Sanji [OP12-041]: Activates Stealth Black [EB04-041]", ev.CardActivated(line=1, turn=0, player="Alice#1", source_code="OP12-041", card_code="EB04-041")),
    ("[Alice#1] Marco [OP16-014]: Prevent Effect To Rakuyo [OP17-016]", ev.EffectApplied(line=1, turn=0, player="Alice#1", source_code="OP16-014", target_code="OP17-016", kind=ev.EffectKind.RESTRICTION, detail="Prevent Effect")),
    ("[Alice#1] Varie [OP15-074]: Buff Enel [OP15-058] 2000 for the Combat", ev.CombatPowerBuffed(line=1, turn=0, player="Alice#1", source_code="OP15-074", target_code="OP15-058", amount=2000)),
]

@pytest.mark.parametrize("text,expected", CASES)
def test_v1_single_line(tmp_path, text, expected):
    assert parse_text(tmp_path, text + "\n") == [expected]


def test_counter_event_emits_a_combat_buff_then_a_turn_long_debuff(tmp_path):
    # OP17-017: +2000 "during this battle", then -2000 "during this turn" (no suffix on the line).
    events = parse_text(tmp_path, (
        "[Alice#1] Ga Ha [OP17-017]: Buff Ace [OP16-001] 2000 for the Combat\n"
        "[Alice#1] Ga Ha [OP17-017]: Buff Alvida [EB05-021] -2000\n"
    ))
    assert isinstance(events[0], ev.CombatPowerBuffed)
    assert events[1].kind is ev.EffectKind.POWER and events[1].duration is None and events[1].amount == -2000
