const MARCAS_DE_ACENTO = /[̀-ͯ]/g;
const ESPACOS_REPETIDOS = /\s+/g;

// Chave de comparação para bairro e cidade: o bairro devolvido pelo ViaCEP precisa
// casar com o cadastrado pelo dono, independentemente de acento, caixa ou espaços.
// "Jardim São Paulo" e "jardim sao  paulo" viram "jardim sao paulo".
export function normalizarLocalidade(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(MARCAS_DE_ACENTO, "")
    .toLowerCase()
    .trim()
    .replace(ESPACOS_REPETIDOS, " ");
}
