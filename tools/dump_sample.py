import sys
from pypdf import PdfReader

PDF = r"D:\Utile\Personal\biblia ortodoxă sau sfânta scriptură.pdf"
r = PdfReader(PDF)

pages = [int(x) for x in sys.argv[1:]] or [60, 61, 62]
with open("BibliaApp/tools/sample.txt", "w", encoding="utf-8") as f:
    for p in pages:
        f.write(f"\n\n==== PAGE {p} ====\n")
        f.write(r.pages[p].extract_text())
print("done", pages)