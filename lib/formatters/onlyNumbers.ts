/**
 * Format string to just number
 *
 * @example
 * formatNumberOnly('68.900-074')
 * @param str {string} - String with number and others caracteres.
 * @returns only numbers -  68900074
 */
export function onlyNumberFormat(str?: string | null) {
  if (!str?.trim()) return '';

  return str.replace(/\D/g, '');
}