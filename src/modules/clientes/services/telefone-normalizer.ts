import { apenasDigitos } from "../../../shared/utils/apenas-digitos";

const CODIGO_PAIS_BRASIL = "55";

// Converte um telefone brasileiro digitado de qualquer jeito para só dígitos com DDD
// (10 dígitos para fixo, 11 para celular). Devolve null quando não é um telefone válido.
// Aceita prefixo +55 e o zero de operadora antes do DDD ("(011) …").
export function normalizarTelefone(valor: string): string | null {
  let digitos = apenasDigitos(valor);

  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith(CODIGO_PAIS_BRASIL)) {
    digitos = digitos.slice(CODIGO_PAIS_BRASIL.length);
  } else if ((digitos.length === 11 || digitos.length === 12) && digitos.startsWith("0")) {
    digitos = digitos.slice(1);
  }

  if (digitos.length !== 10 && digitos.length !== 11) {
    return null;
  }

  if (!dddValido(digitos.slice(0, 2))) {
    return null;
  }

  const primeiroDigitoDoNumero = digitos[2];
  const ehCelular = digitos.length === 11;

  if (ehCelular && primeiroDigitoDoNumero !== "9") {
    return null;
  }

  if (!ehCelular && !["2", "3", "4", "5"].includes(primeiroDigitoDoNumero)) {
    return null;
  }

  return digitos;
}

// DDDs brasileiros vão de 11 a 99 e nenhum termina em zero.
function dddValido(ddd: string): boolean {
  return ddd[0] !== "0" && ddd[1] !== "0";
}
