/**
 * Mascara CPF
 *
 * @example
 * maskCPF('12345678901')
 * // 123.***.***-01
 *
 * @param cpf {string | null} - CPF a ser mascarado.
 * @returns CPF mascarado
 */

export function maskedCPF(cpf: string | null) {
  if (!cpf) return '';

  // Remove tudo que não for número
  const cleaned = cpf.replace(/\D/g, '');

  // Valida tamanho do CPF
  if (cleaned.length !== 11) return cpf;

  return cleaned.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    (_, p1, _p2, _p3, p4) => `${p1}.***.***-${p4}`
  );
}