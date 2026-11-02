/* =========================================================================
 * Logica aplicaţiei „Biblia într-un an”
 * - parsează referinţele din PLAN (plan.js)
 * - construieşte linkuri către paginile oficiale Doxologia (books.js)
 * - randează cele 365 de zile cu bife „Văzut” salvate în localStorage
 * ========================================================================= */

const STORAGE_KEY = "biblia_an_progres_v1";
const SEED_FLAG_KEY = "biblia_seed_179_done";

/* ---------- Persistenţă ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
let progress = loadProgress();

/* ---------- Seed one-shot: bifează toate zilele 1..N la prima rulare ---------- */
function seedProgressUpToDay(n) {
  if (localStorage.getItem(SEED_FLAG_KEY)) return;
  for (let d = 1; d <= n; d++) {
    progress[d] = { vt: true, ps: true, pr: true, nt: true };
  }
  saveProgress(progress);
  localStorage.setItem(SEED_FLAG_KEY, "1");
}
seedProgressUpToDay(179);

function isChecked(day, col) { return !!(progress[day] && progress[day][col]); }
function setChecked(day, col, val) {
  if (!progress[day]) progress[day] = {};
  progress[day][col] = val;
  if (!val) delete progress[day][col];
  if (Object.keys(progress[day]).length === 0) delete progress[day];
  saveProgress(progress);
}

/* ---------- Normalizare text referinţă ---------- */
function normalizeDashes(s) {
  return (s || "").replace(/[\u2012\u2013\u2014\u2015]/g, "-").replace(/\s+/g, " ").trim();
}
/* normalizează diacriticele ș/ş şi ț/ţ (comma-below vs cedilă) pentru potrivire */
function foldDia(s) {
  return (s || "")
    .replace(/[\u0219\u015F]/g, "s")   // ș / ş -> s
    .replace(/[\u021B\u0163]/g, "t")   // ț / ţ -> t
    .replace(/[\u0218\u015E]/g, "S")
    .replace(/[\u021A\u0162]/g, "T");
}

/* Recunoaşte o abreviere de carte la începutul referinţei.
 * Ex: "Fc 4-7" -> {abbr:"Fc", rest:"4-7"}
 *     "1Co 10:14-11:1" -> {abbr:"1Co", rest:"10:14-11:1"}
 *     "3 Ezr 1:1-2:11" -> {abbr:"3 Ezr", rest:"1:1-2:11"}
 */
function splitBook(ref) {
  ref = normalizeDashes(ref);
  const refF = foldDia(ref);
  // încearcă potrivire cu cheile din BOOKS (cele mai lungi întâi),
  // comparând fără diacritice-variante (ș/ş, ț/ţ)
  const keys = Object.keys(BOOKS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const kF = foldDia(k);
    if (refF === kF) return { abbr: k, rest: "" };
    if (refF.startsWith(kF + " ")) return { abbr: k, rest: ref.slice(k.length).trim() };
    // fără spaţiu (ex. "Ap22")
    if (refF.startsWith(kF) && /[0-9]/.test(refF.charAt(kF.length))) {
      return { abbr: k, rest: ref.slice(k.length).trim() };
    }
  }
  return { abbr: null, rest: ref };
}

/* Din "rest" scoate lista de capitole implicate.
 * Acceptă:
 *   "4-7"           -> [4,5,6,7]
 *   "16-18"         -> [16,17,18]
 *   "1; 2"          -> [1,2]
 *   "33; 34"        -> [33,34]
 *   "8:1-11:9"      -> [8,9,10,11]
 *   "24:50-26:35"   -> [24,25,26]
 *   "1:1-6"         -> [1]           (un singur capitol, versete parţiale)
 *   "5"             -> [5]
 *   "1:1-2:11"      -> [1,2]
 */
function chaptersFromRest(rest) {
  rest = normalizeDashes(rest);
  if (!rest) return { chapters: [], verses: "" };

  // separă mai multe blocuri despărţite prin ; sau ,
  const blocks = rest.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  const chaptersSet = [];
  let verseNote = rest; // pentru afişare

  const addRange = (a, b) => {
    for (let i = a; i <= b; i++) if (!chaptersSet.includes(i)) chaptersSet.push(i);
  };

  for (const blk of blocks) {
    // interval cu "-"
    if (blk.includes("-")) {
      const [left, right] = blk.split("-").map(s => s.trim());
      const lc = parseInt(left.split(":")[0], 10);
      const leftHasVerse = left.includes(":");
      const rightHasVerse = right ? right.includes(":") : false;
      let rc;
      if (!right) {
        rc = lc;
      } else if (leftHasVerse && !rightHasVerse) {
        // "18:1-27" => acelaşi capitol (versete 1-27), nu interval de capitole
        rc = lc;
      } else {
        rc = parseInt(right.split(":")[0], 10);
      }
      if (!isNaN(lc) && !isNaN(rc)) addRange(Math.min(lc, rc), Math.max(lc, rc));
      else if (!isNaN(lc)) addRange(lc, lc);
    } else {
      // fără interval: fie "5", fie "1:7" (un singur capitol)
      const c = parseInt(blk.split(":")[0], 10);
      if (!isNaN(c)) addRange(c, c);
    }
  }
  return { chapters: chaptersSet, verses: verseNote };
}

