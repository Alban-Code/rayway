from rayway_ai.sim.events import TurnOrderChosen, EndTurn, LeaderIs, LifeCount, ZoneSnapshot
from rayway_ai.engine import replay

def test_chose_go_first():
    events = [TurnOrderChosen(line=1, turn=0, player="Alice#1", goes_first=True)]
    timeline = replay(events)
    assert timeline.states[-1].active_player == "Alice#1"
    assert timeline.states[-1].turn == 1

def test_chose_go_second():
    events = [
        LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
        LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
        TurnOrderChosen(line=3, turn=0, player="Alice#1", goes_first=False), 
        EndTurn(line=4, turn=1, player="Bob#2")
    ]
    timeline = replay(events)
    assert timeline.states[-2].active_player == "Bob#2"
    assert timeline.states[-2].turn == 1
    assert timeline.states[-1].active_player == "Alice#1"
    assert timeline.states[-1].turn == 2

def test_end_turn():
    events = [
        LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
        LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
        TurnOrderChosen(line=3, turn=0, player="Alice#1", goes_first=True), 
        EndTurn(line=4, turn=1, player="Alice#1")
    ]
    timeline = replay(events)
    assert timeline.states[-1].active_player == "Bob#2"
    assert timeline.states[-1].turn == 2

def test_life_count_is_5():
    events = [
            LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
            LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
            LifeCount(line=3, turn=1, player="Alice#1", count=5),
            LifeCount(line=4, turn=1, player="Bob#2", count=5)
        ]
    timeline = replay(events)
    bob = next(p for p in timeline.states[-1].players if p.name == "Bob#2")
    alice = next(p for p in timeline.states[-1].players if p.name == "Alice#1")
    assert bob.life == 5
    assert alice.life == 5

def test_first_life_count_no_divergence():
    events = [
                LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
                LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
                LifeCount(line=3, turn=1, player="Alice#1", count=5),
                LifeCount(line=4, turn=1, player="Bob#2", count=5)
            ]
    timeline = replay(events)
    assert timeline.divergences == ()

def test_life_snapshot_same_as_state_no_divergence():
    events = [
                LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
                LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
                LifeCount(line=3, turn=1, player="Alice#1", count=5),
                LifeCount(line=4, turn=1, player="Bob#2", count=5),
                LifeCount(line=5, turn=1, player="Alice#1", count=5)
            ]
    timeline = replay(events)
    assert timeline.divergences == ()

def test_life_snapshot():
    events = [
        LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
        LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        LifeCount(line=4, turn=1, player="Bob#2", count=5),
        LifeCount(line=5, turn=3, player="Alice#1", count=4)
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
        LeaderIs(line=1, turn=0, player="Alice#1", leader_name="Enel", leader_code="OP15-058"),
        LeaderIs(line=2, turn=0, player="Bob#2", leader_name="Charlotte Linlin", leader_code="OP17-099"),
        LifeCount(line=3, turn=1, player="Alice#1", count=5),
        ZoneSnapshot(line=4, turn=1, player="Alice#1", zone="Hand", cards=("OP15-061",)),
    ]
    timeline = replay(events)
    assert timeline.divergences == ()
    assert timeline.states[-1] == timeline.states[-2]
