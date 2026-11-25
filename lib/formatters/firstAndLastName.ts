/**
 * Format a name First and Last name
 *
 * @example
 * formatNameFirstAndLast('nelis Nelson Nazaré Pereira')
 * @param name {string} - Name to be formatted.
 * @returns  formatted name - Nelis Pereira
 */

import { nameFormat } from "./name";

export function firstAndLastNameFormat(name?: string | null | undefined) {
  if (!name) return '';
  const parts = nameFormat(name).trim().split(/\s+/); // divide por qualquer espaço extra
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1]}`;
}