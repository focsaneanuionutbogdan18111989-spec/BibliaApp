/*
 * Maparea cărților din planul de citire (abrevieri conform PDF) către
 * paginile oficiale Doxologia (https://doxologia.ro).
 *
 * Schema URL:
 *   - Cărți normale: https://doxologia.ro/<slug>-capitolul-N
 *   - Psalmi:        https://doxologia.ro/psalmii-psalmul-N
 *
 * Fragmentele deuterocanonice fără pagină proprie (Man, Tin, Sus, Bel, Epist)
 * primesc un link de căutare Doxologia ca rezervă.
 */

const BOOKS = {
  // ---- Pentateuh ----
  "Fc":   { name: "Facerea (Geneza)",            slug: "facerea-intaia-carte-lui-moise" },
  "Iş":   { name: "Ieşirea (Exod)",              slug: "iesirea-doua-carte-lui-moise" },
  "Is,":  { name: "Ieşirea (Exod)",              slug: "iesirea-doua-carte-lui-moise" }, // toleranță diacritice
  "Lv":   { name: "Leviticul",                   slug: "leviticul-treia-carte-lui-moise" },
  "Nm":   { name: "Numerii",                     slug: "numerii-patra-carte-lui-moise" },
  "Dt":   { name: "Deuteronomul",                slug: "deuteronomul-cincea-carte-lui-moise" },

  // ---- Cărţi istorice ----
  "Ios":  { name: "Iosua Navi",                  slug: "cartea-lui-iosua-navi" },
  "Jd":   { name: "Judecători",                  slug: "cartea-judecatorilor" },
  "Rut":  { name: "Rut",                         slug: "cartea-rut" },
  "1Rg":  { name: "1 Regi",                      slug: "cartea-intai-regilor" },
  "2Rg":  { name: "2 Regi",                      slug: "cartea-doua-regilor" },
  "3Rg":  { name: "3 Regi",                      slug: "cartea-treia-regilor" },
  "4Rg":  { name: "4 Regi",                      slug: "cartea-patra-regilor" },
  "1Par": { name: "1 Paralipomena (1 Cronici)",  slug: "cartea-intai-paralipomena-cartea-intai-cronicilor" },
  "2Par": { name: "2 Paralipomena (2 Cronici)",  slug: "cartea-doua-paralipomena-cartea-doua-cronicilor" },
  "Ezr":  { name: "1 Ezdra",                     slug: "cartea-intai-lui-ezdra" },
  "Ne":   { name: "Neemia (2 Ezdra)",            slug: "cartea-lui-neemia-doua-ezdra" },
  "3 Ezr":{ name: "3 Ezdra",                     slug: "cartea-treia-lui-ezdra" },
  "3Ezr": { name: "3 Ezdra",                     slug: "cartea-treia-lui-ezdra" },
  "Tob":  { name: "Tobit",                       slug: "cartea-lui-tobit" },
  "Idt":  { name: "Iudita",                      slug: "cartea-iuditei" },
  "Est":  { name: "Estera",                      slug: "cartea-esterei" },
  "1Mac": { name: "1 Macabei",                   slug: "cartea-intai-macabeilor" },
  "1MFA": { name: "1 Macabei",                   slug: "cartea-intai-macabeilor" },
  "2Mac": { name: "2 Macabei",                   slug: "cartea-doua-macabeilor" },
  "3Mac": { name: "3 Macabei",                   slug: "cartea-treia-macabeilor" },

  // ---- Cărţi didactice / poetice ----
  "Iov":  { name: "Iov",                         slug: "cartea-lui-iov" },
  "Ps":   { name: "Psalmii",                     slug: "psalmii", isPsalm: true },
  "Pilde":{ name: "Pildele lui Solomon",         slug: "pildele-lui-solomon" }, // "Proverbele lui Solomon"
  "Ecc":  { name: "Ecclesiastul",                slug: "ecclesiastul" },
  "Cant": { name: "Cântarea Cântărilor",         slug: "cantarea-cantarilor" },
  "Sol":  { name: "Înţelepciunea lui Solomon",   slug: "cartea-intelepciunii-lui-solomon" },
  "Sir":  { name: "Înţelepciunea lui Isus Sirah",slug: "cartea-intelepciunii-lui-isus-fiul-lui-sirah-ecclesiasticul" },

  // ---- Profeţi ----
  "Is":   { name: "Isaia",                       slug: "isaia" },
  "Ir":   { name: "Ieremia",                     slug: "ieremia" },
  "Plg":  { name: "Plângerile lui Ieremia",      slug: "plangerile-lui-ieremia" },
  "Bar":  { name: "Baruh",                       slug: "cartea-lui-baruh" },
  "Iz":   { name: "Iezechiel",                   slug: "iezechiel" },
  "Dn":   { name: "Daniel",                      slug: "daniel" },
  "Os":   { name: "Osea",                        slug: "osea" },
  "Am":   { name: "Amos",                        slug: "amos" },
  "Mi":   { name: "Miheia",                      slug: "miheia" },
  "Ioil": { name: "Ioil",                        slug: "ioil" },
  "Avdia":{ name: "Avdia",                       slug: "avdia" },
  "Iona": { name: "Iona",                        slug: "iona" },
  "Naum": { name: "Naum",                        slug: "naum" },
  "Avc":  { name: "Avacum",                      slug: "avacum" },
  "Sof":  { name: "Sofonie",                     slug: "sofonie" },
  "Ag":   { name: "Agheu",                       slug: "agheu" },
  "Za":   { name: "Zaharia",                     slug: "zaharia" },
  "Mal":  { name: "Maleahi",                     slug: "maleahi" },

  // ---- Noul Testament ----
  "Mt":   { name: "Matei",                       slug: "sfanta-evanghelie-dupa-matei" },
  "Mc":   { name: "Marcu",                       slug: "sfanta-evanghelie-dupa-marcu" },
  "Lc":   { name: "Luca",                        slug: "sfanta-evanghelie-dupa-luca" },
  "In":   { name: "Ioan",                        slug: "sfanta-evanghelie-dupa-ioan" },
  "FA":   { name: "Faptele Apostolilor",         slug: "faptele-sfintilor-apostoli" },
  "Rm":   { name: "Romani",                      slug: "epistola-catre-romani-sfantului-apostol-pavel" },
  "1Co":  { name: "1 Corinteni",                 slug: "epistola-intai-catre-corinteni-sfantului-apostol-pavel" },
  "2Co":  { name: "2 Corinteni",                 slug: "epistola-doua-catre-corinteni-sfantului-apostol-pavel" },
  "Ga":   { name: "Galateni",                    slug: "epistola-catre-galateni-sfantului-apostol-pavel" },
  "Ef":   { name: "Efeseni",                     slug: "epistola-catre-efeseni-sfantului-apostol-pavel" },
  "Flp":  { name: "Filipeni",                    slug: "epistola-catre-filipeni-sfantului-apostol-pavel" },
  "Col":  { name: "Coloseni",                    slug: "epistola-catre-coloseni-sfantului-apostol-pavel" },
  "1Tes": { name: "1 Tesaloniceni",              slug: "epistola-intai-catre-tesaloniceni-sfantului-apostol-pavel" },
  "2Tes": { name: "2 Tesaloniceni",              slug: "epistola-doua-catre-tesaloniceni-sfantului-apostol-pavel" },
  "1Tim": { name: "1 Timotei",                   slug: "epistola-intai-catre-timotei-sfantului-apostol-pavel" },
  "2Tim": { name: "2 Timotei",                   slug: "epistola-doua-catre-timotei-sfantului-apostol-pavel" },
  "Tit":  { name: "Tit",                         slug: "epistola-catre-tit-sfantului-apostol-pavel" },
  "Flm":  { name: "Filimon",                     slug: "epistola-catre-filimon-sfantului-apostol-pavel" },
  "Evr":  { name: "Evrei",                       slug: "epistola-catre-evrei-sfantului-apostol-pavel" },
  "Iac":  { name: "Iacov",                       slug: "epistola-soborniceasca-sfantului-apostol-iacov" },
  "1Ptr": { name: "1 Petru",                     slug: "intaia-epistola-soborniceasca-sfantului-apostol-petru" },
  "2Ptr": { name: "2 Petru",                     slug: "doua-epistola-soborniceasca-sfantului-apostol-petru" },
  "1In":  { name: "1 Ioan",                      slug: "intaia-epistola-soborniceasca-sfantului-apostol-ioan" },
  "2In":  { name: "2 Ioan",                      slug: "doua-epistola-soborniceasca-sfantului-apostol-ioan" },
  "3In":  { name: "3 Ioan",                      slug: "treia-epistola-soborniceasca-sfantului-apostol-ioan" },
  "Iuda": { name: "Iuda",                        slug: "epistola-soborniceasca-sfantului-apostol-iuda" },
  "Ap":   { name: "Apocalipsa",                  slug: "apocalipsa-sfantului-ioan-teologul" },

  // ---- Fragmente deuterocanonice (fără pagină proprie sigură => căutare) ----
  "Man":  { name: "Rugăciunea lui Manasse",      search: "Rugăciunea lui Manasse" },
  "Tin":  { name: "Cântarea celor trei tineri",  search: "Cântarea celor trei tineri" },
  "Sus":  { name: "Istoria Susanei",             search: "Istoria Susanei" },
  "Bel":  { name: "Bel şi Balaurul",             search: "Bel şi Balaurul" },
  "Epist":{ name: "Epistola lui Ieremia",        search: "Epistola lui Ieremia" },
};

const DOX_BASE = "https://doxologia.ro/";

/** Construieşte URL-ul oficial Doxologia pentru o carte + capitol. */
function chapterUrl(abbr, chapter) {
  const b = BOOKS[abbr];
  if (!b) return DOX_BASE + "biblia-ortodoxa";
  if (b.search) {
    return DOX_BASE + "cauta?query=" + encodeURIComponent(b.search + " capitolul " + chapter);
  }
  if (b.isPsalm) {
    return DOX_BASE + "psalmii-psalmul-" + chapter;
  }
  return DOX_BASE + b.slug + "-capitolul-" + chapter;
}

function bookName(abbr) {
  return (BOOKS[abbr] && BOOKS[abbr].name) || abbr;
}