/* Interpretează un pasaj în funcţie de coloană.
 * col: "vt" | "ps" | "pr" | "nt"
 * Pentru "ps" cartea e implicit Ps; pentru "pr" implicit Pilde.
 */
function interpret(passage, col) {
  passage = normalizeDashes(passage);
  if (!passage) return null;

  // Cazuri compuse rare (ex. "2Par 33; 34 și Man", "Sus 1-Dn 1:21")
  // Le tratăm afişându-le ca atare + linkuri pentru fiecare carte găsită.
  if (col === "ps") {
    const { chapters } = chaptersFromRest(passage);
    return { parts: [{ abbr: "Ps", chapters, ref: "Ps " + passage }], raw: passage };
  }
  if (col === "pr") {
    const { chapters } = chaptersFromRest(passage);
    return { parts: [{ abbr: "Pilde", chapters, ref: "Pilde " + passage }], raw: passage };
  }

  // VT / NT: pot conţine "X şi Y" sau "A-B" între cărţi
  // împărţim după " și " / " si " păstrând fiecare bucată
  const chunks = passage.split(/\s+(?:și|si)\s+/i);
  const parts = [];
  for (let chunk of chunks) {
    chunk = chunk.trim();
    // caz special "Sus 1-Dn 1:21": conţine două cărţi separate prin -
    const twoBook = chunk.match(/^(.+?)\s*-\s*([A-Za-zĂÂÎŞŢăâîşţ].*)$/);
    if (twoBook && splitBook(twoBook[1]).abbr && splitBook(twoBook[2]).abbr) {
      const b1 = splitBook(twoBook[1]);
      const b2 = splitBook(twoBook[2]);
      const c1 = chaptersFromRest(b1.rest);
      const c2 = chaptersFromRest(b2.rest);
      parts.push({ abbr: b1.abbr, chapters: c1.chapters.length ? c1.chapters : [1], ref: chunk });
      parts.push({ abbr: b2.abbr, chapters: c2.chapters.length ? c2.chapters : [1], ref: "" });
      continue;
    }
    const sb = splitBook(chunk);
    if (sb.abbr) {
      const c = chaptersFromRest(sb.rest);
      parts.push({ abbr: sb.abbr, chapters: c.chapters, ref: chunk });
    } else {
      parts.push({ abbr: null, chapters: [], ref: chunk });
    }
  }
  return { parts, raw: passage };
}

/* ---------- Randare ---------- */
const COLS = [
  { key: "vt", label: "Vechiul Testament", cls: "vt" },
  { key: "ps", label: "Psalmi", cls: "ps" },
  { key: "pr", label: "Proverbe (Pilde)", cls: "pr" },
  { key: "nt", label: "Noul Testament", cls: "nt" },
];

function dayIsComplete(day) {
  return COLS.every(c => isChecked(day, c.key));
}

function updateStats() {
  let doneDays = 0, donePassages = 0;
  const total = PLAN.length;
  for (const d of PLAN) {
    let dp = 0;
    for (const c of COLS) if (isChecked(d.day, c.key)) { donePassages++; dp++; }
    if (dp === 4) doneDays++;
  }
  const pct = Math.round((doneDays / total) * 100);
  document.getElementById("statDays").textContent = doneDays + " / " + total;
  document.getElementById("statPassages").textContent = donePassages + " / " + (total * 4);
  document.getElementById("statPct").textContent = pct + "%";
  document.getElementById("progressBar").style.width = pct + "%";
}

