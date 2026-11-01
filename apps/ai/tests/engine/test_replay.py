from rayway_ai.engine import replay
from rayway_ai.sim.events import (
    CardTrashed,
    DamageDealt,
    EndTurn,
    LeaderDamaged,
    LeaderIs,
    LifeAdded,
    LifeCount,
    LifeFlippedFaceUp,
    LifeLost,
    LifeSentToHand,
    LifeTaken,
    TurnOrderChosen,
    ZoneSnapshot,
)


def test_chose_go_first():
    events = [TurnOrderChosen(line=1, turn=0, player="Alice#1", goes_first=True)]
    timeline = replay(events)
    assert timeline.states[-1].active_player == "Alice#1"
    assert timeline.states[-1].turn == 1


def test_chose_go_second():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        TurnOrderChosen(line=3, turn=0, player="Alice#1", goes_first=False),
        EndTurn(line=4, turn=1, player="Bob#2"),
    ]
    timeline = replay(events)
    assert timeline.states[-2].active_player == "Bob#2"
    assert timeline.states[-2].turn == 1
    assert timeline.states[-1].active_player == "Alice#1"
    assert timeline.states[-1].turn == 2


def test_end_turn():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        TurnOrderChosen(line=3, turn=0, player="Alice#1", goes_first=True),
        EndTurn(line=4, turn=1, player="Alice#1"),
    ]
    timeline = replay(events)
    assert timeline.states[-1].active_player == "Bob#2"
    assert timeline.states[-1].turn == 2


def test_life_count_is_5():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        LifeCount(line=4, turn=1, player="Bob#2", count=5),
    ]
    timeline = replay(events)
    bob = next(p for p in timeline.states[-1].players if p.name == "Bob#2")
    alice = next(p for p in timeline.states[-1].players if p.name == "Alice#1")
    assert bob.life == 5
    assert alice.life == 5


def test_first_life_count_no_divergence():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        LifeCount(line=4, turn=1, player="Bob#2", count=5),
    ]
    timeline = replay(events)
    assert timeline.divergences == ()


def test_life_snapshot_same_as_state_no_divergence():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        LifeCount(line=4, turn=1, player="Bob#2", count=5),
        LifeCount(line=5, turn=1, player="Alice#1", count=5),
    ]
    timeline = replay(events)
    assert timeline.divergences == ()


def test_life_snapshot():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        LifeCount(line=4, turn=1, player="Bob#2", count=5),
        LifeCount(line=5, turn=3, player="Alice#1", count=4),
    ]
    timeline = replay(events)
    alice = next(p for p in timeline.states[-1].players if p.name == "Alice#1")
    assert alice.life == 4
    assert timeline.divergences != ()
    assert timeline.divergences[-1].player == "Alice#1"
    assert timeline.divergences[-1].zone == "Life"
    assert timeline.divergences[-1].correct == 4
    assert timeline.divergences[-1].actual == 5


def test_zone_snapshot_leaves_state_unchanged():
    events = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        ZoneSnapshot(
            line=4, turn=1, player="Alice#1", zone="Hand", cards=("OP15-061",)
        ),
    ]
    timeline = replay(events)
    assert timeline.divergences == ()
    assert timeline.states[-1] == timeline.states[-2]


def play(*events):
    """Alice (first player) vs Bob, both at 5 Life, then the events under test."""
    setup = [
        LeaderIs(
            line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"
        ),
        LeaderIs(
            line=2,
            turn=0,
            player="Bob#2",
            leader_name="Charlotte Linlin",
            leader_code="OP17-099",
        ),
        TurnOrderChosen(line=3, turn=0, player="Alice#1", goes_first=True),
        LifeCount(line=4, turn=1, player="Alice#1", count=5),
        LifeCount(line=5, turn=1, player="Bob#2", count=5),
    ]
    return replay(setup + list(events))


def lives(timeline):
    """(Alice's Life, Bob's Life) in the last state."""
    by_name = {p.name: p.life for p in timeline.states[-1].players}
    return by_name["Alice#1"], by_name["Bob#2"]


def test_leader_damaged_lowers_the_defender_life():
    # Alice is the active player and attacks: Bob is the defender.
    timeline = play(LeaderDamaged(line=6, turn=1, leader_code="OP17-099", damage=1))
    assert lives(timeline) == (5, 4)


def test_life_added_gives_one_life():
    # A card put on top of the Life area from the deck: the owner of the effect gains 1 Life.
    timeline = play(
        LifeAdded(
            line=6,
            turn=1,
            player="Bob#2",
            source_code="OP17-114",
            to_top=True,
            from_zone="Deck",
        )
    )
    assert lives(timeline) == (5, 6)


def test_damage_dealt_hits_the_opponent_of_the_effect_owner():
    # Alice is the active player, but the effect belongs to Bob (an On K.O. effect
    # during Alice's attack): the victim is Alice, the opponent of the effect's owner.
    timeline = play(
        DamageDealt(line=6, turn=1, player="Bob#2", source_code="EB03-055", amount=1)
    )
    assert lives(timeline) == (4, 5)


def trashed(from_zone):
    return CardTrashed(
        line=6,
        turn=1,
        player="Bob#2",
        card_code="OP14-104",
        source_code=None,
        from_zone=from_zone,
    )


def test_trashing_a_life_card_removes_one_life():
    assert lives(play(trashed("Life"))) == (5, 4)


def test_trashing_from_another_zone_leaves_life_unchanged():
    assert lives(play(trashed("Hand"))) == (5, 5)


def test_losing_life_removes_that_many_cards():
    timeline = play(LifeLost(line=6, turn=1, player="Bob#2", count=2, banished=False))
    assert lives(timeline) == (5, 3)


def test_banished_life_is_counted_once():
    # "Trash X from Life" already took the card; the Banished line right after must not
    # take a second one.
    timeline = play(
        trashed("Life"),
        LifeLost(line=7, turn=1, player="Bob#2", count=1, banished=True),
    )
    assert lives(timeline) == (5, 4)


def test_taking_a_life_card_removes_one_life():
    timeline = play(
        LifeTaken(line=6, turn=1, player="Bob#2", source_code="OP17-114", top=True)
    )
    assert lives(timeline) == (5, 4)


def test_flipping_a_life_card_face_up_leaves_life_unchanged():
    timeline = play(
        LifeFlippedFaceUp(
            line=6, turn=1, player="Bob#2", source_code="OP17-114", count=1
        )
    )
    assert lives(timeline) == (5, 5)


def test_life_sent_to_hand():
    timeline = play(
        LifeSentToHand(
            line=6, turn=1, player="Alice#1", count=1, source_code="EB03-053"
        )
    )
    assert lives(timeline) == (5, 4)


def test_life_never_goes_below_zero():
    # Double Attack on a Leader with 1 Life: the log says 2 damage, only 1 Life card exists.
    timeline = play(LeaderDamaged(line=6, turn=1, leader_code="OP17-099", damage=2))
    assert lives(timeline) == (5, 3)
    timeline = play(
        LifeLost(line=6, turn=1, player="Bob#2", count=5, banished=False),
        LeaderDamaged(line=7, turn=1, leader_code="OP17-099", damage=2),
    )
    assert lives(timeline) == (5, 0)


def test_life_added_by_kuzan_goes_to_the_opponent():
    # Kuzan's owner is named on the line, but the Life card lands on the opponent's side.
    timeline = play(
        LifeAdded(
            line=6,
            turn=1,
            player="Alice#1",
            source_code="OP09-101",
            to_top=False,
            from_zone=None,
            card_code="OP12-071",
        )
    )
    assert lives(timeline) == (5, 6)
