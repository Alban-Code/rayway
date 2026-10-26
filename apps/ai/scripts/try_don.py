import re
import sys
from collections import defaultdict
from pathlib import Path

DON_PHASE = re.compile(r"^\[(?P<player>[^\]]+)\] Draw (?P<count>\d+) Don$")


def count_don_phase(path: Path) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    with path.open(encoding="utf-8") as file:
        for line in file:
            m = DON_PHASE.match(line.rstrip("\n"))
            if m is not None:
                totals[m["player"]] += int(m["count"])
    # TODO 2: ouvre le fichier en texte UTF-8 (path.open(encoding="utf-8")),
    #   parcours-le ligne par ligne, applique DON_PHASE.match(line.rstrip("\n")),
    #   et si ça matche, ajoute int(m["count"]) au total de m["player"].
    return totals


if __name__ == "__main__":
    # sys.argv[0] est le nom du script, sys.argv[1] le premier argument (le fichier)
    result = count_don_phase(Path(sys.argv[1]))
    for player, n in result.items():
        print(player, n)