export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}
