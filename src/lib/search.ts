// Smart search utilities: case-insensitive, accent-insensitive,
// and Greeklish ↔ Greek tolerant.

const GREEK_TO_LATIN: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th",
  ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p",
  ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps",
  ω: "o",
};

// Multi-char digraphs first
const LATIN_DIGRAPHS: Array<[string, string]> = [
  ["th", "θ"], ["ch", "χ"], ["kh", "χ"], ["ps", "ψ"], ["ks", "ξ"],
  ["ai", "αι"], ["ei", "ει"], ["oi", "οι"], ["ou", "ου"],
  ["au", "αυ"], ["eu", "ευ"],
  ["mp", "μπ"], ["nt", "ντ"], ["gk", "γκ"], ["gg", "γγ"],
  ["ts", "τσ"], ["tz", "τζ"],
];

const LATIN_SINGLE: Record<string, string> = {
  a: "α", b: "β", v: "β", g: "γ", d: "δ", e: "ε", z: "ζ",
  h: "η", i: "ι", y: "υ", k: "κ", l: "λ", m: "μ", n: "ν",
  x: "ξ", o: "ο", p: "π", r: "ρ", s: "σ", t: "τ", f: "φ",
  u: "υ", w: "ω", j: "ζ", c: "κ", q: "κ",
};

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const toLatin = (s: string) => {
  let out = "";
  for (const ch of s) out += GREEK_TO_LATIN[ch] ?? ch;
  return out;
};

const toGreek = (s: string) => {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const di = s.slice(i, i + 2);
    const dg = LATIN_DIGRAPHS.find(([k]) => k === di);
    if (dg) {
      out += dg[1];
      i += 2;
      continue;
    }
    out += LATIN_SINGLE[s[i]] ?? s[i];
    i += 1;
  }
  return out;
};

/** Normalize for searching: lowercase, no accents, trimmed. */
export const normalize = (s: string | null | undefined): string => {
  if (!s) return "";
  return stripAccents(String(s).toLowerCase()).trim();
};

/** Returns true if `query` matches `text` in any direction (Greek/Greeklish/accent-insensitive). */
export const smartMatch = (text: string | null | undefined, query: string): boolean => {
  if (!query) return true;
  if (!text) return false;
  const t = normalize(text);
  const q = normalize(query);
  if (t.includes(q)) return true;
  // also compare in latin form (handles user typing greek but field is latin and vice-versa)
  const tLat = toLatin(t);
  const qLat = toLatin(q);
  if (tLat.includes(qLat)) return true;
  const tGr = toGreek(t);
  const qGr = toGreek(q);
  if (tGr.includes(qGr)) return true;
  if (tLat.includes(qGr) || tGr.includes(qLat)) return true;
  return false;
};

/** Convenience: match any of the provided fields. */
export const smartMatchAny = (
  fields: Array<string | null | undefined>,
  query: string
): boolean => fields.some((f) => smartMatch(f, query));
