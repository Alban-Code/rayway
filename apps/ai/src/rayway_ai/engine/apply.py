import dataclasses

from rayway_ai.engine.state import GameState, PlayerState
from rayway_ai.sim import Event, TurnOrderChosen, EndTurn, LeaderIs, LifeCount

def get_other_player(state: GameState, player_name: str):
    return next(player.name for player in state.players if player.name != player_name)

def setup_life(state: GameState, player_name: str, amount: int = 1) -> GameState:
    new_players = tuple(
            dataclasses.replace(p, life=amount) if p.name == player_name else p for p in state.players
        )
    return dataclasses.replace(state, players=new_players)

def compute_state(state: GameState, event: Event) -> GameState:
    if isinstance(event, LeaderIs):
        return dataclasses.replace(state, players=state.players + (PlayerState(name=event.player),))
    if isinstance(event, TurnOrderChosen):
        first_player = event.player if event.goes_first else get_other_player(state, event.player)
        return dataclasses.replace(state, turn = 1, active_player=first_player)
    if isinstance(event, EndTurn):
        return dataclasses.replace(state, turn = state.turn + 1, active_player=get_other_player(state, event.player))
    if isinstance(event, LifeCount):
        return setup_life(state, event.player, event.count)
    return state