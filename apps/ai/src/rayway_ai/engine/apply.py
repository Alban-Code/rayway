import dataclasses

from rayway_ai.engine.state import GameState, PlayerState
from rayway_ai.sim import Event, TurnOrderChosen, EndTurn, LeaderIs


def compute_state(state: GameState, event: Event) -> GameState:
    if isinstance(event, LeaderIs):
        return dataclasses.replace(state, players=state.players + (PlayerState(name=event.player),))
    if isinstance(event, TurnOrderChosen):
        return dataclasses.replace(state, turn = 1, active_player=event.player)
    if isinstance(event, EndTurn):
        return dataclasses.replace(state, turn = state.turn + 1, active_player=next(player.name for player in state.players if player.name != event.player))
    return state