from rayway_ai.engine.apply import compute_state
from rayway_ai.engine.snapshots import Divergence, consume_snapshot
from rayway_ai.engine.state import GameState
from rayway_ai.engine.timeline import Timeline
from rayway_ai.sim.events import Event, LifeCount, ZoneSnapshot


def replay(events: list[Event]):
    state = GameState()
    states: list[GameState] = []
    divergences: list[Divergence] = []
    for event in events:
        if isinstance(event, LifeCount) or isinstance(event, ZoneSnapshot):
            state, divergence = consume_snapshot(state, event)
            states.append(state)
            if divergence is not None:
                divergences.append(divergence)
        else:
            state = compute_state(state, event)
            states.append(state)
    return Timeline(states=tuple(states), divergences=tuple(divergences))