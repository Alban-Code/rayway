"""One compiled regex per decoded log line. Input is a line already passed through normalize_line()."""
import re

DON_PHASE = re.compile(r"^\[(?P<player>[^\]]+)\] Draw (?P<count>\d+) Don$")
DON_GAIN_EFFECT = re.compile(r"^(?!\[)(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Draw (?P<count>\d+) (?P<rested>Rested )?Don$")
DON_MINUS = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Minus (?P<count>\d+) Don$")
LEADER_IS = re.compile(r"^\[(?P<player>[^\]]+)\] Leader is (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]$")
CHOSE_ORDER = re.compile(r"^\[(?P<player>[^\]]+)\] Chose to go (?P<order>First|Second)$")
END_TURN = re.compile(r"^\[(?P<player>[^\]]+)\] End Turn$")
DRAW = re.compile(r"^\[(?P<player>[^\]]+)\] (?:(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: )?Draw (?P<count>\d+) Card$")
DEPLOY = re.compile(
    r"^\[(?P<player>[^\]]+)\] "
    r"(?:(?P<source>.+?) \[(?P<source_code>[A-Z0-9-]+)\]: )?"
    r"Deploy(?:ed)? (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]"
    r"(?P<from_trash> from Trash)?$"
)
ATTACK_DECLARED = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<attacker_name>.+?) \[(?P<attacker_code>[A-Z0-9-]+)\] attacking (?P<target_name>.+?) \[(?P<target_code>[A-Z0-9-]+)\]$")
BLOCK = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] Blocks$")
COUNTER_DISCARD = re.compile(r"^\[(?P<player>[^\]]+)\] Discard (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] for Counter (?P<value>\d+)$")
ATTACK_CLASH = re.compile(r"^(?P<attacker_name>.+?) \[(?P<attacker_code>[A-Z0-9-]+)\]\[(?P<attacker_power>-?\d+)\] vs (?P<target_name>.+?) \[(?P<target_code>[A-Z0-9-]+)\]\[(?P<target_power>-?\d+)\]$")
ATTACK_FAILS = re.compile(r"^Attack Fails$")
LEADER_HIT = re.compile(r"^(?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] hit for (?P<damage>\d+) damage$")
DAMAGE_DEALT = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\]: Deals (?P<amount>\d+) damage$")
DESTROYED = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>[A-Z0-9-]+)\] Destroyed$")
CONCEDE = re.compile(r"^\[(?P<player>[^\]]+)\] Concedes!$")
GAME_OVER = re.compile(r"^GameOver$")
_C = r"[A-Z0-9-]+"
LIFE_COUNT = re.compile(r"^\[(?P<player>[^\]]+)\] Life: (?P<count>\d+)$")
ZONE_SNAPSHOT = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<zone>Hand|Board|Trash): \[(?P<codes>[^\]]*)\]$")
LIFE_ADD = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>{_C})\]: Add(?:ed)? card to (?P<pos>top|bottom) of Life from (?P<zone>\w+)$")
TRIGGER = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>{_C})\]: Activate Trigger$")
ATTACH_MANUAL = re.compile(rf"^\[(?P<player>[^\]]+)\] Attach (?P<count>\d+) Don to (?P<name>.+?) \[(?P<code>{_C})\] \((?P<total>\d+) Total\)$")
ATTACH_EFFECT = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<src_code>{_C})\]: Attach (?P<count>\d+) (?P<rested>Rested )?Don to (?P<target>.+?) \[(?P<code>{_C})\]$")
DREW = re.compile(rf"^\[(?P<player>[^\]]+)\] Drew card from deck: (?P<name>.+?) \[(?P<code>{_C})\]$")
MULLIGAN = re.compile(r"^\[(?P<player>[^\]]+)\] Mulligan$")
HAND_BEFORE_MULLIGAN = re.compile(r"^\[(?P<player>[^\]]+)\] Hand before Mulligan: \[(?P<codes>[^\]]*)\]$")
REVEAL_DRAW = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<src_code>{_C})\]: Reveal and Draw (?P<card_name>.+?) \[(?P<code>{_C})\]$")
REST_DON = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>{_C})\]: Rest (?P<count>\d+) Don$")
ACTIVATE_DON = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>{_C})\]: Activate (?P<count>\d+) Don$")
ACTIVATE_COUNTER = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<code>{_C})\]: Activate Counter$")
BUFF = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<src_code>{_C})\]: Buff (?P<target>.+?) \[(?P<code>{_C})\] (?P<amount>-?\d+) for the Combat$")
# "Trash X" nu, ou "SRC: Trash X", avec " from Life" optionnel          (500 lignes)
TRASH_CARD = re.compile(
    rf"^\[(?P<player>[^\]]+)\] "
    rf"(?:(?P<source>.+?) \[(?P<source_code>{_C})\]: )?"
    rf"Trash (?P<name>.+?) \[(?P<code>{_C})\]"
    rf"(?: from (?P<zone>\w+))?$"
)

# "SRC: X to Trash from Hand"                                             (40 lignes)
CARD_TO_TRASH = re.compile(
    rf"^\[(?P<player>[^\]]+)\] "
    rf"(?:(?P<source>.+?) \[(?P<source_code>{_C})\]: )?"
    rf"(?P<name>.+?) \[(?P<code>{_C})\] to Trash"
    rf"(?: from (?P<zone>\w+))?$"
)

