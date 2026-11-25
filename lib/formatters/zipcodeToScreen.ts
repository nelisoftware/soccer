/**
 * @example
 * formatZipCodeToScreen(68900000)
 *
 * @param zipCode {string} Zip code to be formatted
 * @returns Zip Code formated - 68900-000
 */
export function zipCodeToScreenFormat(zipCode?: string | null) {
  if (!zipCode?.trim()) return '';

  const cleanZipCode = zipCode.replace(/\D/g, '');

  if (cleanZipCode.length === 8) {
    return cleanZipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  return zipCode;
}
