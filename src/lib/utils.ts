import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Map of Greek accented characters to their non-accented equivalents
const greekAccentMap: Record<string, string> = {
  'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
  'Ά': 'α', 'Έ': 'ε', 'Ή': 'η', 'Ί': 'ι', 'Ό': 'ο', 'Ύ': 'υ', 'Ώ': 'ω',
  'ΐ': 'ι', 'ΰ': 'υ', 'ϊ': 'ι', 'ϋ': 'υ', 'Ϊ': 'ι', 'Ϋ': 'υ',
};

// Greek -> Latin transliteration (single char). Digraphs handled below.
const greekToLatin: Record<string, string> = {
  'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
  'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
  'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
  'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
};

// Lowercase + strip Greek accents (keeps original Greek script)
export function normalizeGreekText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .split('')
    .map((c) => greekAccentMap[c] || c)
    .join('');
}

/**
 * Build a "fuzzy fingerprint" that ignores:
 *  - case, accents, language (Greek vs Latin transliteration)
 *  - digraph variants (gk/g, mp/b, nt/d, ks/x, ps)
 *  - double letters (gg -> g)
 *  - trailing -s (Greek surnames often end in -ς/-σ/-s)
 *  - non-letter characters (spaces, punctuation)
 *
 * Examples that all collapse to the same fingerprint:
 *  "Γκόγκος" -> "gogos" -> "gogo"
 *  "ΓΚΟΓΚΟΣ" -> "gogos" -> "gogo"
 *  "gkogkos"  -> "gogos" -> "gogo"
 *  "gogos"    -> "gogos" -> "gogo"
 */
export function fuzzyFingerprint(text: string): string {
  if (!text) return "";

  // 1. lowercase + strip Greek accents
  let s = normalizeGreekText(text);

  // 2. strip Latin accents (NFD: é -> e + combining mark, then drop marks)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Greek digraph "ου" -> "u" before single-char translit
  s = s.replace(/ου/g, "u");

  // 4. Greek -> Latin transliteration (char by char)
  s = s
    .split("")
    .map((c) => greekToLatin[c] ?? c)
    .join("");

  // 5. keep only a-z and digits
  s = s.replace(/[^a-z0-9]/g, "");

  // 6. collapse common digraph variants (Greek phonetic spellings in Latin)
  s = s
    .replace(/ou/g, "u")     // ου -> u (Latin form)
    .replace(/gk/g, "g")     // γκ -> g
    .replace(/nk/g, "g")     // alt spelling
    .replace(/mp/g, "b")     // μπ -> b
    .replace(/nt/g, "d")     // ντ -> d
    .replace(/ks/g, "x")     // ks -> x
    .replace(/ph/g, "f")     // ph -> f
    .replace(/th/g, "t")     // th -> t (loose)
    .replace(/ch/g, "k")     // χ -> k
    .replace(/ai/g, "e")     // αι -> e
    .replace(/ei/g, "i")     // ει -> i
    .replace(/oi/g, "i")     // οι -> i
    .replace(/y/g, "i");     // y -> i

  // 6. collapse double letters (gg -> g, etc.)
  s = s.replace(/(.)\1+/g, "$1");

  // 7. drop trailing s (surname endings)
  s = s.replace(/s+$/g, "");

  return s;
}
