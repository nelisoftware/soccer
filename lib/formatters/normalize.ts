/**
 * Normaliza as palavras
 *
 * @example
 * Normalize('Macapá ñ tem saúde')
 * @param text {string} - Texto que pode conter acentuação.
 * @returns  formatted normalize - Macapa n tem saude
 */
export function normalize(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .normalize('NFD') // Decompõe os acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos
    .replace(/ñ/g, 'n') // Substitui ñ
    .replace(/Ñ/g, 'N'); // Substitui Ñ
}


/**
 * Normaliza as palavras e retorna miuscula
 *
 * @example
 * NormalizeLower('Macapá ñ tem saúde')
 * @param text {string} - Texto que pode conter acentuação.
 * @returns  formatted normalize - macapa n tem saude
 */
export function normalizeLower(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .normalize('NFD') // Decompõe os acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos
    .replace(/ñ/g, 'n') // Substitui ñ
    .replace(/Ñ/g, 'N')
    .toLocaleLowerCase();
}
