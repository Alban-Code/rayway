from rayway_ai.sim.events import TurnOrderChosen, EndTurn, LeaderIs, LifeCount
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