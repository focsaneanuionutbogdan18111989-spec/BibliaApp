# -*- coding: utf-8 -*-
import json

data = json.load(open("BibliaApp/tools/plan_parsed.json", encoding="utf-8"))
# normalizează liniuţele en/em dash la un singur tip pentru afişare consistentă
# (le lăsăm aşa cum sunt; parserul JS le tratează)

js = "// Generat automat din biblia-365-zile.pdf. Nu edita manual.\n"
js += "const PLAN = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"

open("BibliaApp/plan.js", "w", encoding="utf-8").write(js)
print("plan.js scris:", len(data), "zile")