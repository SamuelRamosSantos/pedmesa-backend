// O primeiro endereço de um cliente é sempre o principal, para o formulário do delivery
// ter um endereço pré-selecionado. Depois disso, vale o que o operador pediu.
export function deveSerPrincipal(principalSolicitado: boolean, quantidadeEnderecosExistentes: number): boolean {
  return principalSolicitado || quantidadeEnderecosExistentes === 0;
}
