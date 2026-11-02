# -*- coding: utf-8 -*-
"""Verifică (în Python, oglindind logica JS) că fiecare referinţă VT/NT din
plan are o carte cunoscută în books.js şi că extragerea capitolelor e corectă."""
import json, re

# --- încarcă cheile BOOKS din books.js ---
bjs = open("BibliaApp/books.js", encoding="utf-8").read()
keys = re.findall(r'"([^"]+)":\s*\{', bjs)
BOOK_KEYS = [k for k in keys]  # abrevierile

plan = json.load(open("BibliaApp/tools/plan_parsed.json", encoding="utf-8"))


def norm(s):
    s = (s or "")
    for d in "\u2012\u2013\u2014\u2015":
        s = s.replace(d, "-")
    return re.sub(r"\s+", " ", s).strip()


def fold(s):
    return (s or "").translate(str.maketrans({
        "\u0219": "s", "\u015F": "s", "\u021B": "t", "\u0163": "t",
        "\u0218": "S", "\u015E": "S", "\u021A": "T", "\u0162": "T",
    }))


def split_book(ref):
    ref = norm(ref)
    refF = fold(ref)
    for k in sorted(BOOK_KEYS, key=len, reverse=True):
        kF = fold(k)
        if refF == kF:
            return k, ""
        if refF.startswith(kF + " "):
            return k, ref[len(k):].strip()
        if refF.startswith(kF) and len(refF) > len(kF) and refF[len(kF)].isdigit():
            return k, ref[len(k):].strip()
    return None, ref


def chapters_from_rest(rest):
    rest = norm(rest)
    if not rest:
        return []
    out = []
    def add(a, b):
        for i in range(a, b + 1):
            if i not in out:
                out.append(i)
    for blk in [b.strip() for b in re.split(r"[;,]", rest) if b.strip()]:
        if "-" in blk:
            left, _, right = blk.partition("-")
            try:
                lc = int(left.split(":")[0])
            except:
                continue
            left_has_verse = ":" in left
            right_has_verse = ":" in right if right.strip() else False
            if not right.strip():
                rc = lc
            elif left_has_verse and not right_has_verse:
                rc = lc  # "18:1-27" => acelaşi capitol
            else:
                try:
                    rc = int(right.split(":")[0])
                except:
                    rc = lc
            add(min(lc, rc), max(lc, rc))
        else:
            try:
                c = int(blk.split(":")[0])
                add(c, c)
            except:
                pass
    return out


def interpret_vtnt(passage):
    passage = norm(passage)
    parts = []
    for chunk in re.split(r"\s+(?:și|si)\s+", passage):
        chunk = chunk.strip()
        m = re.match(r"^(.+?)\s*-\s*([A-Za-zĂÂÎŞŢăâîşţ].*)$", chunk)
        if m and split_book(m.group(1))[0] and split_book(m.group(2))[0]:
            for g in (m.group(1), m.group(2)):
                a, rest = split_book(g)
                parts.append((a, chapters_from_rest(rest)))
            continue
        a, rest = split_book(chunk)
        parts.append((a, chapters_from_rest(rest)))
    return parts


missing = {}
sample = []
for d in plan:
    for col in ("vt", "nt"):
        for abbr, chaps in interpret_vtnt(d[col]):
            if abbr is None:
                missing.setdefault(d[col], []).append(d["day"])
    if d["day"] in (1, 2, 3, 160, 190, 358, 365):
        sample.append((d["day"], d["vt"], interpret_vtnt(d["vt"]), d["nt"], interpret_vtnt(d["nt"])))

with open("BibliaApp/tools/verify_result.txt", "w", encoding="utf-8") as f:
    f.write("BOOK_KEYS count: %d\n" % len(BOOK_KEYS))
    f.write("Referinţe VT/NT nerecunoscute: %d\n" % len(missing))
    for k, days in missing.items():
        f.write("  '%s' în zilele %s\n" % (k, days[:8]))
    f.write("\nMostre:\n")
    for s in sample:
        f.write(repr(s) + "\n")

print("VT/NT nerecunoscute:", len(missing))
print("Vezi BibliaApp/tools/verify_result.txt")