/**
 * Remove text accent
 *
 * @example
 * formatWithoutAccent('Macapá')
 * @param str {any} - text.
 * @returns text without accent
 */
export function withoutAccentFormat(str?: string | null) {
  if (!str) return '';

 return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}