function makePassageEl(day, col) {
  const passage = day[col.key];
  const wrap = document.createElement("div");
  wrap.className = "passage " + col.cls + (isChecked(day.day, col.key) ? " checked" : "");

  const info = interpret(passage, col.key);

  const head = document.createElement("div");
  head.className = "passage-head";

  // toggle stil iOS: checkbox ascuns + comutator vizual
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "vazut";
  cb.checked = isChecked(day.day, col.key);

  const sw = document.createElement("span");
  sw.className = "switch";
  sw.setAttribute("role", "switch");
  sw.setAttribute("aria-label", "Bifează „Văzut”");
  sw.tabIndex = 0;

  const toggle = () => {
    cb.checked = !cb.checked;
    setChecked(day.day, col.key, cb.checked);
    wrap.classList.toggle("checked", cb.checked);
    card.classList.toggle("day-complete", dayIsComplete(day.day));
    updateStats();
  };
  sw.addEventListener("click", toggle);
  sw.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });

  const label = document.createElement("div");
  label.className = "passage-label";
  label.innerHTML = "<span class='col-tag'>" + col.label + "</span><span class='ref'>" +
    escapeHtml(displayRef(passage, col.key)) + "</span>";

  head.appendChild(cb);
  head.appendChild(sw);
  head.appendChild(label);

  const openBtn = document.createElement("button");
  openBtn.className = "open-btn";
  openBtn.textContent = "Deschide";
  openBtn.addEventListener("click", () => openReader(day, col, info));
  head.appendChild(openBtn);

  wrap.appendChild(head);

  var card = null; // setat în makeDayCard (referinţă înapoi)
  wrap._setCard = (c) => { card = c; };
  return wrap;
}

function displayRef(passage, col) {
  if (col === "ps") return "Ps " + passage;
  if (col === "pr") return "Pilde " + passage;
  return passage;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function makeDayCard(day) {
  const card = document.createElement("div");
  card.className = "day-card" + (dayIsComplete(day.day) ? " day-complete" : "");
  card.dataset.day = day.day;

  const header = document.createElement("div");
  header.className = "day-header";
  header.innerHTML = "<span class='day-num'>Ziua " + day.day + "</span>";
  const badge = document.createElement("span");
  badge.className = "day-badge";
  badge.textContent = "✓ zi completă";
  header.appendChild(badge);
  card.appendChild(header);

  for (const col of COLS) {
    const pel = makePassageEl(day, col);
    pel._setCard(card);
    card.appendChild(pel);
  }
  return card;
}

/* ---------- Cititorul (panou lateral) ---------- */
const reader = () => document.getElementById("reader");
const readerBody = () => document.getElementById("readerBody");
const readerTitle = () => document.getElementById("readerTitle");

function openReader(day, col, info) {
  readerTitle().textContent = "Ziua " + day.day + " · " + col.label;
  const body = readerBody();
  body.innerHTML = "";

  const refLine = document.createElement("p");
  refLine.className = "reader-ref";
  refLine.textContent = displayRef(day[col.key], col.key);
  body.appendChild(refLine);

  if (!info || !info.parts.length) {
    body.appendChild(document.createTextNode("Referinţă nerecunoscută."));
    showReader();
    return;
  }

  for (const part of info.parts) {
    const section = document.createElement("div");
    section.className = "reader-book";

    const h = document.createElement("h4");
    h.textContent = bookName(part.abbr) + (part.ref ? "  (" + part.ref + ")" : "");
    section.appendChild(h);

    if (!part.abbr) {
      const p = document.createElement("p");
      p.textContent = "Nu am putut identifica automat cartea. Caută pe Doxologia:";
      section.appendChild(p);
      const a = document.createElement("a");
      a.href = DOX_BASE + "cauta?query=" + encodeURIComponent(part.ref);
      a.target = "_blank"; a.rel = "noopener";
      a.className = "chapter-link"; a.textContent = "Caută „" + part.ref + "”";
      section.appendChild(a);
      body.appendChild(section);
      continue;
    }

    const chapters = part.chapters.length ? part.chapters : [1];
    const list = document.createElement("div");
    list.className = "chapter-links";
    for (const ch of chapters) {
      const a = document.createElement("a");
      a.href = chapterUrl(part.abbr, ch);
      a.target = "_blank"; a.rel = "noopener";
      a.className = "chapter-link";
      a.textContent = BOOKS[part.abbr] && BOOKS[part.abbr].isPsalm
        ? "Psalmul " + ch
        : "Capitolul " + ch;
      list.appendChild(a);
    }
    section.appendChild(list);

    // buton „Deschide toate” capitolele din acest pasaj
    if (chapters.length > 1) {
      const allBtn = document.createElement("button");
      allBtn.className = "open-all-btn";
      allBtn.textContent = "Deschide toate capitolele (" + chapters.length + ")";
      allBtn.addEventListener("click", () => {
        chapters.forEach(ch => window.open(chapterUrl(part.abbr, ch), "_blank", "noopener"));
      });
      section.appendChild(allBtn);
    }

    body.appendChild(section);
  }

  // bifă rapidă „Văzut” din cititor
  const done = document.createElement("label");
  done.className = "reader-done";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = isChecked(day.day, col.key);
  cb.addEventListener("change", () => {
    setChecked(day.day, col.key, cb.checked);
    renderList(); // re-randează ca să reflecte bifele
    updateStats();
  });
  done.appendChild(cb);
  done.appendChild(document.createTextNode(" Am citit acest pasaj (Văzut)"));
  body.appendChild(done);

  showReader();
}

function showReader() {
  reader().classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function hideReader() {
  reader().classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------- Listă + filtre ---------- */
let currentFilter = "toate";

function renderList() {
  const container = document.getElementById("days");
  container.innerHTML = "";
  const q = (document.getElementById("search").value || "").trim();
  const qNum = parseInt(q, 10);

  for (const day of PLAN) {
    if (currentFilter === "necitite" && dayIsComplete(day.day)) continue;
    if (currentFilter === "citite" && !dayIsComplete(day.day)) continue;
    if (q) {
      const hay = (day.day + " " + day.vt + " " + day.ps + " " + day.pr + " " + day.nt).toLowerCase();
      if (!hay.includes(q.toLowerCase()) && day.day !== qNum) continue;
    }
    container.appendChild(makeDayCard(day));
  }
  if (!container.children.length) {
    container.innerHTML = "<p class='empty'>Nicio zi nu corespunde filtrului.</p>";
  }
}

/* ---------- Ziua curentă (aprox.) ---------- */
function goToToday() {
  // dacă utilizatorul a setat o dată de început, calculăm; altfel prima zi necitită
  if (currentView !== "days") showView("days");
  let target = 1;
  for (const day of PLAN) { if (!dayIsComplete(day.day)) { target = day.day; break; } }
  currentFilter = "toate";
  setActiveFilter();
  syncTabs();
  document.getElementById("search").value = "";
  renderList();
  const el = document.querySelector('.day-card[data-day="' + target + '"]');
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1500); }
}

function setActiveFilter() {
  document.querySelectorAll(".filter-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === currentFilter);
  });
}

