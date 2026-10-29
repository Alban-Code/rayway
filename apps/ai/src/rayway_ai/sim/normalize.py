import re

# The SIM writes card links in two different ways depending on the log:
#   <mark><link="OP15-058">OP15-058</link></mark>   (most logs)
#   "OP05-060">OP05-060                             (a few logs)
# normalize_line() rewrites both to a plain `[OP15-058]` so the regexes below only
# have to deal with ONE format.
_MARK_LINK = re.compile(r'<mark><link="[^"]*">([^<]*)</link></mark>')
_OLD_LINK = re.compile(r'\["[^"]*">([^\]]*)\]')

# Player tags contain an invisible zero-width space before the "#".
_ZERO_WIDTH = "​"


def normalize_line(raw: str) -> str:
    line = raw.rstrip("\r\n").replace(_ZERO_WIDTH, "")
    line = _MARK_LINK.sub(r"\1", line)
    line = _OLD_LINK.sub(r"[\1]", line)
    return line.replace("<b>", "").replace("</b>", "")
