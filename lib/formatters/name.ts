/**
 * Format a name
 *
 * @example
 * formatName('cidade DE MACAPÁ')
 * @param name {string} - Name to be formatted.
 * @returns  formatted name - Cidade de Macapá
 */
export function nameFormat(name?: string | null) {
  if (!name) return '';
  return name
    .split(/\s+/)
    .map(word => {
      const lowercaseWord = word.toLocaleLowerCase();

      if (word.length <= 1) return lowercaseWord.toUpperCase();

      if (['de', 'da', 'do', 'ao'].includes(lowercaseWord)) {
        return lowercaseWord;
      }

      if (word.length == 2) return lowercaseWord.toUpperCase();

      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            if (part.length <= 1) return part.toUpperCase();
            if (part.length === 2) return part.toUpperCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }

      const result =
        word[0].toLocaleUpperCase() + lowercaseWord.slice(1, word.length);
      const tracoIndex = result.indexOf('-');

      if (tracoIndex === -1 || tracoIndex === result.length - 1) {
        return result;
      }

      return (
        result.slice(0, tracoIndex + 1) +
        result[tracoIndex + 1].toLocaleUpperCase() +
        result.slice(tracoIndex + 2)
      );
    })
    .join(' ');
}