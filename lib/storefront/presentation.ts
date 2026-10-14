/**
 * How catalogue strings are presented, in one place.
 *
 * Retailer and manufacturer data arrives spelled for search engines rather
 * than for reading: "Bồn Cầu TOTO MS636DT8" in ecommerce title case,
 * "740×490×670 mm" with no spaces, "305mm" and "4.5/3L" with the unit welded
 * to the number. Formatting that at each call site is how a page ends up
 * showing the same measurement three ways, so every surface goes through
 * these functions.
 *
 * None of this edits stored data. The catalogue keeps the manufacturer's
 * spelling; only the rendering changes.
 */

/**
 * Tokens that keep their capitals: brands, and words a brand spells that way.
 *
 * Checked case-insensitively, and the product's own brand is added at the call
 * site, so a brand the list has never heard of still survives.
 */
const KEEP_CASE = new Set([
  'toto', 'inax', 'jomoo', 'caesar', 'viglacera', 'grohe', 'kohler', 'hafele',
  'häfele', 'bancoot', 'huge', 'cotto', 'american', 'standard', 'lixil',
  'washlet', 'cefiontect', 'tornado', 'rimless', 'aqua', 'ceramic', 'nano',
  'led', 'abs', 'pvc', 'cad', 'bim', '3d', 'eco',
]);

/** A word that is a model code rather than prose: has a digit, or is all caps. */
function isCode(word: string): boolean {
  const bare = word.replace(/[^\p{L}\p{N}]/gu, '');
  if (!bare) return false;
  if (/\d/.test(bare)) return true;
  return bare.length > 1 && bare === bare.toUpperCase();
}

/**
 * Vietnamese sentence case for a product name.
 *
 * "Bồn Cầu TOTO MS636DT8" reads as a listing title; "Bồn cầu TOTO MS636DT8"
 * reads as a product. Only Title Case prose words are lowered — model codes,
 * all-caps tokens and brand names are left exactly as the manufacturer wrote
 * them, and the SKU is never touched.
 */
export function productDisplayName(name: string, brand?: string): string {
  const keep = new Set(KEEP_CASE);
  for (const part of (brand ?? '').split(/\s+/)) {
    if (part) keep.add(part.toLowerCase());
  }

  const words = name.trim().split(/(\s+)/);
  let seenWord = false;

  return words
    .map((word) => {
      if (!word.trim()) return word;
      const lower = word.toLowerCase();
      const bare = lower.replace(/[^\p{L}\p{N}]/gu, '');

      if (!seenWord) {
        seenWord = true;
        // The first word carries the sentence's capital, unless it is a code.
        return isCode(word) || keep.has(bare) ? word : word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (isCode(word) || keep.has(bare)) return word;
      return lower;
    })
    .join('');
}

/**
 * A measurement spelled consistently.
 *
 * Separates a unit from its number, spaces the × in a dimension triple, and
 * normalises the litre symbol. Anything it does not recognise is returned
 * untouched rather than guessed at — a value this cannot parse is a value the
 * showroom typed, and inventing a format for it would misreport it.
 */
export function formatMeasurement(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim().replace(/\s+/g, ' ');
  if (!value) return null;

  // 740x490x670 / 740×490×670 → 740 × 490 × 670
  value = value.replace(
    /(\d[\d.,]*)\s*[x×*]\s*(\d[\d.,]*)\s*[x×*]\s*(\d[\d.,]*)/gi,
    '$1 × $2 × $3'
  );
  value = value.replace(/(\d[\d.,]*)\s*[x×*]\s*(\d[\d.,]*)/gi, '$1 × $2');

  // 305mm → 305 mm, 4.5/3L → 4.5/3 L, 6kg → 6 kg
  value = value.replace(/(\d)\s*(mm|cm|m|kg|g|l|lít|lit|ml|w|v)\b/gi, (_m, digit: string, unit: string) => {
    const lower = unit.toLowerCase();
    const spelled = lower === 'l' ? 'L' : lower === 'lít' || lower === 'lit' ? 'lít' : lower;
    return `${digit} ${spelled}`;
  });

  return value.replace(/\s+/g, ' ').trim();
}
