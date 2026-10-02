import { apenasDigitos } from "../../../shared/utils/apenas-digitos";

const CARACTERES_DE_MASCARA_PERMITIDOS = /^[\d\s.-]*$/;

// Converte um CEP digitado ("01310-100", "01.310-100") para 8 dígitos. Devolve null
// quando sobra qualquer outro caractere (ex.: letra "O" no lugar de zero) ou quando
// não há exatamente 8 dígitos. Um CEP com 7 dígitos é rejeitado em vez de completado
// com zero, porque não dá para saber qual dígito faltou.
export function normalizarCep(valor: string): string | null {
  if (!CARACTERES_DE_MASCARA_PERMITIDOS.test(valor)) {
    return null;
  }

  const digitos = apenasDigitos(valor);

  return digitos.length === 8 ? digitos : null;
}
