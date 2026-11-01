import dataclasses

from rayway_ai.engine.state import GameState, PlayerState
from rayway_ai.engine.utils import (
    change_life,
    get_other_player,
    get_player_by_name,
)
from rayway_ai.sim import EndTurn, Event, LeaderIs, LifeAdded, TurnOrderChosen
from rayway_ai.sim.events import (
    CardTrashed,
    DamageDealt,
    LeaderDamaged,
    LifeLost,
    LifeTaken,
    LifeSentToHand,
)

# Cards whose "Add ... to Life" goes to the opponent's Life (the line names the effect owner).
ADDS_TO_OPPONENT_LIFE = {"OP09-101"}


def compute_state(state: GameState, event: Event) -> GameState:
    if isinstance(event, LeaderIs):
        return dataclasses.replace(
            state, players=state.players + (PlayerState(name=event.player),)
        )
    if isinstance(event, TurnOrderChosen):
        first_player = (
            event.player
            if event.goes_first
            else get_other_player(state, event.player).name
        )
        return dataclasses.replace(state, turn=1, active_player=first_player)
    if isinstance(event, EndTurn):
        return dataclasses.replace(
            state,
            turn=state.turn + 1,
            active_player=get_other_player(state, event.player).name,
        )
    if isinstance(event, LeaderDamaged):
        player_damaged = get_other_player(state, state.active_player)
        return change_life(state, player_damaged.name, -event.damage)
    if isinstance(event, LifeAdded):
        owner = (
            get_other_player(state, event.player)
            if event.source_code in ADDS_TO_OPPONENT_LIFE
            else get_player_by_name(state, event.player)
        )
        return change_life(state, owner.name, 1)
    if isinstance(event, DamageDealt):
        player_damaged = get_other_player(state, event.player)
        return change_life(state, player_damaged.name, -event.amount)
    if isinstance(event, CardTrashed) and event.from_zone == "Life":
        return change_life(state, event.player, -1)
    # banished=True is skipped: the "Trash X from Life" line just before already counted it.
    if isinstance(event, LifeLost) and not event.banished:
        return change_life(state, event.player, -event.count)
    if isinstance(event, LifeTaken):
        return change_life(state, event.player, -1)
    if isinstance(event, LifeSentToHand):
        player_damaged = get_other_player(state, event.player)
        return change_life(state, player_damaged.name, -event.count)
    return state
