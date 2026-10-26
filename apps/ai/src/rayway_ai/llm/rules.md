## One Piece Card Game: core rules
Source: official Comprehensive Rules v1.2.1 (2026-08-28). If card text contradicts these rules, the card text wins.

### Players and win/lose
- 2 players. A player LOSES when (a) their Leader takes damage while they have 0 Life cards, or (b) their deck has 0 cards.
- Leaders have a Life value (NOT hit points). Leaders CAN be attacked. Damage to a Leader moves the top Life card to the hand.

### Card categories and which fields exist
- Leader: has Life, power, attribute, color, type. NO cost and NO counter. Never played from hand; starts in the Leader area.
- Character: has cost, power, counter value, attribute, color, type. Played to the Character area (max 5).
- Event: has cost, color, type. NO power, NO attribute, NO counter value. Activated from hand, then trashed. [Main] = playable in your Main Phase, [Counter] = playable in the opponent's Counter Step.
- Stage: has cost, color, type. NO power, attribute or counter. Stage area holds max 1 (a new Stage replaces the old one).
- DON!!: the resource cards (cost area). Not part of the 50-card deck.
- A field that is null/absent in the card data means the category simply does not have it. State nothing about it; never invent a value.
- Colors: red, green, blue, purple, black, yellow (a card can have several). Attributes: Slash, Strike, Ranged, Special, Wisdom, "?". Types are tribes (e.g. "Straw Hat Crew").
- In card text: [..] = keyword/timing, {..} = card type (tribe), <..> = attribute, "Name" or [Name] = card name.

### Deck construction
- 1 Leader + exactly 50 cards (Characters, Events, Stages) + 10 DON!! cards. Some Leaders change this by their own text (e.g. Enel OP15-058: "your DON!! deck consists of 6 cards"), so check the Leader's effect.
- Every card's color must be one of the Leader's colors. Max 4 copies per card number.

### Setup
- Shuffle, decide first player, each player draws 5 cards (may redraw all 5 once), then puts cards equal to the Leader's Life value face-down as Life cards.

### Turn structure (in order)
1. Refresh: "until your next turn" effects end; DON!! given to cards return to the cost area (rested); all your rested cards become active.
2. Draw: draw 1 card. The first player skips this on their first turn.
3. DON!!: place 2 DON!! from the DON!! deck into the cost area (the first player places only 1 on their first turn).
4. Main: in any order and any number of times: play Characters/Stages (pay cost by resting active DON!!), activate [Main] Events and [Activate: Main] effects, give DON!! cards, attack.
5. End: [End of Your Turn] effects, then temporary effects expire.
- Giving DON!!: put 1 active DON!! under your Leader or a Character; it gives +1000 power during your turn. When the card leaves, the DON!! return rested.
- Nobody can attack on their own first turn. A Character cannot attack the turn it is played unless it has [Rush].

### Attacks and battles
- Attacker: your active Leader or active Character, which becomes rested. Target: the opponent's Leader or one of their RESTED Characters.
1. Attack Step: [When Attacking] / [On Your Opponent's Attack] effects trigger.
2. Block Step: the defender may rest one [Blocker] to take over as the target (once per battle).
3. Counter Step: the defender may trash Character cards from hand to add their Counter value to the power of their Leader or a Character for this battle, and/or play [Counter] Events (paying cost).
4. Damage Step: if attacker power >= target power, the attacker wins. Defending Leader: 1 damage (if it had 0 Life, the attacker wins the game). Defending Character: it is K.O.'d (trashed). Otherwise nothing happens.
- Damage: top Life card goes to the hand. If it has [Trigger] the player may reveal it and activate it instead of adding it to the hand, then the card is trashed.

### Keywords
- [Rush]: can attack the turn it is played. [Rush: Character]: can attack only Characters that turn.
- [Double Attack]: deals 2 damage instead of 1 to a Leader.
- [Banish]: the damaged Life card is trashed instead of going to the hand (no [Trigger]).
- [Blocker]: rest it during the Block Step to become the attack's target.
- [Unblockable]: cannot be blocked.
- [Trigger]: effect usable when this card is revealed from Life as damage.
- [On Play]: when played. [When Attacking]: when this card declares an attack. [On Block]: when it blocks. [On K.O.]: when it is K.O.'d.
- [Activate: Main] / [Main]: usable by the turn player in their Main Phase. [Counter]: Event usable in the Counter Step.
- [End of Your Turn] / [End of Your Opponent's Turn]: trigger in the End Phase.
- [DON!! xX]: condition, needs at least X DON!! given to this card. DON!! -X: return X DON!! to the DON!! deck as a cost.
- [Your Turn] / [Opponent's Turn]: condition on whose turn it is. [Once Per Turn]: usable once each turn.
- K.O.: a Character trashed by battle or by an effect that says K.O. Trashing for other reasons is not a K.O.

### Effects
- "Up to X": the player may choose 0 to X. "can"/"may": optional; otherwise mandatory as far as possible.
- Cost before the colon ":" is paid first; if it cannot be paid, the effect does not happen. A circled number = rest that many active DON!!.
- Power can go below 0 without the card being trashed. Cost and other numbers never go below 0.
