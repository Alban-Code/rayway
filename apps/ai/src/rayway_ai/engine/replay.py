from rayway_ai.engine.apply import compute_state
from rayway_ai.engine.state import GameState
from rayway_ai.engine.timeline import Timeline
from rayway_ai.sim.events import Event


def replay(events: list[Event]):
    state = GameState()
    states: list[GameState] = []
    for event in events:
        state = compute_state(state, event)
        states.append(state)
    return Timeline(states=tuple(states))