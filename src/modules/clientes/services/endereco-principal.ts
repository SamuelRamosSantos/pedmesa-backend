// O primeiro endereço de um cliente é sempre o principal, para o formulário do delivery
// ter um endereço pré-selecionado. Depois disso, vale o que o operador pediu.
export function deveSerPrincipal(principalSolicitado: boolean, quantidadeEnderecosExistentes: number): boolean {
  return principalSolicitado || quantidadeEnderecosExistentes === 0;
}

export interface EnderecoCandidato {
  id: string;
  criadoEm: Date;
}

// Ao excluir o endereço principal, o mais recente dos que sobraram assume (costuma ser
// o endereço atual do cliente). Sem endereços restantes, não há principal.
export function proximoPrincipalAposRemocao(restantes: EnderecoCandidato[]): string | null {
  if (restantes.length === 0) {
    return null;
  }

  const maisRecente = restantes.reduce((atual, candidato) =>
    candidato.criadoEm.getTime() > atual.criadoEm.getTime() ? candidato : atual
  );

  return maisRecente.id;
}
