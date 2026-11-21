const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

// Só entende os formatos usados neste projeto para expiresIn de JWT (ex.: "1d",
// "30m") — não é um parser genérico de todas as strings que a lib "ms" aceita.
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration.trim());

  if (!match) {
    throw new Error(`Formato de duração inválido: "${duration}". Use algo como "30m", "1d" ou "12h".`);
  }

  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit];
}
