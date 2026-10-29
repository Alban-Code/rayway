from rayway_ai.sim.events import TurnOrderChosen, EndTurn, LeaderIs
from rayway_ai.engine import replay

def test_turn_order_chosen():
    events = [TurnOrderChosen(line=1, turn=0, player="Alice#1", goes_first=True)]
    timeline = replay(events)
    assert timeline.states[-1].active_player == "Alice#1"
    assert timeline.states[-1].turn == 1

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