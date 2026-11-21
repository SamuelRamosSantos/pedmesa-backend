// Lê uma env var numérica com fallback — nunca deixa um valor inválido/ausente
// virar NaN silencioso num limite de rate limit, timeout, etc.
export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw !== undefined ? Number(raw) : NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
