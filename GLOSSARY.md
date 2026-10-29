# Rayway

One Piece TCG companion. This glossary covers the game-replay vocabulary used by the AI coach (`apps/ai`): decoding One Piece Card Game SIM logs and replaying them into game states.

## Language

**Turn**:
One player's turn. Each `End Turn` ends exactly one turn, so a round where both players have played is two turns (turn 1 = first player, turn 2 = second player). Turn 0 is the setup before the first turn.
_Avoid_: Round, cycle

**Board**:
The area holding a player's Characters only, as the SIM snapshots it. The Leader, the Stage and DON!! are separate zones, not part of the Board.
_Avoid_: Field, terrain, battlefield

**Deploy**:
Putting a Character or Stage onto the table. The SIM's word for what the official rules call Play; the two are synonyms.
_Avoid_: Summon

**Event**:
One decoded line of a SIM log (a draw, an attack, an End Turn…). Events are facts read from the log, never deductions.
_Avoid_: Action, move

**Snapshot**:
The `Hand / Board / Trash / Life` lines the SIM writes for both players at the end of each turn. The ground truth a replay is checked against.
_Avoid_: Checkpoint, dump

**Timeline**:
The ordered list of game states a replay produces, one per Event, so a whole game can be walked through step by step. The final state is just its last element.
_Avoid_: History, trace

**Divergence**:
A mismatch between the replayed state and a Snapshot. Recorded rather than raised: each one points at a missing or mis-modelled Event.
_Avoid_: Error, desync
