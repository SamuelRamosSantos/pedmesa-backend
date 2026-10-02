// O tenant ainda não tem fuso próprio; todos os estabelecimentos atuais estão no
// horário de Brasília. Quando existir tenants.fuso_horario, ele entra aqui.
export const FUSO_PADRAO_NUMERACAO = "America/Sao_Paulo";

// Dia (YYYY-MM-DD) usado para reiniciar a numeração do delivery. Calculado no fuso do
// estabelecimento, não em UTC: com UTC, a numeração "viraria o dia" às 21h em Brasília.
export function dataDaNumeracao(agora: Date, fusoHorario: string = FUSO_PADRAO_NUMERACAO): string {
  // en-CA formata datas como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fusoHorario,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}
