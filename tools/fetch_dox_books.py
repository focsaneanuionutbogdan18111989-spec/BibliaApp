import urllib.request, ssl, re, time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

URLS = [
    "https://doxologia.ro/biblia-ortodoxa",
    "https://doxologia.ro/biblia/vechiul-testament",
    "https://doxologia.ro/biblia/noul-testament",
]

all_links = []
for u in URLS:
    for attempt in range(6):
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            d = urllib.request.urlopen(req, context=ctx, timeout=40).read().decode("utf-8", "replace")
        except Exception as e:
            d = ""
        links = [l for l in re.findall(r'href="([^"]+)"', d)
                 if "doxologia.ro/" in l and ("capitol" in l or "psalm" in l)]
        if links:
            all_links.extend(links)
            print(u, "->", len(links), "links (attempt", attempt + 1, ")")
            break
        print(u, "attempt", attempt + 1, "no links, retrying...")
        time.sleep(2)
    else:
        print(u, "FAILED after retries")

uniq = list(dict.fromkeys(all_links))
open(r"BibliaApp/tools/dox_books.txt", "w", encoding="utf-8").write("\n".join(uniq))
print("TOTAL unique book links:", len(uniq))