import re

h = open(r"BibliaApp/tools/dox_index.html", encoding="utf-8", errors="replace").read()
out = []
t = re.search(r"<title>(.*?)</title>", h, re.S)
out.append("TITLE: " + (t.group(1).strip() if t else "None"))
out.append("LEN: %d" % len(h))
out.append("HAS <select>: %s" % ("<select" in h))
out.append("HAS 'carte': %s" % ("carte" in h.lower()))
out.append("HAS 'capitol': %s" % ("capitol" in h.lower()))
out.append("HAS 'Facere'/'Geneza': %s / %s" % ("Facere" in h, "Genez" in h))
out.append("\n=== hrefs (first 120 unique) ===")
for l in list(dict.fromkeys(re.findall(r'href="([^"]+)"', h)))[:120]:
    out.append(l)
out.append("\n=== option values (first 120) ===")
for v in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', h)[:120]:
    out.append(repr(v))

open(r"BibliaApp/tools/dox_analysis.txt", "w", encoding="utf-8").write("\n".join(out))
print("written", len(out), "lines")