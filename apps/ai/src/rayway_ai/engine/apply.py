import dataclasses

from rayway_ai.engine.state import GameState, PlayerState
from rayway_ai.engine.utils import get_other_player
from rayway_ai.sim import Event, TurnOrderChosen, EndTurn, LeaderIs

def compute_state(state: GameState, event: Event) -> GameState:
    if isinstance(event, LeaderIs):
        return dataclasses.replace(state, players=state.players + (PlayerState(name=event.player),))
    if isinstance(event, TurnOrderChosen):
        first_player = event.player if event.goes_first else get_other_player(state, event.player)
        return dataclasses.replace(state, turn = 1, active_player=first_player)
    if isinstance(event, EndTurn):
        return dataclasses.replace(state, turn = state.turn + 1, active_player=get_other_player(state, event.player))
    return state