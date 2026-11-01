import dataclasses

from rayway_ai.engine.state import GameState, PlayerState


def get_player_by_name(state: GameState, player_name: str) -> PlayerState:
    return next(player for player in state.players if player.name == player_name)


def get_other_player(state: GameState, player_name: str) -> PlayerState:
    return next(player for player in state.players if player.name != player_name)


def setup_life(state: GameState, player_name: str, amount: int = 1) -> GameState:
    new_players = tuple(
        dataclasses.replace(p, life=amount) if p.name == player_name else p
        for p in state.players
    )
    return dataclasses.replace(state, players=new_players)


def change_life(state: GameState, player_name: str, delta: int) -> GameState:
    new_players = tuple(
        dataclasses.replace(p, life=max(0, p.life + delta))
        if p.name == player_name
        else p
        for p in state.players
    )
    return dataclasses.replace(state, players=new_players)
