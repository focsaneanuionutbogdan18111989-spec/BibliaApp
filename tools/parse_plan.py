# -*- coding: utf-8 -*-
"""
Parsează planul de citire (biblia-365-zile.pdf) și produce plan.js
Fiecare zi are 4 pasaje: VT, Psalmi, Proverbe (Pilde), NT.

Structura unei linii-zi în PDF (după extragere) arată astfel:
  1.  ☐ Fc (Facere, Geneză) 1–3  ☐ 1; 2  ☐ 1:1–6  ☐ Mt (Evanghelia după Matei) 1

Cele patru câmpuri sunt separate prin caracterul ☐ (U+2610).
Primul token după ☐ este referinţa; textul între paranteze e denumirea completă (o ignorăm).
"""
import re
import json
from pypdf import PdfReader

PDF = r"D:\Utile\Personal\biblia-365-zile.pdf"
BOX = "\u2610"  # ☐


def clean(txt):
    # elimină denumirile complete dintre paranteze: "Fc (Facere, Geneză) 1–3" -> "Fc 1–3"
    txt = re.sub(r"\([^)]*\)", "", txt)
    txt = txt.replace("\xa0", " ")
    txt = re.sub(r"\s+", " ", txt).strip()
    # normalizează liniuţe: – — - toate la "-"
    return txt


def extract_days_from_text(full_text):
    # Uneşte toate liniile într-un singur flux, apoi împarte pe zile.
    # O zi începe cu "<număr>." la început de linie.
    lines = full_text.splitlines()
    days = {}
    current = None
    buffer = []

    def flush():
        if current is None:
            return
        joined = " ".join(buffer)
        days[current] = joined

    # o zi începe cu "N." la început de linie; NU cerem spaţiu după punct,
    # pentru că uneori "253.☐" e lipit.
    day_start = re.compile(r"^\s*(\d{1,3})\.(?!\d)")
    for ln in lines:
        m = day_start.match(ln)
        if m:
            flush()
            current = int(m.group(1))
            # tot ce e după "N." pe aceeaşi linie
            buffer = [ln[m.end():]]
        else:
            if current is not None:
                # ignoră headerele/paginile
                if ("Ziua" in ln and "Testament" in ln) or ln.strip().isdigit():
                    continue
                if "Sursa de inspir" in ln or ln.strip().startswith("v."):
                    continue
                buffer.append(ln)
    flush()
    return days


def parse_passages(day_text):
    # împarte după ☐, primele 4 segmente non-goale = cele 4 pasaje
    parts = [clean(p) for p in day_text.split(BOX)]
    parts = [p for p in parts if p]
    # uneori denumirea completă rupe segmentarea; luăm exact primele 4
    return parts[:4]


def main():
    r = PdfReader(PDF)
    texts = []
    for pg in r.pages:
        texts.append(pg.extract_text() or "")
    full = "\n".join(texts)

    days = extract_days_from_text(full)
    plan = []
    problems = []
    for n in range(1, 366):
        raw = days.get(n)
        if not raw:
            problems.append((n, "LIPSĂ"))
            plan.append({"day": n, "vt": "", "ps": "", "pr": "", "nt": ""})
            continue
        p = parse_passages(raw)
        while len(p) < 4:
            p.append("")
        if len([x for x in p if x]) < 4:
            problems.append((n, p))
        plan.append({"day": n, "vt": p[0], "ps": p[1], "pr": p[2], "nt": p[3]})

    with open("BibliaApp/tools/plan_parsed.json", "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)

    with open("BibliaApp/tools/plan_problems.txt", "w", encoding="utf-8") as f:
        for pr in problems:
            f.write(repr(pr) + "\n")
    print("Zile extrase:", len([d for d in plan if d['vt']]))
    print("Probleme:", len(problems), "(vezi plan_problems.txt)")


if __name__ == "__main__":
    main()