# CardsTrashed : "SRC: Trash N Remaining Cards" ou "SRC: Trash N Cards from Deck"   (51 lignes)
CARDS_TRASHED = re.compile(
    rf"^\[(?P<player>[^\]]+)\] (?P<source>.+?) \[(?P<source_code>{_C})\]: "
    rf"Trash (?P<count>\d+) (?:Remaining Cards|Cards from (?P<zone>\w+))$"
)

# Families B and D. A target can be a DON!! card, written "[Don]".
_T = rf"(?:{_C}|Don)"
SET_ACTIVE = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Set (?P<target>.+?) \[(?P<code>{_T})\] to Active$")
CARD_RESTED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Rest (?P<target>.+?) \[(?P<code>{_T})\]$")
REFRESH_SKIPPED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: (?P<target>.+?) \[(?P<code>{_T})\] will not Activate during next Refresh$")
LIFE_FLIPPED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Flip (?P<count>\d+) Life Face Up$")
TOP_DECK_LOOKED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: (?:Looked at|(?P<finished>Finished looking at)) opponent's top deck$")
CARD_REVEALED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\] revealed: (?P<card_name>.+?) \[(?P<code>{_C})\]$")
NO_CARD_PICKED = re.compile(r"^\[(?P<player>[^\]]+)\] Picked no cards to Draw$")

# Zones and Life
CARDS_ADDED_TO_HAND = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Added (?P<count>\d+) Cards to Hand$")
TAKEN_FROM_TRASH = re.compile(rf"^\[(?P<player>[^\]]+)\] Draw (?P<name>.+?) \[(?P<code>{_C})\] from Trash$")
RETURN_TO_HAND = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Return (?P<card_name>.+?) \[(?P<code>{_C})\] to Hand$")
SENT_TO_DECK_BOTTOM = re.compile(
    rf"^\[(?P<player>[^\]]+)\] (?:(?P<name>.+?) \[(?P<source_code>{_C})\]: )?"
    rf"Sen[dt] (?:a Card|(?P<card_name>.+?) \[(?P<code>{_C})\]) to Deck Bottom(?: from (?P<zone>\w+))?$"
)
CARDS_PLACED_ON_DECK = re.compile(r"^\[(?P<player>[^\]]+)\] Placing Cards on (?P<where>Top|Bottom) of Deck$")
LIFE_ADD_CARD = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Add (?P<card_name>.+?) \[(?P<code>{_C})\] to (?P<pos>top|bottom) of Life$")
LIFE_TAKEN = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Takes (?P<pos>Top|Bottom) Life$")
LIFE_TO_HAND = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<name>.+?) \[(?P<source_code>{_C})\]: Send (?P<count>\d+) Life to Hand$")
LIFE_LOST = re.compile(r"^\[(?P<player>[^\]]+)\] (?P<how>Banished|Loses) (?P<count>\d+) Life$")
HAND_AFTER_MULLIGAN = re.compile(r"^\[(?P<player>[^\]]+)\] Hand after Mulligan: \[(?P<codes>[^\]]*)\]$")

# Family C. Optional "SOURCE [C]: " prefix, then the effect.
_SRC = rf"\[(?P<player>[^\]]+)\] (?:(?P<src_name>.+?) \[(?P<source_code>{_C})\]: )?"
DESTROY_EFFECT = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Destroy (?P<name>.+?) \[(?P<code>{_C})\]$")
BUFF_POWER = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Buff (?:(?P<self>Self)|(?P<name>.+?) \[(?P<code>{_C})\]) (?P<amount>-?\d+)$")
GRANT_POWER = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Grant (?P<name>.+?) \[(?P<code>{_C})\] (?P<amount>-?\d+) until (?P<duration>.+)$")
GRANT_KEYWORD = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Grant (?P<detail>\w+) to (?P<name>.+?) \[(?P<code>{_C})\]$")
BASE_POWER = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Set (?P<name>.+?) \[(?P<code>{_C})\] Base Power to (?P<amount>-?\d+)$")
COST_MODIFIED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: (?P<name>.+?) \[(?P<code>{_C})\] Cost (?P<amount>-?\d+)(?: until (?P<duration>.+))?$")
GIVE_KEYWORD = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Give (?P<name>.+?) \[(?P<code>{_C})\] (?P<detail>(?:Character )?Rush)$")
GAINS_KEYWORD = re.compile(rf"^{_SRC}(?P<name>.+?) \[(?P<code>{_C})\] Gains (?P<detail>.+)$")
RESTRICTION = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: (?P<name>.+?) \[(?P<code>{_C})\] (?P<detail>can't .+)$")
RESTRICTION_PLAYER = re.compile(rf"^{_SRC}(?P<detail>(?:Opponent can't|Can't [Pp]lay) .+)$")
NULLIFY = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Nullify effects of (?P<name>.+?) \[(?P<code>{_C})\](?: until (?P<duration>.+?)!?)?$")
RESTRICTION_LIFTED = re.compile(rf"^(?:\[(?P<player>[^\]]+)\] )?(?P<name>.+?) \[(?P<code>{_C})\] (?P<detail>is no longer blocked from attacking|no longer nullified|cost restored)$")

TARGET_CHANGED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Target of Attack changed to (?P<name>.+?) \[(?P<code>{_C})\]$")
CARD_ACTIVATED = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: Activates (?P<name>.+?) \[(?P<code>{_C})\]$")
PREVENT_EFFECT = re.compile(rf"^\[(?P<player>[^\]]+)\] (?P<src_name>.+?) \[(?P<source_code>{_C})\]: (?P<detail>Prevent Effect) To (?P<name>.+?) \[(?P<code>{_C})\]$")

