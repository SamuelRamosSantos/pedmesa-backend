import { AppError } from "../../../shared/errors/app-error";

const IP_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function assertValidIp(ip: unknown): string {
  if (typeof ip !== "string" || !IP_REGEX.test(ip) || !ip.split(".").every((octeto) => Number(octeto) <= 255)) {
    throw new AppError("ip deve ser um endereço IPv4 válido (ex.: 192.168.0.100).", 400);
  }

  return ip;
}

export function assertValidPorta(porta: unknown): number {
  if (typeof porta !== "number" || !Number.isInteger(porta) || porta < 1 || porta > 65535) {
    throw new AppError("porta deve ser um número inteiro entre 1 e 65535.", 400);
  }

  return porta;
}

export function assertValidNome(nome: unknown): string {
  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new AppError("nome é obrigatório.", 400);
  }

  return nome.trim();
}
