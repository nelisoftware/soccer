/**
 * Mask to name
 *
 * @example
 * formatName('cidade DE MACAPÁ')
 * @param name {string} - Name to be formatted.
 * @returns  formatted name - Cidade de Macapá
 */

export function maskedName(fullName: string | null) {
  if (!fullName) return '';

  const words = fullName.trim().split(/\s+/);

  if (words.length === 1) return words[0];

  return words
    .map((word, index) => {
      if (index === 0) return word;

      const visibleChars = Math.min(index === words.length - 1 ? 2 : 1, word.length);
      const visible = word.slice(0, visibleChars);
      const masked = '*'.repeat(word.length - visibleChars);

      return visible + masked;
    })
    .join(' ');
}