function setFilter(f) {
  currentFilter = f;
  if (currentView !== "days") showView("days");
  setActiveFilter();
  syncTabs();
  renderList();
}

function syncTabs() {
  const map = { toate: "tabAll", necitite: "tabTodo" };
  document.querySelectorAll(".tabbar .tab").forEach(t => t.classList.remove("active"));
  if (currentView === "prayers") {
    const el = document.getElementById("tabPrayers");
    if (el) el.classList.add("active");
    return;
  }
  const id = map[currentFilter];
  if (id) { const el = document.getElementById(id); if (el) el.classList.add("active"); }
}

/* ---------- Comutare vizualizări (zile / rugăciuni) ---------- */
let currentView = "days";
function showView(view) {
  currentView = view;
  const daysEl = document.getElementById("days");
  const prayersEl = document.getElementById("prayers");
  const toolbarEl = document.querySelector(".toolbar");
  if (view === "prayers") {
    if (daysEl) daysEl.style.display = "none";
    if (prayersEl) prayersEl.classList.add("active");
    if (toolbarEl) toolbarEl.style.display = "none";
  } else {
    if (daysEl) daysEl.style.display = "";
    if (prayersEl) prayersEl.classList.remove("active");
    if (toolbarEl) toolbarEl.style.display = "";
  }
  syncTabs();
}

function doReset() {
  if (confirm("Sigur resetezi tot progresul bifat? Această acţiune nu poate fi anulată.")) {
    progress = {}; saveProgress(progress); renderList(); updateStats();
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderList();
  updateStats();

  document.getElementById("search").addEventListener("input", renderList);

  // filtre segmentate (sus)
  document.querySelectorAll(".filter-btn").forEach(b => {
    b.addEventListener("click", () => setFilter(b.dataset.filter));
  });

  // tab bar iOS (jos)
  const tabAll = document.getElementById("tabAll");
  const tabTodo = document.getElementById("tabTodo");
  const tabToday = document.getElementById("tabToday");
  const tabPrayers = document.getElementById("tabPrayers");
  const btnResetHeader = document.getElementById("btnResetHeader");
  if (tabAll) tabAll.addEventListener("click", () => setFilter("toate"));
  if (tabTodo) tabTodo.addEventListener("click", () => setFilter("necitite"));
  if (tabToday) tabToday.addEventListener("click", goToToday);
  if (tabPrayers) tabPrayers.addEventListener("click", () => showView("prayers"));
  if (btnResetHeader) btnResetHeader.addEventListener("click", doReset);

  document.getElementById("closeReader").addEventListener("click", hideReader);
  document.getElementById("overlay").addEventListener("click", hideReader);
  document.addEventListener("keydown", e => { if (e.key === "Escape") hideReader(); });

  setActiveFilter();
  syncTabs();
});
